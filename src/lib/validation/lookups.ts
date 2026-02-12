import type { AcumaticaClient } from "@/lib/acumatica/client";
import type { LookupRequirement } from "@/types/acumatica";

interface LookupProgress {
  completed: number;
  total: number;
  current: string;
}

interface LookupFetchResult {
  lookups: Record<string, Set<string>>;
  warnings: string[];
}

/**
 * Fetch reference data from Acumatica for validation.
 * For each LookupRequirement, fetches all records with just the key field
 * and returns a Set of valid values.
 */
export async function fetchLookupData(
  client: AcumaticaClient,
  requirements: LookupRequirement[],
  onProgress?: (progress: LookupProgress) => void
): Promise<LookupFetchResult> {
  const lookups: Record<string, Set<string>> = {};
  const warnings: string[] = [];

  for (let i = 0; i < requirements.length; i++) {
    const req = requirements[i];

    onProgress?.({
      completed: i,
      total: requirements.length,
      current: req.label,
    });

    try {
      // Fetch all records with just the key field
      const records = await client.get<Record<string, { value: string }>[]>(
        `/${req.entity}?$select=${req.keyField}`
      );

      const values = new Set<string>();
      if (Array.isArray(records)) {
        for (const record of records) {
          const val = record[req.keyField]?.value;
          if (val != null && val !== "") {
            values.add(String(val).trim());
          }
        }
      }

      lookups[req.name] = values;
    } catch (error) {
      // Graceful degradation: return empty set + warning
      lookups[req.name] = new Set();
      const message =
        error instanceof Error ? error.message : "Unknown error";
      warnings.push(
        `Failed to fetch ${req.label}: ${message}. Lookup validation will be skipped for this field.`
      );
    }
  }

  onProgress?.({
    completed: requirements.length,
    total: requirements.length,
    current: "Done",
  });

  return { lookups, warnings };
}
