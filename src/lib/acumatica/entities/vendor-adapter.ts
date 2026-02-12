import type { EntityField, AliasMap } from "@/types/entities";
import type { AcumaticaRecord, LookupRequirement } from "@/types/acumatica";
import type { FieldMapping } from "@/types/mapping";
import type { EntityAdapter } from "./types";
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

  async fetchExistingKeys(_client: AcumaticaClient): Promise<Set<string>> {
    throw new Error("Not implemented — Phase 3");
  }

  validateRecord(): never {
    throw new Error("Not implemented — Phase 3");
  }

  async pushRecord(): Promise<never> {
    throw new Error("Not implemented — Phase 3");
  }
}
