"use client";

import { use, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WizardSteps } from "@/components/import/WizardSteps";
import { ValidationPreview } from "@/components/import/ValidationPreview";
import { useImportWizard } from "@/hooks/useImportWizard";
import { slugToEntityType } from "@/lib/utils/entity-utils";
import { ENTITY_CONFIGS } from "@/types/entities";
import type { RowValidationResult } from "@/lib/validation/engine";
import type { EntityType, ImportMode } from "@/types/entities";

interface ValidationResponse {
  validationResults: RowValidationResult[];
  lookupWarnings: string[];
  summary: { total: number; pass: number; warn: number; fail: number };
}

export default function PreviewPage({
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
    setExcludedRows,
  } = useImportWizard();

  const [validationResults, setValidationResults] = useState<RowValidationResult[]>([]);
  const [lookupWarnings, setLookupWarnings] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [editedRows, setEditedRows] = useState<Record<string, string>[]>([]);

  const config = entityType ? ENTITY_CONFIGS[entityType] : null;

  // Initialize editable rows from parsed file
  useEffect(() => {
    if (parsedFile?.rows) {
      setEditedRows(parsedFile.rows.map((r) => ({ ...r })));
    }
  }, [parsedFile]);

  // Redirect if missing required data
  useEffect(() => {
    if (!parsedFile || !connectionId || !importMode) {
      if (entityType) {
        router.replace(`/import/${type}/map`);
      }
    }
  }, [parsedFile, connectionId, importMode, entityType, router, type]);

  // Run validation
  useEffect(() => {
    if (!parsedFile || !connectionId || !importMode || !entityType || editedRows.length === 0) {
      return;
    }

    let cancelled = false;

    async function validate() {
      setIsValidating(true);
      setValidationError(null);

      try {
        const response = await fetch("/api/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            connectionId,
            entityType: entityType as EntityType,
            mode: importMode as ImportMode,
            rows: editedRows,
            mappings,
            defaultValues,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Validation failed (${response.status})`);
        }

        const data: ValidationResponse = await response.json();

        if (!cancelled) {
          setValidationResults(data.validationResults);
          setLookupWarnings(data.lookupWarnings);
        }
      } catch (error) {
        if (!cancelled) {
          setValidationError(
            error instanceof Error ? error.message : "Validation failed"
          );
        }
      } finally {
        if (!cancelled) {
          setIsValidating(false);
        }
      }
    }

    validate();

    return () => {
      cancelled = true;
    };
  }, [parsedFile, connectionId, importMode, entityType, editedRows, mappings, defaultValues]);

  const handleExcludeRow = useCallback(
    (rowIndex: number, excluded: boolean) => {
      setExcludedRows((prev) => {
        const next = new Set(prev);
        if (excluded) next.add(rowIndex);
        else next.delete(rowIndex);
        return next;
      });
    },
    [setExcludedRows]
  );

  const handleExcludeAllFailures = useCallback(() => {
    const failIndices = validationResults
      .filter((r) => r.status === "fail")
      .map((r) => r.rowIndex);
    setExcludedRows((prev) => {
      const next = new Set(prev);
      for (const idx of failIndices) next.add(idx);
      return next;
    });
  }, [validationResults, setExcludedRows]);

  const handleEditCell = useCallback(
    (rowIndex: number, column: string, value: string) => {
      setEditedRows((prev) => {
        const next = [...prev];
        next[rowIndex] = { ...next[rowIndex], [column]: value };
        return next;
      });
    },
    []
  );

  // Count rows to import (non-excluded)
  const importableRowCount = useMemo(() => {
    return editedRows.length - excludedRows.size;
  }, [editedRows, excludedRows]);

  if (!entityType || !config || !parsedFile || !connectionId || !importMode) {
    return null;
  }

  return (
    <div>
      <WizardSteps currentStep={4} />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Validate Data
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review validation results before importing{" "}
          <span className="font-medium text-foreground">
            {config.entityLabel}
          </span>
          . Fix issues or exclude problem rows.
        </p>
      </div>

      {/* Lookup warnings */}
      {lookupWarnings.length > 0 && (
        <div className="mb-4 space-y-2">
          {lookupWarnings.map((warning, i) => (
            <Alert key={i} variant="default" className="border-amber-500/20 bg-amber-500/5">
              <AlertDescription className="text-xs text-amber-400">
                {warning}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Loading state */}
      {isValidating && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Fetching reference data from Acumatica and validating rows...
          </p>
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Validation results */}
      {!isValidating && !validationError && validationResults.length > 0 && (
        <ValidationPreview
          results={validationResults}
          rows={editedRows}
          mappings={mappings}
          keyField={config.keyField}
          excludedRows={excludedRows}
          onExcludeRow={handleExcludeRow}
          onExcludeAllFailures={handleExcludeAllFailures}
          onEditCell={handleEditCell}
        />
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/import/${type}/map`} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Mapping
          </Link>
        </Button>

        <Button
          disabled={isValidating || importableRowCount === 0}
          className="gap-2"
          onClick={() => router.push(`/import/${type}/results`)}
        >
          Proceed to Import ({importableRowCount} rows)
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
