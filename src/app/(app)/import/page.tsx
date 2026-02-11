"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EntitySelector } from "@/components/import/EntitySelector";
import { ImportModeSelector } from "@/components/import/ImportModeSelector";
import { entityTypeToSlug } from "@/lib/utils/entity-utils";
import type { EntityType, ImportMode } from "@/types/entities";

export default function ImportPage() {
  const router = useRouter();
  const [selectedEntity, setSelectedEntity] = useState<EntityType | null>(null);
  const [selectedMode, setSelectedMode] = useState<ImportMode | null>(null);

  const handleContinue = () => {
    if (!selectedEntity || !selectedMode) return;
    const slug = entityTypeToSlug(selectedEntity);
    router.push(`/import/${slug}/upload?mode=${selectedMode}`);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">New Import</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select an entity type and import mode to get started.
        </p>
      </div>

      {/* Entity Type Selection */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-medium text-foreground">
          1. Select Entity Type
        </h2>
        <EntitySelector selected={selectedEntity} onSelect={setSelectedEntity} />
      </div>

      {selectedEntity && (
        <>
          <Separator className="my-6" />

          {/* Import Mode Selection */}
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-medium text-foreground">
              2. Select Import Mode
            </h2>
            <ImportModeSelector
              selected={selectedMode}
              onSelect={setSelectedMode}
            />
          </div>
        </>
      )}

      {selectedEntity && selectedMode && (
        <div className="mt-8 flex justify-end">
          <Button onClick={handleContinue} className="gap-2">
            Continue to Upload
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
