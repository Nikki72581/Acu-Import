import type { EntityField } from "@/types/entities";
import type { AcumaticaRecord } from "@/types/acumatica";
import type { FieldMapping } from "@/types/mapping";

/**
 * Coerce a string value to the appropriate type based on field definition.
 */
function coerceValue(
  raw: string,
  field: EntityField | undefined
): string | number | boolean | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  if (!field) return trimmed;

  switch (field.type) {
    case "decimal": {
      const num = parseFloat(trimmed.replace(/[,$]/g, ""));
      return isNaN(num) ? trimmed : num;
    }
    case "integer": {
      const int = parseInt(trimmed.replace(/[,$]/g, ""), 10);
      return isNaN(int) ? trimmed : int;
    }
    case "boolean": {
      const lower = trimmed.toLowerCase();
      if (["true", "yes", "1", "y"].includes(lower)) return true;
      if (["false", "no", "0", "n"].includes(lower)) return false;
      return trimmed;
    }
    default:
      return trimmed;
  }
}

/**
 * Set a nested value in the record using dot notation.
 * e.g., "MainAddress.City" → { MainAddress: { City: { value: ... } } }
 */
function setNestedValue(
  record: Record<string, unknown>,
  path: string,
  value: string | number | boolean | null
): void {
  const parts = path.split(".");

  if (parts.length === 1) {
    record[parts[0]] = { value };
    return;
  }

  let current = record;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = { value };
}

/**
 * Transform a flat CSV row into an Acumatica API record
 * using the provided field mappings.
 */
export function buildAcumaticaRecord(
  row: Record<string, string>,
  mappings: FieldMapping[],
  fields: EntityField[]
): AcumaticaRecord {
  const record: Record<string, unknown> = {};
  const fieldMap = new Map(fields.map((f) => [f.apiName, f]));

  for (const mapping of mappings) {
    if (mapping.ignored || !mapping.targetField) continue;

    const rawValue = row[mapping.sourceColumn] ?? mapping.defaultValue ?? "";
    if (rawValue === "" && !mapping.defaultValue) continue;

    const value = rawValue || mapping.defaultValue || "";
    const field = fieldMap.get(mapping.targetField.split(".")[0]);
    const coerced = coerceValue(value, field);

    setNestedValue(record, mapping.targetField, coerced);
  }

  return record as AcumaticaRecord;
}
