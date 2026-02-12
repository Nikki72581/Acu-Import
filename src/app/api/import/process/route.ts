import { auth } from "@clerk/nextjs/server";
import {
  getConnectionById,
  getRunningSessionByConnection,
  createImportSession,
  updateImportSession,
  createImportRowLogsBatch,
  getImportSessionById,
} from "@/lib/db/queries";

export const dynamic = "force-dynamic";
import { decryptCredentials } from "@/lib/acumatica/encryption";
import { AcumaticaClient } from "@/lib/acumatica/client";
import { getEntityAdapter } from "@/lib/acumatica/entities";
import type { EntityType, ImportMode } from "@/types/entities";
import type { AcumaticaCredentials } from "@/types/acumatica";
import type { FieldMapping } from "@/types/mapping";
import { humanizeError } from "@/lib/acumatica/error-parser";

interface ImportRequest {
  connectionId: string;
  entityType: EntityType;
  mode: ImportMode;
  rows: Record<string, string>[];
  mappings: FieldMapping[];
  defaultValues: Record<string, string>;
  fileName: string;
}

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 500;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: ImportRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { connectionId, entityType, mode, rows, mappings, defaultValues, fileName } = body;

  if (!connectionId || !entityType || !mode || !rows || !mappings) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return new Response(
      JSON.stringify({ error: "No rows to import" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!Array.isArray(mappings) || mappings.length === 0) {
    return new Response(
      JSON.stringify({ error: "No field mappings provided" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get connection
  const connection = await getConnectionById(connectionId, userId);
  if (!connection) {
    return new Response(
      JSON.stringify({ error: "Connection not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // One-import-per-connection enforcement
  const runningSession = await getRunningSessionByConnection(connectionId);
  if (runningSession) {
    return new Response(
      JSON.stringify({
        error: "An import is already running on this connection",
        sessionId: runningSession.id,
      }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  let credentials: AcumaticaCredentials;
  try {
    credentials = decryptCredentials<AcumaticaCredentials>(connection.credentials);
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to decrypt connection credentials" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const adapter = getEntityAdapter(entityType);
  const client = new AcumaticaClient(
    connection.instanceUrl,
    connection.apiVersion,
    credentials
  );

  // Fetch existing keys to determine create vs update operations
  let existingKeys: Set<string> | null = null;
  if (mode === "create_or_update" || mode === "create" || mode === "update") {
    try {
      existingKeys = await adapter.fetchExistingKeys(client);
    } catch {
      // Continue without — we'll just not differentiate created/updated
    }
  }

  // Create import session
  const session = await createImportSession({
    userId,
    connectionId,
    entityType,
    mode,
    fileName: fileName || "import.csv",
    totalRows: rows.length,
    status: "running",
    mappingUsed: mappings as unknown as Record<string, unknown>,
  });

  const sessionId = session!.id;
  const startTime = Date.now();

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      let succeeded = 0;
      let failed = 0;
      let createdCount = 0;
      let updatedCount = 0;

      try {
        // Process in batches
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          const batchResults: {
            rowIndex: number;
            keyValue: string;
            success: boolean;
            operation?: string;
            error?: string;
          }[] = [];
          const rowLogs: {
            sessionId: string;
            rowNumber: number;
            keyValue: string;
            status: string;
            operation?: string;
            mappedData?: Record<string, unknown>;
            errorMessage?: string;
            errorCode?: string;
          }[] = [];

          for (let j = 0; j < batch.length; j++) {
            const rowIndex = i + j;
            const row = batch[j];

            // Build the Acumatica record
            const record = adapter.mapRecord(row, mappings);

            // Apply default values
            for (const [fieldName, value] of Object.entries(defaultValues || {})) {
              if (value?.trim() && !record[fieldName]) {
                record[fieldName] = { value: value.trim() };
              }
            }

            // Extract key value
            const keyValue = record[adapter.keyField]?.value
              ? String(record[adapter.keyField].value)
              : `Row ${rowIndex + 1}`;

            // Push to Acumatica
            const result = await adapter.pushRecord(client, record);

            // Determine operation type
            let operation: string | undefined;
            if (result.success && existingKeys) {
              operation = existingKeys.has(keyValue) ? "updated" : "created";
              if (operation === "created") createdCount++;
              else updatedCount++;
            } else if (result.success) {
              // Default to created if we can't determine
              operation = "created";
              createdCount++;
            }

            if (result.success) {
              succeeded++;
            } else {
              failed++;
            }

            const humanizedError = result.error ? humanizeError(result.error) : undefined;

            batchResults.push({
              rowIndex,
              keyValue,
              success: result.success,
              operation: result.success ? operation : undefined,
              error: humanizedError,
            });

            rowLogs.push({
              sessionId,
              rowNumber: rowIndex + 1,
              keyValue,
              status: result.success ? "success" : "failed",
              operation: result.success ? (operation as string) : undefined,
              mappedData: record as unknown as Record<string, unknown>,
              errorMessage: humanizedError || undefined,
              errorCode: result.errorCode || undefined,
            });
          }

          // Persist row logs batch
          try {
            await createImportRowLogsBatch(rowLogs);
          } catch {
            // Log persistence failure shouldn't stop import
          }

          // Send progress event
          sendEvent("progress", {
            processed: Math.min(i + BATCH_SIZE, rows.length),
            total: rows.length,
            succeeded,
            failed,
            createdCount,
            updatedCount,
            batchResults,
          });

          // Check for cancellation between batches
          if (i + BATCH_SIZE < rows.length) {
            const currentSession = await getImportSessionById(sessionId, userId);
            if (currentSession?.status === "cancelled") {
              sendEvent("cancelled", {
                sessionId,
                message: "Import was cancelled",
                processed: Math.min(i + BATCH_SIZE, rows.length),
                succeeded,
                failed,
              });
              return; // controller.close() in finally
            }

            // Delay between batches
            await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
          }
        }

        const durationMs = Date.now() - startTime;

        // Update session with final counts
        await updateImportSession(sessionId, {
          status: "completed",
          successCount: succeeded,
          failCount: failed,
          createdCount,
          updatedCount,
          completedAt: new Date(),
          durationMs,
        });

        sendEvent("complete", {
          sessionId,
          summary: {
            total: rows.length,
            succeeded,
            failed,
            createdCount,
            updatedCount,
            durationMs,
          },
        });
      } catch (error) {
        const durationMs = Date.now() - startTime;
        const message = error instanceof Error ? error.message : "Unknown error";

        // Update session as failed
        await updateImportSession(sessionId, {
          status: "failed",
          successCount: succeeded,
          failCount: failed,
          createdCount,
          updatedCount,
          completedAt: new Date(),
          durationMs,
        });

        sendEvent("error", {
          message,
          sessionId,
          resumable: false,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
