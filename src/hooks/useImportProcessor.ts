"use client";

import { useState, useCallback, useRef } from "react";
import type { ImportRowResultItem } from "@/components/import/ImportResultsTable";
import type { EntityType, ImportMode } from "@/types/entities";
import type { FieldMapping } from "@/types/mapping";

interface ImportProgress {
  processed: number;
  total: number;
  succeeded: number;
  failed: number;
  createdCount: number;
  updatedCount: number;
}

interface ImportSummary {
  total: number;
  succeeded: number;
  failed: number;
  createdCount: number;
  updatedCount: number;
  durationMs: number;
  sessionId: string;
}

interface ImportProcessorState {
  isRunning: boolean;
  progress: ImportProgress;
  results: ImportRowResultItem[];
  summary: ImportSummary | null;
  error: string | null;
}

interface StartImportOptions {
  connectionId: string;
  entityType: EntityType;
  mode: ImportMode;
  rows: Record<string, string>[];
  mappings: FieldMapping[];
  defaultValues: Record<string, string>;
  fileName: string;
}

export function useImportProcessor() {
  const [state, setState] = useState<ImportProcessorState>({
    isRunning: false,
    progress: { processed: 0, total: 0, succeeded: 0, failed: 0, createdCount: 0, updatedCount: 0 },
    results: [],
    summary: null,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const startImport = useCallback(async (options: StartImportOptions) => {
    // Reset state
    setState({
      isRunning: true,
      progress: { processed: 0, total: options.rows.length, succeeded: 0, failed: 0, createdCount: 0, updatedCount: 0 },
      results: [],
      summary: null,
      error: null,
    });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/import/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Import failed" }));
        setState((prev) => ({
          ...prev,
          isRunning: false,
          error: errorData.error || `Import failed (${response.status})`,
        }));
        return;
      }

      if (!response.body) {
        setState((prev) => ({
          ...prev,
          isRunning: false,
          error: "No response stream received",
        }));
        return;
      }

      // Read the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let eventType = "";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            dataStr = line.slice(6);
          } else if (line === "" && eventType && dataStr) {
            // End of an event
            try {
              const data = JSON.parse(dataStr);

              if (eventType === "progress") {
                const batchResults: ImportRowResultItem[] = (data.batchResults || []).map(
                  (r: { rowIndex: number; keyValue: string; success: boolean; operation?: string; error?: string }) => ({
                    rowIndex: r.rowIndex,
                    keyValue: r.keyValue,
                    success: r.success,
                    operation: r.operation,
                    error: r.error,
                  })
                );

                setState((prev) => ({
                  ...prev,
                  progress: {
                    processed: data.processed,
                    total: data.total,
                    succeeded: data.succeeded,
                    failed: data.failed,
                    createdCount: data.createdCount || 0,
                    updatedCount: data.updatedCount || 0,
                  },
                  results: [...prev.results, ...batchResults],
                }));
              } else if (eventType === "complete") {
                setState((prev) => ({
                  ...prev,
                  isRunning: false,
                  summary: {
                    total: data.summary.total,
                    succeeded: data.summary.succeeded,
                    failed: data.summary.failed,
                    createdCount: data.summary.createdCount || 0,
                    updatedCount: data.summary.updatedCount || 0,
                    durationMs: data.summary.durationMs,
                    sessionId: data.sessionId,
                  },
                }));
              } else if (eventType === "cancelled") {
                setState((prev) => ({
                  ...prev,
                  isRunning: false,
                  error: "Import was cancelled",
                  summary: {
                    total: prev.progress.total,
                    succeeded: data.succeeded ?? prev.progress.succeeded,
                    failed: data.failed ?? prev.progress.failed,
                    createdCount: prev.progress.createdCount,
                    updatedCount: prev.progress.updatedCount,
                    durationMs: 0,
                    sessionId: data.sessionId,
                  },
                }));
              } else if (eventType === "error") {
                setState((prev) => ({
                  ...prev,
                  isRunning: false,
                  error: data.message,
                }));
              }
            } catch {
              // Skip malformed events
            }

            eventType = "";
            dataStr = "";
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setState((prev) => ({
          ...prev,
          isRunning: false,
          error: "Import cancelled",
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isRunning: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    }
  }, []);

  const cancel = useCallback(async () => {
    // Abort the client-side stream
    abortRef.current?.abort();

    // Also signal server-side cancellation if we have a sessionId
    const sessionId = state.summary?.sessionId;
    if (sessionId) {
      try {
        await fetch(`/api/imports/${sessionId}/cancel`, { method: "POST" });
      } catch {
        // Best-effort server cancellation
      }
    }
  }, [state.summary?.sessionId]);

  return {
    ...state,
    startImport,
    cancel,
  };
}
