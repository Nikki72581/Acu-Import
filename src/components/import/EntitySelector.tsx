"use client";

import { Package, Users, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ENTITY_CONFIGS, ENTITY_TYPES } from "@/types/entities";
import type { EntityType } from "@/types/entities";

const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  Users,
  Truck,
};

interface EntitySelectorProps {
  selected: EntityType | null;
  onSelect: (entityType: EntityType) => void;
}

export function EntitySelector({ selected, onSelect }: EntitySelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {ENTITY_TYPES.map((type) => {
        const config = ENTITY_CONFIGS[type];
        const Icon = ENTITY_ICONS[config.icon];
        const requiredCount = config.fields.filter((f) => f.required).length;
        const isSelected = selected === type;

        return (
          <Card
            key={type}
            onClick={() => onSelect(type)}
            className={cn(
              "cursor-pointer border-border bg-card transition-all",
              isSelected
                ? "border-primary ring-1 ring-primary"
                : "hover:border-muted-foreground/30"
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md",
                    isSelected
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs font-normal text-muted-foreground"
                >
                  {requiredCount} required
                </Badge>
              </div>

              <h3 className="mt-3 text-sm font-medium text-foreground">
                {config.entityLabel}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {config.entityDescription}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
