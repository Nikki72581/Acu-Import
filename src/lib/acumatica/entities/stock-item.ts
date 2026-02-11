import type { EntityField } from "@/types/entities";
import type { LookupRequirement } from "@/types/acumatica";

export const STOCK_ITEM_FIELDS: EntityField[] = [
  { name: "Inventory ID", apiName: "InventoryID", type: "string", required: true, description: "Unique identifier, uppercase" },
  { name: "Description", apiName: "Description", type: "string", required: true, description: "Item description", maxLength: 256 },
  { name: "Item Class", apiName: "ItemClass", type: "string", required: true, description: "Must exist in Acumatica" },
  { name: "Item Type", apiName: "ItemType", type: "string", required: true, description: "Finished Good, Component, Subassembly, etc." },
  { name: "Item Status", apiName: "ItemStatus", type: "string", required: true, description: "Active, Inactive, No Sales, etc." },
  { name: "Base UOM", apiName: "BaseUOM", type: "string", required: true, description: "Unit of measure (EACH, LB, etc.)" },
  { name: "Default Price", apiName: "DefaultPrice", type: "decimal", required: false, description: "Default selling price" },
  { name: "Current Cost", apiName: "CurrentStdCost", type: "decimal", required: false, description: "Current standard cost" },
  { name: "Tax Category", apiName: "TaxCategory", type: "string", required: false, description: "Tax category code" },
  { name: "Warehouse", apiName: "DefaultWarehouse", type: "string", required: false, description: "Default warehouse ID" },
  { name: "Product Class", apiName: "ProductClass", type: "string", required: false, description: "For reporting/grouping" },
  { name: "Weight", apiName: "Weight", type: "decimal", required: false, description: "Item weight" },
  { name: "Volume", apiName: "Volume", type: "decimal", required: false, description: "Item volume" },
];

export const STOCK_ITEM_ALIASES: Record<string, string> = {
  "SKU": "InventoryID",
  "Part Number": "InventoryID",
  "Item Number": "InventoryID",
  "Name": "Description",
  "Item Name": "Description",
  "Product Name": "Description",
  "Class": "ItemClass",
  "Category": "ItemClass",
  "UOM": "BaseUOM",
  "Unit": "BaseUOM",
  "Price": "DefaultPrice",
  "Sell Price": "DefaultPrice",
  "List Price": "DefaultPrice",
  "Cost": "CurrentStdCost",
  "Unit Cost": "CurrentStdCost",
  "Std Cost": "CurrentStdCost",
};

export const STOCK_ITEM_LOOKUPS: LookupRequirement[] = [
  { name: "ItemClass", entity: "ItemClass", keyField: "ClassID", label: "Item Classes" },
  { name: "BaseUOM", entity: "UnitOfMeasure", keyField: "UOM", label: "Units of Measure" },
  { name: "TaxCategory", entity: "TaxCategory", keyField: "TaxCategoryID", label: "Tax Categories" },
  { name: "DefaultWarehouse", entity: "Warehouse", keyField: "WarehouseID", label: "Warehouses" },
];
