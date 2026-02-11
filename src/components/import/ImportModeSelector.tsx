"use client";

import { Plus, RefreshCw, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IMPORT_MODES } from "@/types/entities";
import type { ImportMode } from "@/types/entities";

const MODE_ICONS: Record<ImportMode, React.ComponentType<{ className?: string }>> = {
  create: Plus,
  create_or_update: RefreshCw,
  update: Pencil,
};

interface ImportModeSelectorProps {
  selected: ImportMode | null;
  onSelect: (mode: ImportMode) => void;
}

export function ImportModeSelector({
  selected,
  onSelect,
}: ImportModeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {IMPORT_MODES.map((mode) => {
        const Icon = MODE_ICONS[mode.value];
        const isSelected = selected === mode.value;

        return (
          <Card
            key={mode.value}
            onClick={() => onSelect(mode.value)}
            className={cn(
              "cursor-pointer border-border bg-card transition-all",
              isSelected
                ? "border-primary ring-1 ring-primary"
                : "hover:border-muted-foreground/30"
            )}
          >
            <CardContent className="p-5">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md",
                  isSelected
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              <h3 className="mt-3 text-sm font-medium text-foreground">
                {mode.label}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {mode.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
