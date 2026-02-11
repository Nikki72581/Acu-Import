export type EntityType = "StockItem" | "Customer" | "Vendor";

export type ImportMode = "create" | "create_or_update" | "update";

export type FieldType = "string" | "decimal" | "integer" | "boolean";

export interface EntityField {
  name: string;
  apiName: string;
  type: FieldType;
  required: boolean;
  description?: string;
  maxLength?: number;
  isCustom?: boolean;
  nested?: string; // parent entity for nested fields, e.g. "MainAddress"
}

export interface AliasMap {
  [alias: string]: string; // alias → apiName
}

export interface EntityConfig {
  entityType: EntityType;
  entityLabel: string;
  entityDescription: string;
  apiEntity: string;
  keyField: string;
  icon: string;
  fields: EntityField[];
  aliases: AliasMap;
}

export const ENTITY_CONFIGS: Record<EntityType, EntityConfig> = {
  StockItem: {
    entityType: "StockItem",
    entityLabel: "Stock Items",
    entityDescription:
      "Import inventory items including pricing, warehouses, and item details.",
    apiEntity: "StockItem",
    keyField: "InventoryID",
    icon: "Package",
    fields: [
      { name: "Inventory ID", apiName: "InventoryID", type: "string", required: true, description: "Unique identifier, uppercase" },
      { name: "Description", apiName: "Description", type: "string", required: true, description: "Item description" },
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
    ],
    aliases: {
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
    },
  },
  Customer: {
    entityType: "Customer",
    entityLabel: "Customers",
    entityDescription:
      "Import customer accounts with contact info, addresses, and billing details.",
    apiEntity: "Customer",
    keyField: "CustomerID",
    icon: "Users",
    fields: [
      { name: "Customer ID", apiName: "CustomerID", type: "string", required: true, description: "Unique identifier" },
      { name: "Customer Name", apiName: "CustomerName", type: "string", required: true, description: "Legal/display name" },
      { name: "Customer Class", apiName: "CustomerClass", type: "string", required: true, description: "Must exist in Acumatica" },
      { name: "Status", apiName: "Status", type: "string", required: true, description: "Active, On Hold, One-Time, etc." },
      { name: "Terms", apiName: "Terms", type: "string", required: false, description: "Payment terms code" },
      { name: "Currency", apiName: "CurrencyID", type: "string", required: false, description: "Defaults to base currency" },
      { name: "Tax Zone", apiName: "TaxZone", type: "string", required: false, description: "Tax zone code" },
      { name: "Credit Limit", apiName: "CreditLimit", type: "decimal", required: false, description: "Credit limit amount" },
      { name: "Statement Type", apiName: "StatementType", type: "string", required: false, description: "Balance Brought Forward, Open Item" },
      { name: "Parent Account", apiName: "ParentAccount", type: "string", required: false, description: "Parent customer ID" },
      { name: "Email", apiName: "Email", type: "string", required: false, description: "Primary email" },
      { name: "Phone", apiName: "Phone", type: "string", required: false, description: "Primary phone" },
    ],
    aliases: {
      "Account": "CustomerID",
      "Acct": "CustomerID",
      "Cust ID": "CustomerID",
      "Company": "CustomerName",
      "Company Name": "CustomerName",
      "Account Name": "CustomerName",
      "Customer Type": "CustomerClass",
      "Payment Terms": "Terms",
      "Net Terms": "Terms",
      "Address": "MainAddress.AddressLine1",
      "Street": "MainAddress.AddressLine1",
      "Address Line 1": "MainAddress.AddressLine1",
      "City": "MainAddress.City",
      "Town": "MainAddress.City",
      "State": "MainAddress.State",
      "Province": "MainAddress.State",
      "Region": "MainAddress.State",
      "Zip": "MainAddress.PostalCode",
      "Zip Code": "MainAddress.PostalCode",
      "Postal Code": "MainAddress.PostalCode",
      "Contact": "MainContact.DisplayName",
      "Contact Name": "MainContact.DisplayName",
      "Contact Email": "MainContact.Email",
      "Contact Phone": "MainContact.Phone1",
    },
  },
  Vendor: {
    entityType: "Vendor",
    entityLabel: "Vendors",
    entityDescription:
      "Import vendor/supplier accounts with payment info and contact details.",
    apiEntity: "Vendor",
    keyField: "VendorID",
    icon: "Truck",
    fields: [
      { name: "Vendor ID", apiName: "VendorID", type: "string", required: true, description: "Unique identifier" },
      { name: "Vendor Name", apiName: "VendorName", type: "string", required: true, description: "Legal/display name" },
      { name: "Vendor Class", apiName: "VendorClass", type: "string", required: true, description: "Must exist in Acumatica" },
      { name: "Status", apiName: "Status", type: "string", required: true, description: "Active, On Hold, One-Time" },
      { name: "Terms", apiName: "Terms", type: "string", required: false, description: "Payment terms code" },
      { name: "Currency", apiName: "CurrencyID", type: "string", required: false, description: "Defaults to base currency" },
      { name: "Tax Zone", apiName: "TaxZone", type: "string", required: false, description: "Tax zone code" },
      { name: "Payment Method", apiName: "PaymentMethod", type: "string", required: false, description: "Default payment method" },
      { name: "Cash Account", apiName: "CashAccount", type: "string", required: false, description: "Default cash account" },
      { name: "Landed Cost Vendor", apiName: "LandedCostVendor", type: "boolean", required: false, description: "Is landed cost vendor" },
      { name: "Tax Agency", apiName: "TaxAgency", type: "boolean", required: false, description: "Is tax agency" },
      { name: "Email", apiName: "Email", type: "string", required: false, description: "Primary email" },
      { name: "Phone", apiName: "Phone", type: "string", required: false, description: "Primary phone" },
    ],
    aliases: {
      "Supplier": "VendorID",
      "Supplier ID": "VendorID",
      "Vendor #": "VendorID",
      "Vendor Number": "VendorID",
      "Supplier Name": "VendorName",
      "Company": "VendorName",
      "Company Name": "VendorName",
      "Vendor Type": "VendorClass",
      "Payment Terms": "Terms",
      "Net Terms": "Terms",
      "Terms Code": "Terms",
      "Address": "MainAddress.AddressLine1",
      "Street": "MainAddress.AddressLine1",
      "Address Line 1": "MainAddress.AddressLine1",
      "Contact": "MainContact.DisplayName",
      "Contact Name": "MainContact.DisplayName",
    },
  },
};

export const ENTITY_TYPES: EntityType[] = ["StockItem", "Customer", "Vendor"];

export const IMPORT_MODES: { value: ImportMode; label: string; description: string }[] = [
  {
    value: "create",
    label: "Create Only",
    description: "Import new records. Fails if a record with the same key already exists.",
  },
  {
    value: "create_or_update",
    label: "Create or Update",
    description: "Creates new records and updates existing ones based on the key field.",
  },
  {
    value: "update",
    label: "Update Only",
    description: "Only updates records that already exist. Fails if the key is not found.",
  },
];

// URL slug mapping
export const ENTITY_SLUG_MAP: Record<string, EntityType> = {
  "stock-items": "StockItem",
  "customers": "Customer",
  "vendors": "Vendor",
};

export const ENTITY_TYPE_TO_SLUG: Record<EntityType, string> = {
  StockItem: "stock-items",
  Customer: "customers",
  Vendor: "vendors",
};
