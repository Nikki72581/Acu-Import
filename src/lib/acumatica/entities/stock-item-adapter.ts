import type { EntityField, AliasMap } from "@/types/entities";
import type { AcumaticaRecord, LookupRequirement } from "@/types/acumatica";
import type { FieldMapping } from "@/types/mapping";
import type { EntityAdapter } from "./types";
import type { AcumaticaClient } from "../client";
import { STOCK_ITEM_FIELDS, STOCK_ITEM_ALIASES, STOCK_ITEM_LOOKUPS } from "./stock-item";
import { buildAcumaticaRecord } from "./record-builder";

export class StockItemAdapter implements EntityAdapter {
  entityType = "StockItem" as const;
  entityLabel = "Stock Items";
  keyField = "InventoryID";

  getFields(): EntityField[] {
    return STOCK_ITEM_FIELDS;
  }

  getRequiredFields(): EntityField[] {
    return STOCK_ITEM_FIELDS.filter((f) => f.required);
  }

  getFieldAliases(): AliasMap {
    return STOCK_ITEM_ALIASES;
  }

  getLookupRequirements(): LookupRequirement[] {
    return STOCK_ITEM_LOOKUPS;
  }

  mapRecord(row: Record<string, string>, mapping: FieldMapping[]): AcumaticaRecord {
    return buildAcumaticaRecord(row, mapping, STOCK_ITEM_FIELDS);
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
