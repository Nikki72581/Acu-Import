"use client";

import { use, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WizardSteps } from "@/components/import/WizardSteps";
import { FileDropzone } from "@/components/import/FileDropzone";
import { FilePreview } from "@/components/import/FilePreview";
import { useFileParser } from "@/hooks/useFileParser";
import { useImportWizard } from "@/hooks/useImportWizard";
import { slugToEntityType, isValidImportMode } from "@/lib/utils/entity-utils";
import { ENTITY_CONFIGS } from "@/types/entities";

export default function UploadPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = use(params);
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "";

  const entityType = slugToEntityType(type);
  const validMode = isValidImportMode(mode);

  const { parsedFile, isLoading, error, parseFile, selectSheet } =
    useFileParser();

  const { setParsedFile, setEntityType, setImportMode } = useImportWizard();

  // Sync parsed file to wizard context
  useEffect(() => {
    setParsedFile(parsedFile);
  }, [parsedFile, setParsedFile]);

  // Sync entity type and import mode to wizard context
  useEffect(() => {
    if (entityType) setEntityType(entityType);
  }, [entityType, setEntityType]);

  useEffect(() => {
    if (validMode) setImportMode(mode as "create" | "create_or_update" | "update");
  }, [validMode, mode, setImportMode]);

  if (!entityType) {
    return (
      <div className="flex flex-col items-center py-20">
        <p className="text-sm text-destructive">
          Invalid entity type: &quot;{type}&quot;
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/import">Back to Import</Link>
        </Button>
      </div>
    );
  }

  if (!validMode) {
    return (
      <div className="flex flex-col items-center py-20">
        <p className="text-sm text-destructive">
          Invalid import mode: &quot;{mode}&quot;
        </p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link href="/import">Back to Import</Link>
        </Button>
      </div>
    );
  }

  const config = ENTITY_CONFIGS[entityType];

  return (
    <div>
      <WizardSteps currentStep={2} />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Upload File
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV or Excel file containing{" "}
          <span className="font-medium text-foreground">
            {config.entityLabel}
          </span>{" "}
          data.
        </p>
      </div>

      <FileDropzone
        onFileDrop={parseFile}
        isLoading={isLoading}
        error={error}
        hasFile={!!parsedFile}
      />

      {parsedFile && (
        <div className="mt-6">
          <FilePreview parsedFile={parsedFile} onSheetChange={selectSheet} />
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/import" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>

        {parsedFile && (
          <Button asChild className="gap-2">
            <Link href={`/import/${type}/map?mode=${mode}`}>
              Continue to Mapping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
