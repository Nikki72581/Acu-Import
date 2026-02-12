"use client";

import { use, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WizardSteps } from "@/components/import/WizardSteps";
import { MappingGrid } from "@/components/import/MappingGrid";
import { ConnectionSelector } from "@/components/import/ConnectionSelector";
import { useImportWizard } from "@/hooks/useImportWizard";
import { useAutoMapping } from "@/hooks/useAutoMapping";
import { slugToEntityType } from "@/lib/utils/entity-utils";
import { ENTITY_CONFIGS } from "@/types/entities";
import type { FieldMapping, MappingTemplate } from "@/types/mapping";
import { loadTemplates, saveTemplate, deleteTemplate } from "./actions";

export default function MappingPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = use(params);
  const router = useRouter();
  const entityType = slugToEntityType(type);
  const {
    parsedFile,
    setMappings: setWizardMappings,
    setDefaultValues: setWizardDefaultValues,
    setConnectionId,
  } = useImportWizard();

  const [templates, setTemplates] = useState<MappingTemplate[]>([]);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [defaultValues, setDefaultValues] = useState<Record<string, string>>(
    {}
  );
  const [showConnectionSelector, setShowConnectionSelector] = useState(false);

  // Get entity config
  const config = entityType ? ENTITY_CONFIGS[entityType] : null;
  const fields = config?.fields ?? [];
  const aliases = config?.aliases ?? {};

  // Auto-mapping hook
  const {
    mappings,
    setMappings,
    updateMapping,
    mappingStats,
    resetMappings,
  } = useAutoMapping({
    parsedFile,
    fields,
    aliases,
  });

  // Load templates on mount
  useEffect(() => {
    if (!entityType) return;
    loadTemplates(entityType).then(
      (t) => setTemplates(t as unknown as MappingTemplate[]),
      () => {} // silently fail if DB not connected
    );
  }, [entityType]);

  // Redirect to upload if no parsed file
  useEffect(() => {
    if (!parsedFile && entityType) {
      router.replace(`/import/${type}/upload`);
    }
  }, [parsedFile, entityType, router, type]);

  const handleSaveTemplate = useCallback(
    async (name: string) => {
      if (!entityType) return;
      setIsSavingTemplate(true);
      try {
        const ignoredColumns = mappings
          .filter((m) => m.ignored)
          .map((m) => m.sourceColumn);
        const saved = await saveTemplate(
          entityType,
          name,
          mappings,
          ignoredColumns
        );
        if (saved) {
          setTemplates((prev) => [saved as unknown as MappingTemplate, ...prev]);
        }
      } catch {
        // Template save failed — could show toast
      } finally {
        setIsSavingTemplate(false);
      }
    },
    [entityType, mappings]
  );

  const handleLoadTemplate = useCallback(
    (template: MappingTemplate) => {
      if (!parsedFile) return;

      // Apply template mappings to current file headers
      const templateMap = new Map<string, FieldMapping>();
      for (const m of template.mappings) {
        templateMap.set(m.sourceColumn, m);
      }
      const ignoredSet = new Set(template.ignoredColumns ?? []);

      const newMappings: FieldMapping[] = parsedFile.headers.map((header) => {
        const saved = templateMap.get(header);
        if (saved) return { ...saved };
        if (ignoredSet.has(header)) {
          return {
            sourceColumn: header,
            targetField: null,
            confidence: "none" as const,
            ignored: true,
          };
        }
        return {
          sourceColumn: header,
          targetField: null,
          confidence: "none" as const,
          ignored: false,
        };
      });

      setMappings(newMappings);
    },
    [parsedFile, setMappings]
  );

  const handleDeleteTemplate = useCallback(async (id: string) => {
    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      // Delete failed
    }
  }, []);

  const handleDefaultValueChange = useCallback(
    (apiName: string, value: string) => {
      setDefaultValues((prev) => ({ ...prev, [apiName]: value }));
    },
    []
  );

  // Check if ready to continue: all required fields mapped or have defaults, no duplicate targets
  const canContinue = useMemo(() => {
    if (!config) return false;

    const requiredFields = fields.filter((f) => f.required);
    const mappedTargets = new Set(
      mappings
        .filter((m) => m.targetField && !m.ignored)
        .map((m) => m.targetField!)
    );

    // Check all required fields are either mapped or have defaults
    const allRequiredResolved = requiredFields.every(
      (f) => mappedTargets.has(f.apiName) || defaultValues[f.apiName]?.trim()
    );

    // Check no duplicate targets
    const targetList = mappings
      .filter((m) => m.targetField && !m.ignored)
      .map((m) => m.targetField!);
    const hasDuplicates = new Set(targetList).size !== targetList.length;

    return allRequiredResolved && !hasDuplicates;
  }, [config, fields, mappings, defaultValues]);

  const handleContinue = useCallback(() => {
    // Persist mappings and default values to wizard context
    setWizardMappings(mappings);
    setWizardDefaultValues(defaultValues);
    // Open connection selector
    setShowConnectionSelector(true);
  }, [mappings, defaultValues, setWizardMappings, setWizardDefaultValues]);

  const handleConnectionSelected = useCallback(
    (connectionId: string) => {
      setConnectionId(connectionId);
      router.push(`/import/${type}/preview`);
    },
    [setConnectionId, router, type]
  );

  if (!entityType || !config) {
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

  if (!parsedFile) {
    return null; // Will redirect
  }

  return (
    <div>
      <WizardSteps currentStep={3} />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Map Columns
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Map your file columns to{" "}
          <span className="font-medium text-foreground">
            {config.entityLabel}
          </span>{" "}
          fields. Auto-mapping has been applied — review and adjust as needed.
        </p>
      </div>

      <MappingGrid
        parsedFile={parsedFile}
        mappings={mappings}
        fields={fields}
        onUpdateMapping={updateMapping}
        onSetMappings={setMappings}
        onResetMappings={resetMappings}
        mappingStats={mappingStats}
        templates={templates}
        onSaveTemplate={handleSaveTemplate}
        onLoadTemplate={handleLoadTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        isSavingTemplate={isSavingTemplate}
        defaultValues={defaultValues}
        onDefaultValueChange={handleDefaultValueChange}
      />

      <div className="mt-8 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/import/${type}/upload`} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Upload
          </Link>
        </Button>

        <Button
          disabled={!canContinue}
          className="gap-2"
          onClick={handleContinue}
          title={
            canContinue
              ? "Continue to validation"
              : "Map all required fields or provide defaults"
          }
        >
          Continue to Validation
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <ConnectionSelector
        open={showConnectionSelector}
        onOpenChange={setShowConnectionSelector}
        onSelect={handleConnectionSelected}
      />
    </div>
  );
}
