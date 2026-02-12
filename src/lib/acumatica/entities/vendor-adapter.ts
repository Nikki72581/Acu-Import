import type { EntityField, AliasMap, ImportMode } from "@/types/entities";
import type {
  AcumaticaRecord,
  LookupRequirement,
  LookupContext,
  ValidationResult,
  AcumaticaErrorResponse,
} from "@/types/acumatica";
import type { FieldMapping } from "@/types/mapping";
import type { EntityAdapter, ImportRowResult } from "./types";
import type { AcumaticaClient } from "../client";
import { VENDOR_FIELDS, VENDOR_ALIASES, VENDOR_LOOKUPS } from "./vendor";
import { buildAcumaticaRecord } from "./record-builder";

export class VendorAdapter implements EntityAdapter {
  entityType = "Vendor" as const;
  entityLabel = "Vendors";
  keyField = "VendorID";

  getFields(): EntityField[] {
    return VENDOR_FIELDS;
  }

  getRequiredFields(): EntityField[] {
    return VENDOR_FIELDS.filter((f) => f.required);
  }

  getFieldAliases(): AliasMap {
    return VENDOR_ALIASES;
  }

  getLookupRequirements(): LookupRequirement[] {
    return VENDOR_LOOKUPS;
  }

  mapRecord(row: Record<string, string>, mapping: FieldMapping[]): AcumaticaRecord {
    return buildAcumaticaRecord(row, mapping, VENDOR_FIELDS);
  }

  async fetchExistingKeys(client: AcumaticaClient): Promise<Set<string>> {
    const records = await client.get<Record<string, { value: string }>[]>(
      "/Vendor?$select=VendorID"
    );

    const keys = new Set<string>();
    if (Array.isArray(records)) {
      for (const record of records) {
        const val = record.VendorID?.value;
        if (val != null && val !== "") {
          keys.add(String(val).trim());
        }
      }
    }
    return keys;
  }

  validateRecord(
    record: AcumaticaRecord,
    lookups: LookupContext,
    _mode: ImportMode
  ): ValidationResult {
    const errors: ValidationResult["errors"] = [];
    const warnings: ValidationResult["warnings"] = [];

    for (const field of this.getRequiredFields()) {
      const val = record[field.apiName];
      if (!val || val.value == null || val.value === "") {
        errors.push({
          field: field.apiName,
          message: `Required field "${field.name}" is missing`,
        });
      }
    }

    for (const [fieldName, lookupSet] of Object.entries(lookups.lookups)) {
      if (lookupSet.size === 0) continue;
      const val = record[fieldName];
      if (val?.value && !lookupSet.has(String(val.value))) {
        errors.push({
          field: fieldName,
          message: `"${val.value}" is not a valid ${fieldName}`,
          value: String(val.value),
        });
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async pushRecord(
    client: AcumaticaClient,
    record: AcumaticaRecord
  ): Promise<ImportRowResult> {
    try {
      await client.put("/Vendor", record);
      return { success: true };
    } catch (error) {
      const apiError = error as AcumaticaErrorResponse;
      return {
        success: false,
        error: apiError.message || "Unknown error pushing vendor",
        errorCode: apiError.status ? String(apiError.status) : undefined,
      };
    }
  }
}
