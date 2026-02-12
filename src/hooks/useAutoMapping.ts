"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { EntityField, AliasMap } from "@/types/entities";
import type { FieldMapping, MatchConfidence } from "@/types/mapping";
import type { ParsedFile } from "@/types/import";
import { autoMap } from "@/lib/mapping/engine";

interface MappingStats {
  total: number;
  mapped: number;
  exact: number;
  alias: number;
  fuzzy: number;
  unmapped: number;
  ignored: number;
}

interface UseAutoMappingOptions {
  parsedFile: ParsedFile | null;
  fields: EntityField[];
  aliases: AliasMap;
}

interface UseAutoMappingReturn {
  mappings: FieldMapping[];
  setMappings: (mappings: FieldMapping[]) => void;
  updateMapping: (index: number, updates: Partial<FieldMapping>) => void;
  mappingStats: MappingStats;
  resetMappings: () => void;
}

export function useAutoMapping({
  parsedFile,
  fields,
  aliases,
}: UseAutoMappingOptions): UseAutoMappingReturn {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);

  // Run auto-mapping when parsedFile changes
  useEffect(() => {
    if (!parsedFile || parsedFile.headers.length === 0) {
      setMappings([]);
      return;
    }
    const result = autoMap(parsedFile.headers, fields, aliases);
    setMappings(result);
  }, [parsedFile, fields, aliases]);

  const updateMapping = useCallback(
    (index: number, updates: Partial<FieldMapping>) => {
      setMappings((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...updates };

        // If updating target field, clear any other mapping to the same target
        if (updates.targetField && updates.targetField !== prev[index]?.targetField) {
          for (let i = 0; i < next.length; i++) {
            if (i !== index && next[i].targetField === updates.targetField) {
              next[i] = { ...next[i], targetField: null, confidence: "none" };
            }
          }
        }

        return next;
      });
    },
    []
  );

  const resetMappings = useCallback(() => {
    if (!parsedFile || parsedFile.headers.length === 0) {
      setMappings([]);
      return;
    }
    const result = autoMap(parsedFile.headers, fields, aliases);
    setMappings(result);
  }, [parsedFile, fields, aliases]);

  const mappingStats = useMemo((): MappingStats => {
    const total = mappings.length;
    const ignored = mappings.filter((m) => m.ignored).length;
    const byConfidence = (c: MatchConfidence) =>
      mappings.filter((m) => !m.ignored && m.confidence === c).length;

    const exact = byConfidence("exact");
    const alias = byConfidence("alias");
    const fuzzy = byConfidence("fuzzy");
    const unmapped = byConfidence("none");
    const mapped = exact + alias + fuzzy;

    return { total, mapped, exact, alias, fuzzy, unmapped, ignored };
  }, [mappings]);

  return { mappings, setMappings, updateMapping, mappingStats, resetMappings };
}
