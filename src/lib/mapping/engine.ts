import Fuse from "fuse.js";
import type { EntityField, AliasMap } from "@/types/entities";
import type { FieldMapping, MatchConfidence } from "@/types/mapping";

/**
 * Normalize a string for comparison: lowercase, strip spaces/underscores/hyphens.
 */
export function normalize(str: string): string {
  return str.toLowerCase().replace(/[\s_\-]/g, "");
}

/**
 * Extract sample values from parsed rows for a given column header.
 * Returns up to `max` non-empty, unique values.
 */
export function getSampleValues(
  rows: Record<string, string>[],
  column: string,
  max: number = 3
): string[] {
  const seen = new Set<string>();
  const samples: string[] = [];

  for (const row of rows) {
    const val = row[column]?.trim();
    if (val && !seen.has(val)) {
      seen.add(val);
      samples.push(val);
      if (samples.length >= max) break;
    }
  }

  return samples;
}

/**
 * Three-pass auto-mapping algorithm:
 * 1. Exact match (normalized comparison against field apiName and name)
 * 2. Alias match (check against alias dictionary)
 * 3. Fuzzy match (fuse.js, threshold 0.4, only for headers >= 3 chars)
 *
 * Each target field can only be mapped once — higher confidence wins.
 */
export function autoMap(
  sourceHeaders: string[],
  fields: EntityField[],
  aliases: AliasMap
): FieldMapping[] {
  // Track which target fields have been claimed and by whom
  const claimed = new Map<string, { index: number; confidence: MatchConfidence }>();

  // Initialize all mappings as unmapped
  const mappings: FieldMapping[] = sourceHeaders.map((header) => ({
    sourceColumn: header,
    targetField: null,
    confidence: "none" as MatchConfidence,
    ignored: false,
  }));

  // Build normalized lookup maps
  const fieldsByNormalized = new Map<string, string>();
  for (const field of fields) {
    fieldsByNormalized.set(normalize(field.apiName), field.apiName);
    fieldsByNormalized.set(normalize(field.name), field.apiName);
  }

  const aliasesByNormalized = new Map<string, string>();
  for (const [alias, target] of Object.entries(aliases)) {
    aliasesByNormalized.set(normalize(alias), target);
  }

  // Helper to claim a target for a source
  function tryClaim(
    sourceIndex: number,
    targetField: string,
    confidence: MatchConfidence
  ): boolean {
    const existing = claimed.get(targetField);
    if (!existing) {
      claimed.set(targetField, { index: sourceIndex, confidence });
      mappings[sourceIndex] = {
        ...mappings[sourceIndex],
        targetField,
        confidence,
      };
      return true;
    }

    // Higher confidence wins (exact > alias > fuzzy)
    const priority: Record<MatchConfidence, number> = {
      exact: 3,
      alias: 2,
      fuzzy: 1,
      none: 0,
    };

    if (priority[confidence] > priority[existing.confidence]) {
      // Unclaim previous
      mappings[existing.index] = {
        ...mappings[existing.index],
        targetField: null,
        confidence: "none",
      };
      // Claim for new source
      claimed.set(targetField, { index: sourceIndex, confidence });
      mappings[sourceIndex] = {
        ...mappings[sourceIndex],
        targetField,
        confidence,
      };
      return true;
    }

    return false;
  }

  // Pass 1: Exact match
  for (let i = 0; i < sourceHeaders.length; i++) {
    const normalized = normalize(sourceHeaders[i]);
    const target = fieldsByNormalized.get(normalized);
    if (target) {
      tryClaim(i, target, "exact");
    }
  }

  // Pass 2: Alias match
  for (let i = 0; i < sourceHeaders.length; i++) {
    if (mappings[i].targetField) continue; // already matched
    const normalized = normalize(sourceHeaders[i]);
    const target = aliasesByNormalized.get(normalized);
    if (target) {
      tryClaim(i, target, "alias");
    }
  }

  // Pass 3: Fuzzy match (only for unmatched headers >= 3 chars)
  const unmatchedIndices = sourceHeaders
    .map((h, i) => ({ header: h, index: i }))
    .filter(({ header, index }) => !mappings[index].targetField && header.length >= 3);

  if (unmatchedIndices.length > 0) {
    // Build searchable items from unclaimed fields
    const claimedTargets = new Set(claimed.keys());
    const searchItems = fields
      .filter((f) => !claimedTargets.has(f.apiName))
      .map((f) => ({
        apiName: f.apiName,
        name: f.name,
        description: f.description ?? "",
      }));

    if (searchItems.length > 0) {
      const fuse = new Fuse(searchItems, {
        keys: ["name", "apiName", "description"],
        threshold: 0.4,
        includeScore: true,
      });

      for (const { header, index } of unmatchedIndices) {
        const results = fuse.search(header);
        if (results.length > 0 && results[0].score !== undefined && results[0].score <= 0.4) {
          tryClaim(index, results[0].item.apiName, "fuzzy");
        }
      }
    }
  }

  return mappings;
}
