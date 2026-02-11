import type { EntityField } from "@/types/entities";
import type { LookupRequirement } from "@/types/acumatica";

export const CUSTOMER_FIELDS: EntityField[] = [
  { name: "Customer ID", apiName: "CustomerID", type: "string", required: true, description: "Unique identifier" },
  { name: "Customer Name", apiName: "CustomerName", type: "string", required: true, description: "Legal/display name", maxLength: 256 },
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
];

export const CUSTOMER_ALIASES: Record<string, string> = {
  "Account": "CustomerID",
  "Acct": "CustomerID",
  "Cust ID": "CustomerID",
  "Company": "CustomerName",
  "Company Name": "CustomerName",
  "Account Name": "CustomerName",
  "Class": "CustomerClass",
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
};

export const CUSTOMER_LOOKUPS: LookupRequirement[] = [
  { name: "CustomerClass", entity: "CustomerClass", keyField: "ClassID", label: "Customer Classes" },
  { name: "Terms", entity: "Terms", keyField: "TermsID", label: "Payment Terms" },
  { name: "TaxZone", entity: "TaxZone", keyField: "TaxZoneID", label: "Tax Zones" },
  { name: "CurrencyID", entity: "Currency", keyField: "CurrencyID", label: "Currencies" },
];
