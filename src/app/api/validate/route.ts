import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getConnectionById } from "@/lib/db/queries";

export const dynamic = "force-dynamic";
import { decryptCredentials } from "@/lib/acumatica/encryption";
import { AcumaticaClient } from "@/lib/acumatica/client";
import { getEntityAdapter } from "@/lib/acumatica/entities";
import { fetchLookupData } from "@/lib/validation/lookups";
import { validateRows } from "@/lib/validation/engine";
import type { EntityType, ImportMode } from "@/types/entities";
import type { AcumaticaCredentials } from "@/types/acumatica";
import type { FieldMapping } from "@/types/mapping";

interface ValidateRequest {
  connectionId: string;
  entityType: EntityType;
  mode: ImportMode;
  rows: Record<string, string>[];
  mappings: FieldMapping[];
  defaultValues: Record<string, string>;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ValidateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { connectionId, entityType, mode, rows, mappings, defaultValues } = body;

  if (!connectionId || !entityType || !mode || !rows || !mappings) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Get connection and decrypt credentials
  const connection = await getConnectionById(connectionId, userId);
  if (!connection) {
    return NextResponse.json(
      { error: "Connection not found" },
      { status: 404 }
    );
  }

  const adapter = getEntityAdapter(entityType);
  const fields = adapter.getFields();
  const lookupRequirements = adapter.getLookupRequirements();

  let credentials: AcumaticaCredentials;
  try {
    credentials = decryptCredentials<AcumaticaCredentials>(connection.credentials);
  } catch {
    return NextResponse.json(
      { error: "Failed to decrypt connection credentials" },
      { status: 500 }
    );
  }

  const client = new AcumaticaClient(
    connection.instanceUrl,
    connection.apiVersion,
    credentials
  );

  // Fetch lookup data
  const lookupResult = await fetchLookupData(client, lookupRequirements);

  // Fetch existing keys if mode requires it
  let existingKeys: Set<string> | null = null;
  if (mode === "create" || mode === "update") {
    try {
      existingKeys = await adapter.fetchExistingKeys(client);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      lookupResult.warnings.push(
        `Failed to fetch existing keys: ${message}. Mode-based validation will be skipped.`
      );
    }
  }

  // Run validation
  const validationResults = validateRows({
    rows,
    mappings,
    defaultValues: defaultValues || {},
    fields,
    keyField: adapter.keyField,
    lookups: {
      lookups: Object.fromEntries(
        Object.entries(lookupResult.lookups).map(([k, v]) => [k, v])
      ),
      existingKeys,
    },
    mode,
  });

  // Compute summary
  const summary = {
    total: validationResults.length,
    pass: validationResults.filter((r) => r.status === "pass").length,
    warn: validationResults.filter((r) => r.status === "warn").length,
    fail: validationResults.filter((r) => r.status === "fail").length,
  };

  return NextResponse.json({
    validationResults,
    lookupWarnings: lookupResult.warnings,
    summary,
  });
}
