import type { EntityField, AliasMap } from "@/types/entities";
import type { AcumaticaRecord, LookupRequirement } from "@/types/acumatica";
import type { FieldMapping } from "@/types/mapping";
import type { EntityAdapter } from "./types";
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
