"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { SampleDataPreview } from "./SampleDataPreview";
import type { EntityField } from "@/types/entities";
import type { FieldMapping } from "@/types/mapping";

interface MappingRowProps {
  mapping: FieldMapping;
  index: number;
  samples: string[];
  requiredFields: EntityField[];
  optionalFields: EntityField[];
  usedTargets: Set<string>;
  onUpdate: (index: number, updates: Partial<FieldMapping>) => void;
}

export function MappingRow({
  mapping,
  index,
  samples,
  requiredFields,
  optionalFields,
  usedTargets,
  onUpdate,
}: MappingRowProps) {
  const [open, setOpen] = useState(false);

  const selectedField = [...requiredFields, ...optionalFields].find(
    (f) => f.apiName === mapping.targetField
  );

  const handleSelect = (apiName: string) => {
    if (apiName === mapping.targetField) {
      // Deselect
      onUpdate(index, { targetField: null, confidence: "none" });
    } else {
      onUpdate(index, {
        targetField: apiName,
        confidence: "exact",
        ignored: false,
      });
    }
    setOpen(false);
  };

  const handleIgnore = () => {
    onUpdate(index, {
      ignored: !mapping.ignored,
      ...(mapping.ignored ? {} : { targetField: null, confidence: "none", defaultValue: undefined }),
    });
  };

  const handleClear = () => {
    onUpdate(index, { targetField: null, confidence: "none" });
  };

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto_1fr_auto_auto] items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
        mapping.ignored
          ? "border-border/50 bg-muted/30 opacity-60"
          : mapping.targetField
            ? "border-border bg-card"
            : "border-dashed border-border bg-card"
      )}
    >
      {/* Source column pill */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-sm font-medium text-foreground truncate">
            {mapping.sourceColumn}
          </span>
        </div>
        <div className="mt-1">
          <SampleDataPreview samples={samples} />
        </div>
      </div>

      {/* Arrow */}
      <div className="text-muted-foreground">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="text-muted-foreground/50"
        >
          <path
            d="M4 10h12m0 0l-4-4m4 4l-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Target field combobox */}
      <div className="min-w-0">
        {mapping.ignored ? (
          <span className="text-sm text-muted-foreground italic">Ignored</span>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between text-sm font-normal h-9"
              >
                <span className="truncate">
                  {selectedField
                    ? `${selectedField.name} (${selectedField.apiName})`
                    : "Select target field..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search fields..." />
                <CommandList>
                  <CommandEmpty>No field found.</CommandEmpty>

                  {requiredFields.length > 0 && (
                    <CommandGroup heading="Required">
                      {requiredFields.map((field) => {
                        const isUsed =
                          usedTargets.has(field.apiName) &&
                          field.apiName !== mapping.targetField;
                        return (
                          <CommandItem
                            key={field.apiName}
                            value={`${field.name} ${field.apiName}`}
                            onSelect={() => handleSelect(field.apiName)}
                            disabled={isUsed}
                            className={isUsed ? "opacity-40" : ""}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                mapping.targetField === field.apiName
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{field.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {field.apiName}
                                {field.description
                                  ? ` — ${field.description}`
                                  : ""}
                              </span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}

                  {optionalFields.length > 0 && (
                    <CommandGroup heading="Optional">
                      {optionalFields.map((field) => {
                        const isUsed =
                          usedTargets.has(field.apiName) &&
                          field.apiName !== mapping.targetField;
                        return (
                          <CommandItem
                            key={field.apiName}
                            value={`${field.name} ${field.apiName}`}
                            onSelect={() => handleSelect(field.apiName)}
                            disabled={isUsed}
                            className={isUsed ? "opacity-40" : ""}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                mapping.targetField === field.apiName
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{field.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {field.apiName}
                                {field.description
                                  ? ` — ${field.description}`
                                  : ""}
                              </span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Confidence badge */}
      <div className="flex items-center">
        {!mapping.ignored && mapping.targetField && (
          <>
            <ConfidenceBadge confidence={mapping.confidence} showLabel />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-1"
              onClick={handleClear}
              title="Clear mapping"
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>

      {/* Ignore toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleIgnore}
        title={mapping.ignored ? "Include column" : "Ignore column"}
      >
        {mapping.ignored ? (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Eye className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}

interface DefaultValueRowProps {
  field: EntityField;
  value: string;
  onChange: (value: string) => void;
}

export function DefaultValueRow({
  field,
  value,
  onChange,
}: DefaultValueRowProps) {
  return (
    <div className="grid grid-cols-[1fr_1fr] items-center gap-3 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-3">
      <div>
        <span className="text-sm font-medium text-foreground">
          {field.name}
        </span>
        <span className="text-xs text-muted-foreground ml-2">
          ({field.apiName})
        </span>
        {field.description && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {field.description}
          </p>
        )}
      </div>
      <Input
        placeholder={`Default value for ${field.name}...`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );
}
