import type {
  AcumaticaRecord,
  LookupRequirement,
  LookupContext,
  ValidationResult,
} from "@/types/acumatica";
import type { EntityField, AliasMap, ImportMode } from "@/types/entities";
import type { FieldMapping } from "@/types/mapping";
import type { AcumaticaClient } from "../client";

export interface ImportRowResult {
  success: boolean;
  operation?: "created" | "updated";
  error?: string;
  errorCode?: string;
}

export interface EntityAdapter {
  // Identity
  entityType: string;
  entityLabel: string;
  keyField: string;

  // Schema
  getFields(): EntityField[];
  getRequiredFields(): EntityField[];
  getFieldAliases(): AliasMap;

  // Lookups & Pre-Validation
  getLookupRequirements(): LookupRequirement[];
  fetchExistingKeys(client: AcumaticaClient): Promise<Set<string>>;

  // Transformation
  mapRecord(
    row: Record<string, string>,
    mapping: FieldMapping[]
  ): AcumaticaRecord;

  // Validation
  validateRecord(
    record: AcumaticaRecord,
    lookups: LookupContext,
    mode: ImportMode
  ): ValidationResult;

  // API
  pushRecord(
    client: AcumaticaClient,
    record: AcumaticaRecord
  ): Promise<ImportRowResult>;
}
