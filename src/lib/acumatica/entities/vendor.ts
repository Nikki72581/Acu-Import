import type { EntityField } from "@/types/entities";
import type { LookupRequirement } from "@/types/acumatica";

export const VENDOR_FIELDS: EntityField[] = [
  { name: "Vendor ID", apiName: "VendorID", type: "string", required: true, description: "Unique identifier" },
  { name: "Vendor Name", apiName: "VendorName", type: "string", required: true, description: "Legal/display name", maxLength: 256 },
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
];

export const VENDOR_ALIASES: Record<string, string> = {
  "Supplier": "VendorID",
  "Supplier ID": "VendorID",
  "Vendor #": "VendorID",
  "Vendor Number": "VendorID",
  "Supplier Name": "VendorName",
  "Company": "VendorName",
  "Company Name": "VendorName",
  "Class": "VendorClass",
  "Vendor Type": "VendorClass",
  "Category": "VendorClass",
  "Payment Terms": "Terms",
  "Net Terms": "Terms",
  "Terms Code": "Terms",
  "Address": "MainAddress.AddressLine1",
  "Street": "MainAddress.AddressLine1",
  "Address Line 1": "MainAddress.AddressLine1",
  "Contact": "MainContact.DisplayName",
  "Contact Name": "MainContact.DisplayName",
};

export const VENDOR_LOOKUPS: LookupRequirement[] = [
  { name: "VendorClass", entity: "VendorClass", keyField: "ClassID", label: "Vendor Classes" },
  { name: "Terms", entity: "Terms", keyField: "TermsID", label: "Payment Terms" },
  { name: "TaxZone", entity: "TaxZone", keyField: "TaxZoneID", label: "Tax Zones" },
  { name: "PaymentMethod", entity: "PaymentMethod", keyField: "PaymentMethodID", label: "Payment Methods" },
  { name: "CashAccount", entity: "CashAccount", keyField: "CashAccountCD", label: "Cash Accounts" },
];
