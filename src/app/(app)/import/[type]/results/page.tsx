"use client";

import { use, useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, Plus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WizardSteps } from "@/components/import/WizardSteps";
import { ImportProgress } from "@/components/import/ImportProgress";
import { ImportResultsTable } from "@/components/import/ImportResultsTable";
import { useImportWizard } from "@/hooks/useImportWizard";
import { useImportProcessor } from "@/hooks/useImportProcessor";
import { slugToEntityType } from "@/lib/utils/entity-utils";
import { ENTITY_CONFIGS } from "@/types/entities";

export default function ResultsPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = use(params);
  const router = useRouter();
  const entityType = slugToEntityType(type);

  const {
    parsedFile,
    mappings,
    defaultValues,
    connectionId,
    importMode,
    excludedRows,
    reset,
  } = useImportWizard();

  const {
    isRunning,
    progress,
    results,
    summary,
    error,
    startImport,
    cancel,
  } = useImportProcessor();

  const config = entityType ? ENTITY_CONFIGS[entityType] : null;
  const startedRef = useRef(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start elapsed time counter
  useEffect(() => {
    if (isRunning && !timerRef.current) {
      const start = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - start);
      }, 1000);
    }

    if (!isRunning && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning]);

  // Filter out excluded rows and start import
  useEffect(() => {
    if (startedRef.current) return;
    if (!parsedFile || !connectionId || !importMode || !entityType) {
      if (entityType) {
        router.replace(`/import/${type}/map`);
      }
      return;
    }

    startedRef.current = true;

    const filteredRows = parsedFile.rows.filter(
      (_, i) => !excludedRows.has(i)
    );

    startImport({
      connectionId,
      entityType,
      mode: importMode,
      rows: filteredRows,
      mappings,
      defaultValues,
      fileName: parsedFile.fileName,
    });
  }, [parsedFile, connectionId, importMode, entityType, excludedRows, mappings, defaultValues, startImport, router, type]);

  const handleExportCSV = useCallback(() => {
    if (results.length === 0) return;

    const headers = ["Row", "Key", "Status", "Operation", "Error"];
    const csvRows = results.map((r) =>
      [
        r.rowIndex + 1,
        `"${r.keyValue}"`,
        r.success ? "success" : "failed",
        r.operation || "",
        r.error ? `"${r.error.replace(/"/g, '""')}"` : "",
      ].join(",")
    );

    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  const handleNewImport = useCallback(() => {
    reset();
    router.push("/import");
  }, [reset, router]);

  const finalElapsed = useMemo(
    () => (summary ? summary.durationMs : elapsedMs),
    [summary, elapsedMs]
  );

  if (!entityType || !config) return null;

  return (
    <div>
      <WizardSteps currentStep={5} />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {isRunning ? "Importing..." : "Import Results"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isRunning
            ? `Sending ${config.entityLabel.toLowerCase()} to Acumatica...`
            : `Import of ${config.entityLabel.toLowerCase()} complete.`}
        </p>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress */}
      <div className="space-y-6">
        <ImportProgress
          processed={progress.processed}
          total={progress.total}
          succeeded={progress.succeeded}
          failed={progress.failed}
          createdCount={progress.createdCount}
          updatedCount={progress.updatedCount}
          isRunning={isRunning}
          elapsedMs={finalElapsed}
        />

        {/* Summary card when complete */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Import Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Processed <span className="font-medium text-foreground">{summary.total}</span> rows
                in{" "}
                <span className="font-medium text-foreground">
                  {(summary.durationMs / 1000).toFixed(1)}s
                </span>
                .{" "}
                <span className="text-emerald-400">{summary.succeeded} succeeded</span>
                {summary.failed > 0 && (
                  <>, <span className="text-red-400">{summary.failed} failed</span></>
                )}
                .
              </p>
              {(summary.createdCount > 0 || summary.updatedCount > 0) && (
                <p className="mt-1">
                  {summary.createdCount > 0 && `${summary.createdCount} created`}
                  {summary.createdCount > 0 && summary.updatedCount > 0 && ", "}
                  {summary.updatedCount > 0 && `${summary.updatedCount} updated`}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results table */}
        <div>
          <h2 className="mb-3 text-sm font-medium">Row Details</h2>
          <ImportResultsTable results={results} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          {isRunning ? (
            <Button variant="destructive" size="sm" onClick={cancel}>
              Cancel Import
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleExportCSV}
                disabled={results.length === 0}
              >
                <Download className="h-4 w-4" />
                Export Log as CSV
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="/logs">
                  <Clock className="h-4 w-4" />
                  View Import History
                </Link>
              </Button>
            </div>
          )}

          {!isRunning && (
            <Button className="gap-2" onClick={handleNewImport}>
              <Plus className="h-4 w-4" />
              Start New Import
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
