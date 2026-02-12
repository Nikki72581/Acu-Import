import type { EntityField, ImportMode } from "@/types/entities";
import type { LookupContext, ValidationError, ValidationWarning } from "@/types/acumatica";
import type { FieldMapping } from "@/types/mapping";

export interface RowValidationResult {
  rowIndex: number;
  status: "pass" | "warn" | "fail";
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidateRowsOptions {
  rows: Record<string, string>[];
  mappings: FieldMapping[];
  defaultValues: Record<string, string>;
  fields: EntityField[];
  keyField: string;
  lookups: LookupContext;
  mode: ImportMode;
}

/**
 * Validate all rows against entity rules, lookups, and import mode constraints.
 */
export function validateRows(options: ValidateRowsOptions): RowValidationResult[] {
  const { rows, mappings, defaultValues, fields, keyField, lookups, mode } = options;

  const fieldMap = new Map(fields.map((f) => [f.apiName, f]));

  // Build a reverse map: targetField → sourceColumn
  const targetToSource = new Map<string, string>();
  for (const m of mappings) {
    if (m.targetField && !m.ignored) {
      targetToSource.set(m.targetField, m.sourceColumn);
    }
  }

  // Collect all key values for duplicate detection
  const keySourceColumn = targetToSource.get(keyField);
  const keyValues = new Map<string, number[]>(); // value → row indices
  if (keySourceColumn) {
    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i][keySourceColumn]?.trim() || defaultValues[keyField]?.trim() || "";
      if (raw) {
        const existing = keyValues.get(raw) ?? [];
        existing.push(i);
        keyValues.set(raw, existing);
      }
    }
  }

  // Find duplicate keys (appear more than once)
  const duplicateKeys = new Set<string>();
  for (const [key, indices] of keyValues) {
    if (indices.length > 1) {
      duplicateKeys.add(key);
    }
  }

  const results: RowValidationResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Skip rows where all cells are empty
    const allEmpty = Object.values(row).every((v) => !v || !v.trim());
    if (allEmpty) {
      results.push({
        rowIndex: i,
        status: "warn",
        errors: [],
        warnings: [{ field: "_row", message: "Row is entirely empty — will be skipped" }],
      });
      continue;
    }

    // Get key value for this row
    const keyValue = keySourceColumn
      ? (row[keySourceColumn]?.trim() || defaultValues[keyField]?.trim() || "")
      : (defaultValues[keyField]?.trim() || "");

    // 1. Required field empty check
    for (const field of fields) {
      if (!field.required) continue;

      const sourceCol = targetToSource.get(field.apiName);
      const rawValue = sourceCol ? row[sourceCol]?.trim() : undefined;
      const defValue = defaultValues[field.apiName]?.trim();

      if (!rawValue && !defValue) {
        errors.push({
          field: field.apiName,
          message: `Required field "${field.name}" is empty`,
          value: "",
        });
      }
    }

    // 2 & 3. Data type and length checks for mapped fields
    for (const m of mappings) {
      if (m.ignored || !m.targetField) continue;

      const rawValue = row[m.sourceColumn]?.trim() || defaultValues[m.targetField]?.trim() || "";
      if (!rawValue) continue;

      const field = fieldMap.get(m.targetField.split(".")[0]);
      if (!field) continue;

      // Type validation
      if (field.type === "decimal") {
        const cleaned = rawValue.replace(/[,$]/g, "");
        if (cleaned && isNaN(parseFloat(cleaned))) {
          errors.push({
            field: field.apiName,
            message: `"${field.name}" expects a number, got "${rawValue}"`,
            value: rawValue,
          });
        }
      } else if (field.type === "integer") {
        const cleaned = rawValue.replace(/[,$]/g, "");
        if (cleaned && isNaN(parseInt(cleaned, 10))) {
          errors.push({
            field: field.apiName,
            message: `"${field.name}" expects an integer, got "${rawValue}"`,
            value: rawValue,
          });
        }
      } else if (field.type === "boolean") {
        const lower = rawValue.toLowerCase();
        if (!["true", "false", "yes", "no", "1", "0", "y", "n"].includes(lower)) {
          errors.push({
            field: field.apiName,
            message: `"${field.name}" expects a boolean, got "${rawValue}"`,
            value: rawValue,
          });
        }
      }

      // MaxLength warning
      if (field.maxLength && rawValue.length > field.maxLength) {
        warnings.push({
          field: field.apiName,
          message: `"${field.name}" exceeds max length of ${field.maxLength} (got ${rawValue.length})`,
          value: rawValue,
        });
      }
    }

    // 4. Duplicate key within file
    if (keyValue && duplicateKeys.has(keyValue)) {
      errors.push({
        field: keyField,
        message: `Duplicate key "${keyValue}" found in file`,
        value: keyValue,
      });
    }

    // 5. Key already exists (Create Only mode)
    if (mode === "create" && keyValue && lookups.existingKeys?.has(keyValue)) {
      errors.push({
        field: keyField,
        message: `Key "${keyValue}" already exists in Acumatica (Create Only mode)`,
        value: keyValue,
      });
    }

    // 6. Key not found (Update Only mode)
    if (mode === "update" && keyValue && lookups.existingKeys && !lookups.existingKeys.has(keyValue)) {
      errors.push({
        field: keyField,
        message: `Key "${keyValue}" not found in Acumatica (Update Only mode)`,
        value: keyValue,
      });
    }

    // 7 & 8. Lookup validation (reference values)
    for (const m of mappings) {
      if (m.ignored || !m.targetField) continue;

      const rawValue = row[m.sourceColumn]?.trim() || defaultValues[m.targetField]?.trim() || "";
      if (!rawValue) continue;

      const lookupSet = lookups.lookups[m.targetField];
      if (!lookupSet || lookupSet.size === 0) continue;

      if (!lookupSet.has(rawValue)) {
        // Check for close match (case-insensitive)
        const upperValue = rawValue.toUpperCase();
        const closeMatch = Array.from(lookupSet).find(
          (v) => v.toUpperCase() === upperValue
        );

        if (closeMatch) {
          warnings.push({
            field: m.targetField,
            message: `"${rawValue}" is close to "${closeMatch}" — check casing`,
            suggestion: closeMatch,
            value: rawValue,
          });
        } else {
          errors.push({
            field: m.targetField,
            message: `"${rawValue}" is not a valid value for ${m.targetField}`,
            value: rawValue,
          });
        }
      }
    }

    // Determine overall status
    const status: RowValidationResult["status"] =
      errors.length > 0 ? "fail" : warnings.length > 0 ? "warn" : "pass";

    results.push({ rowIndex: i, status, errors, warnings });
  }

  return results;
}
