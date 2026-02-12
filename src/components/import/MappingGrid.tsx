"use client";

import { useMemo, useState, useCallback } from "react";
import { RotateCcw, Save, FolderOpen, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MappingRow, DefaultValueRow } from "./MappingRow";
import { TemplateSaveDialog } from "./TemplateSaveDialog";
import type { EntityField } from "@/types/entities";
import type { FieldMapping, MappingTemplate } from "@/types/mapping";
import type { ParsedFile } from "@/types/import";
import { getSampleValues } from "@/lib/mapping/engine";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MappingGridProps {
  parsedFile: ParsedFile;
  mappings: FieldMapping[];
  fields: EntityField[];
  onUpdateMapping: (index: number, updates: Partial<FieldMapping>) => void;
  onSetMappings: (mappings: FieldMapping[]) => void;
  onResetMappings: () => void;
  mappingStats: {
    total: number;
    mapped: number;
    exact: number;
    alias: number;
    fuzzy: number;
    unmapped: number;
    ignored: number;
  };
  templates: MappingTemplate[];
  onSaveTemplate: (name: string) => void;
  onLoadTemplate: (template: MappingTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  isSavingTemplate: boolean;
  // Default values for unmapped required fields
  defaultValues: Record<string, string>;
  onDefaultValueChange: (apiName: string, value: string) => void;
  // Schema refresh
  onRefreshSchema?: () => void;
  isRefreshingSchema?: boolean;
}

export function MappingGrid({
  parsedFile,
  mappings,
  fields,
  onUpdateMapping,
  onResetMappings,
  mappingStats,
  templates,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  isSavingTemplate,
  defaultValues,
  onDefaultValueChange,
  onRefreshSchema,
  isRefreshingSchema,
}: MappingGridProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);

  const requiredFields = useMemo(
    () => fields.filter((f) => f.required),
    [fields]
  );
  const optionalFields = useMemo(
    () => fields.filter((f) => !f.required),
    [fields]
  );

  // Which targets are already used
  const usedTargets = useMemo(() => {
    const set = new Set<string>();
    for (const m of mappings) {
      if (m.targetField && !m.ignored) set.add(m.targetField);
    }
    return set;
  }, [mappings]);

  // Required fields that are not mapped and don't have defaults
  const unmappedRequired = useMemo(() => {
    const mappedTargets = new Set(
      mappings
        .filter((m) => m.targetField && !m.ignored)
        .map((m) => m.targetField!)
    );
    return requiredFields.filter(
      (f) => !mappedTargets.has(f.apiName) && !defaultValues[f.apiName]
    );
  }, [mappings, requiredFields, defaultValues]);

  // Required fields not mapped (for default value inputs)
  const requiredNotMapped = useMemo(() => {
    const mappedTargets = new Set(
      mappings
        .filter((m) => m.targetField && !m.ignored)
        .map((m) => m.targetField!)
    );
    return requiredFields.filter((f) => !mappedTargets.has(f.apiName));
  }, [mappings, requiredFields]);

  // Sample data cache
  const sampleCache = useMemo(() => {
    const cache: Record<string, string[]> = {};
    for (const header of parsedFile.headers) {
      cache[header] = getSampleValues(parsedFile.rows, header);
    }
    return cache;
  }, [parsedFile]);

  const handleSaveTemplate = useCallback(
    (name: string) => {
      onSaveTemplate(name);
      setSaveDialogOpen(false);
    },
    [onSaveTemplate]
  );

  return (
    <div className="space-y-6">
      {/* Stats banner + template toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {mappingStats.mapped} mapped
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-zinc-500" />
            {mappingStats.unmapped} unmapped
          </Badge>
          {mappingStats.ignored > 0 && (
            <Badge variant="secondary" className="gap-1.5">
              {mappingStats.ignored} ignored
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {mappingStats.total} columns total
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Schema */}
          {onRefreshSchema && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={onRefreshSchema}
              disabled={isRefreshingSchema}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshingSchema ? "animate-spin" : ""}`}
              />
              Refresh Schema
            </Button>
          )}

          {/* Load template */}
          {templates.length > 0 && (
            <Popover open={templateMenuOpen} onOpenChange={setTemplateMenuOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <FolderOpen className="h-3.5 w-3.5" />
                  Load Template
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[260px] p-2" align="end">
                <div className="space-y-1">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-accent"
                    >
                      <button
                        className="flex-1 text-left text-sm"
                        onClick={() => {
                          onLoadTemplate(t);
                          setTemplateMenuOpen(false);
                        }}
                      >
                        {t.name}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => onDeleteTemplate(t.id)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Save template */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setSaveDialogOpen(true)}
          >
            <Save className="h-3.5 w-3.5" />
            Save Template
          </Button>

          {/* Reset */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={onResetMappings}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* Mapping rows */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Column Mappings
        </h3>
        {mappings.map((mapping, index) => (
          <MappingRow
            key={mapping.sourceColumn}
            mapping={mapping}
            index={index}
            samples={sampleCache[mapping.sourceColumn] ?? []}
            requiredFields={requiredFields}
            optionalFields={optionalFields}
            usedTargets={usedTargets}
            onUpdate={onUpdateMapping}
          />
        ))}
      </div>

      {/* Unmapped required fields — default value section */}
      {requiredNotMapped.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-amber-500">
            Unmapped Required Fields
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            These required fields aren&apos;t mapped to any column. Provide a
            default value or map a column above.
          </p>
          {requiredNotMapped.map((field) => (
            <DefaultValueRow
              key={field.apiName}
              field={field}
              value={defaultValues[field.apiName] ?? ""}
              onChange={(val) => onDefaultValueChange(field.apiName, val)}
            />
          ))}
        </div>
      )}

      {/* Unresolved required fields warning */}
      {unmappedRequired.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive font-medium">
            {unmappedRequired.length} required field
            {unmappedRequired.length > 1 ? "s" : ""} still need mapping or
            defaults:
          </p>
          <ul className="mt-1 text-xs text-destructive/80 list-disc list-inside">
            {unmappedRequired.map((f) => (
              <li key={f.apiName}>
                {f.name} ({f.apiName})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Template save dialog */}
      <TemplateSaveDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSaveTemplate}
        isSaving={isSavingTemplate}
      />
    </div>
  );
}
