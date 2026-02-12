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
import { CUSTOMER_FIELDS, CUSTOMER_ALIASES, CUSTOMER_LOOKUPS } from "./customer";
import { buildAcumaticaRecord } from "./record-builder";

export class CustomerAdapter implements EntityAdapter {
  entityType = "Customer" as const;
  entityLabel = "Customers";
  keyField = "CustomerID";

  getFields(): EntityField[] {
    return CUSTOMER_FIELDS;
  }

  getRequiredFields(): EntityField[] {
    return CUSTOMER_FIELDS.filter((f) => f.required);
  }

  getFieldAliases(): AliasMap {
    return CUSTOMER_ALIASES;
  }

  getLookupRequirements(): LookupRequirement[] {
    return CUSTOMER_LOOKUPS;
  }

  mapRecord(row: Record<string, string>, mapping: FieldMapping[]): AcumaticaRecord {
    return buildAcumaticaRecord(row, mapping, CUSTOMER_FIELDS);
  }

  async fetchExistingKeys(client: AcumaticaClient): Promise<Set<string>> {
    const records = await client.get<Record<string, { value: string }>[]>(
      "/Customer?$select=CustomerID"
    );

    const keys = new Set<string>();
    if (Array.isArray(records)) {
      for (const record of records) {
        const val = record.CustomerID?.value;
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
      await client.put("/Customer", record);
      return { success: true };
    } catch (error) {
      const apiError = error as AcumaticaErrorResponse;
      return {
        success: false,
        error: apiError.message || "Unknown error pushing customer",
        errorCode: apiError.status ? String(apiError.status) : undefined,
      };
    }
  }
}
