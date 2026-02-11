# Acumatica Import Wizard — Product Specification

**Version:** 1.0
**Author:** Nicole / Junova
**Last Updated:** February 2026
**Status:** Pre-Development

---

## 1. Overview

### 1.1 What Is This?

The Acumatica Import Wizard is a standalone web application that simplifies bulk data imports into Acumatica ERP. Users select an entity type, upload a spreadsheet, review an auto-generated field mapping, validate their data, and execute the import — all through a modern UI that's faster and more intuitive than Acumatica's native Import by Scenario tool.

### 1.2 Why Build This?

Acumatica's built-in import tools are functional but painful. Import by Scenario requires manual field mapping every time, gives cryptic error messages, provides no pre-validation, and has no persistent audit trail. Consultants and admins waste hours on what should be a 10-minute task.

This tool solves that by:

- Auto-mapping source columns to Acumatica fields using fuzzy matching and alias dictionaries
- Pre-validating every row before touching the API, with clear human-readable error messages
- Saving mapping templates so the same file layout never needs remapping
- Maintaining a full import log with row-level pass/fail detail and exportable audit trails

### 1.3 Who Is This For?

- **Acumatica admins** doing regular data imports (new items, customer onboarding, vendor setup)
- **ERP consultants** running data migrations or bulk updates for clients
- **Junova clients** who need a self-service import tool connected to their Acumatica instance

### 1.4 Product Positioning

This is a Junova product — built independently, not sold through a VAR channel, not dependent on Acumatica's customization framework. It connects via Acumatica's public REST API and runs on its own infrastructure. The architecture is designed to support additional ERP platforms (Sage, Dynamics) in the future through a pluggable adapter pattern.

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 15 (App Router) | Server components, API routes, file-based routing |
| Language | TypeScript (strict mode) | Type safety across the full stack |
| Styling | Tailwind CSS 4 | Utility-first, fast iteration, consistent design |
| UI Components | shadcn/ui | Accessible, composable, no vendor lock-in |
| File Parsing | SheetJS (xlsx), Papaparse (csv) | Client-side parsing — no file upload to server |
| Fuzzy Matching | Fuse.js | Lightweight fuzzy search for auto-mapping |
| Database | Vercel Postgres (Neon) | Serverless-native, free tier, Vercel ecosystem |
| ORM | Drizzle ORM | Type-safe, lightweight, great migration tooling |
| Auth | Clerk | Drop-in auth with org/team support for multi-tenancy |
| Deployment | Vercel | Zero-config deploys, serverless functions, edge network |
| State Management | React state + URL search params | No global store needed; wizard flow is linear |

---

## 3. Supported Entity Types (v1)

### 3.1 Stock Items

**Acumatica API Entity:** `StockItem`
**API Endpoint:** `PUT /entity/Default/24.200.001/StockItem`

**Core Fields:**

| Field | API Name | Type | Required | Notes |
|-------|----------|------|----------|-------|
| Inventory ID | InventoryID | string | ✅ | Unique identifier, uppercase |
| Description | Description | string | ✅ | Item description |
| Item Class | ItemClass | string | ✅ | Must exist in Acumatica |
| Item Type | ItemType | string | ✅ | Finished Good, Component, Subassembly, etc. |
| Item Status | ItemStatus | string | ✅ | Active, Inactive, No Sales, etc. |
| Base UOM | BaseUOM | string | ✅ | Unit of measure (EACH, LB, etc.) |
| Default Price | DefaultPrice | decimal | ❌ | Default selling price |
| Current Cost | CurrentStdCost | decimal | ❌ | Current standard cost |
| Tax Category | TaxCategory | string | ❌ | Tax category code |
| Warehouse | DefaultWarehouse | string | ❌ | Default warehouse ID |
| Product Class | ProductClass | string | ❌ | For reporting/grouping |
| Weight | Weight | decimal | ❌ | Item weight |
| Volume | Volume | decimal | ❌ | Item volume |

**Nested Entities:**
- WarehouseDetails (warehouse-level defaults, locations, status)
- CrossReferences (alternate IDs, barcodes, vendor part numbers)
- VendorDetails (preferred vendors, lead times, vendor pricing)
- UOMConversions (unit of measure conversion factors)

**Common Aliases for Auto-Mapping:**
- SKU, Part Number, Item Number → InventoryID
- Name, Item Name, Product Name → Description
- Class, Category → ItemClass
- UOM, Unit → BaseUOM
- Price, Sell Price, List Price → DefaultPrice
- Cost, Unit Cost, Std Cost → CurrentStdCost

### 3.2 Customers

**Acumatica API Entity:** `Customer`
**API Endpoint:** `PUT /entity/Default/24.200.001/Customer`

**Core Fields:**

| Field | API Name | Type | Required | Notes |
|-------|----------|------|----------|-------|
| Customer ID | CustomerID | string | ✅ | Unique identifier |
| Customer Name | CustomerName | string | ✅ | Legal/display name |
| Customer Class | CustomerClass | string | ✅ | Must exist in Acumatica |
| Status | Status | string | ✅ | Active, On Hold, One-Time, etc. |
| Terms | Terms | string | ❌ | Payment terms code |
| Currency | CurrencyID | string | ❌ | Defaults to base currency |
| Tax Zone | TaxZone | string | ❌ | Tax zone code |
| Credit Limit | CreditLimit | decimal | ❌ | Credit limit amount |
| Statement Type | StatementType | string | ❌ | Balance Brought Forward, Open Item |
| Parent Account | ParentAccount | string | ❌ | Parent customer ID |
| Email | Email | string | ❌ | Primary email |
| Phone | Phone | string | ❌ | Primary phone |

**Nested Entities:**
- MainAddress (billing address: AddressLine1, City, State, PostalCode, Country)
- MainContact (primary contact: FirstName, LastName, Email, Phone)
- ShippingAddresses (collection of shipping addresses)
- PaymentMethods (stored payment methods)
- Salespersons (assigned sales reps with commission splits)

**Common Aliases for Auto-Mapping:**
- Account, Acct, Cust ID → CustomerID
- Company, Company Name, Account Name → CustomerName
- Class, Customer Type → CustomerClass
- Payment Terms, Net Terms → Terms
- Address, Street, Address Line 1 → MainAddress.AddressLine1
- City, Town → MainAddress.City
- State, Province, Region → MainAddress.State
- Zip, Zip Code, Postal Code → MainAddress.PostalCode
- Contact, Contact Name → MainContact.DisplayName
- Contact Email → MainContact.Email
- Contact Phone → MainContact.Phone1

### 3.3 Vendors

**Acumatica API Entity:** `Vendor`
**API Endpoint:** `PUT /entity/Default/24.200.001/Vendor`

**Core Fields:**

| Field | API Name | Type | Required | Notes |
|-------|----------|------|----------|-------|
| Vendor ID | VendorID | string | ✅ | Unique identifier |
| Vendor Name | VendorName | string | ✅ | Legal/display name |
| Vendor Class | VendorClass | string | ✅ | Must exist in Acumatica |
| Status | Status | string | ✅ | Active, On Hold, One-Time |
| Terms | Terms | string | ❌ | Payment terms code |
| Currency | CurrencyID | string | ❌ | Defaults to base currency |
| Tax Zone | TaxZone | string | ❌ | Tax zone code |
| Payment Method | PaymentMethod | string | ❌ | Default payment method |
| Cash Account | CashAccount | string | ❌ | Default cash account |
| Landed Cost | LandedCostVendor | boolean | ❌ | Is landed cost vendor |
| Tax Agency | TaxAgency | boolean | ❌ | Is tax agency |
| Email | Email | string | ❌ | Primary email |
| Phone | Phone | string | ❌ | Primary phone |

**Nested Entities:**
- MainAddress (remittance address)
- MainContact (primary contact)
- RemittanceAddresses (collection of remittance addresses)
- PaymentDetails (banking/payment info)
- Attributes (custom vendor attributes)

**Common Aliases for Auto-Mapping:**
- Supplier, Supplier ID, Vendor #, Vendor Number → VendorID
- Supplier Name, Company, Company Name → VendorName
- Class, Vendor Type, Category → VendorClass
- Payment Terms, Net Terms, Terms Code → Terms
- Address, Street, Address Line 1 → MainAddress.AddressLine1
- Contact, Contact Name → MainContact.DisplayName

---

## 4. Application Flow

### 4.1 User Journey

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1. Select   │────▶│  2. Select   │────▶│  3. Upload   │────▶│  4. Map      │────▶│  5. Validate │────▶│  6. Import   │
│  Entity Type │     │  Import Mode │     │  File        │     │  Fields      │     │  & Preview   │     │  & Log       │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                     Create Only                                                    Fetches lookups
                     Create or Update                                               + existing keys
                     Update Only                                                    from Acumatica
```

### 4.2 Step 1 — Entity Type & Mode Selection

**Route:** `/import`

**Behavior:**
- Display three cards: Stock Items, Customers, Vendors
- Each card shows the entity icon, name, brief description, and count of required fields
- After selecting an entity type, the user selects an **import mode**:
  - **Create Only** — Import new records. Fails if a record with the same key already exists.
  - **Create or Update** — Creates new records and updates existing ones based on the key field.
  - **Update Only** — Only updates records that already exist. Fails if the key is not found.
- Selecting a mode navigates to `/import/stock-items/upload`, `/import/customers/upload`, or `/import/vendors/upload` with the mode stored in URL search params (`?mode=create`)
- If no Acumatica connection is configured, show a prompt to set one up first with link to `/settings/connections`

### 4.3 Step 2 — File Upload

**Route:** `/import/[type]/upload`

**Behavior:**
- Drag-and-drop zone accepting `.xlsx`, `.xls`, and `.csv` files
- File is parsed entirely client-side (SheetJS for Excel, Papaparse for CSV)
- On parse completion, display:
  - File name, size, row count, column count
  - First 5 rows as a preview table
  - Sheet selector dropdown if the Excel file has multiple sheets
- File data is held in browser memory (not uploaded to server)
- "Continue to Mapping" button navigates to the mapping screen, passing parsed data via React state or a lightweight client-side store
- Max file size: 10MB (UI-enforced, can be adjusted)
- Max rows: 10,000 (v1 limit — can be increased with queue-based processing later)

**Error Handling:**
- Invalid file type → inline error message
- Parse failure → show error detail with suggestion to check file format
- Empty file → show message, block progression

### 4.4 Step 3 — Field Mapping

**Route:** `/import/[type]/map`

**Behavior:**
- Two-column mapping interface:
  - Left: Source columns from uploaded file (with sample data preview)
  - Right: Target Acumatica fields for the selected entity type
- **Auto-mapping runs immediately on page load** using a three-pass algorithm:
  1. **Exact match:** Source header matches Acumatica field name exactly (case-insensitive)
  2. **Alias match:** Source header matches a known alias from the entity's alias dictionary
  3. **Fuzzy match:** Fuse.js similarity scoring for remaining unmatched columns (threshold: 0.4)
- Each mapping row shows:
  - Source column name
  - Sample values (first 3 non-empty values from that column)
  - Target field dropdown (searchable)
  - Confidence indicator: green (exact/alias), yellow (fuzzy), gray (unmapped)
  - "Ignore this column" toggle
- Required target fields that are unmapped show a red warning indicator
- Users can set **default values** for target fields that have no source column mapped (e.g., ItemStatus = "Active" for all rows)
- **Mapping templates:**
  - "Save as Template" button — name the template, stored per entity type and user
  - "Load Template" dropdown — apply a previously saved mapping
  - Templates store: field mappings, default values, ignored columns

**Validation before proceeding:**
- All required target fields must be either mapped or have a default value set
- No two source columns can map to the same target field
- Warning (non-blocking) if source columns are left unmapped

### 4.5 Step 4 — Validation Preview

**Route:** `/import/[type]/preview`

**Behavior:**
- **Pre-validation data fetch:** Before showing the table, the app fetches reference data from Acumatica (Item Classes, UOMs, Terms, etc.) and — for Create Only or Update Only modes — fetches existing record keys. A loading indicator shows progress: "Fetching reference data from Acumatica... (3/5)"
- Full data table showing every row with validation status
- Each row gets a status: ✅ Pass, ⚠️ Warning, ❌ Fail
- Column headers show the mapped target field names
- Status column is sortable/filterable (show failures first)
- Row count summary at top: "847 pass, 12 warnings, 3 failures"

**Validation Rules (run client-side after fetching lookup data):**

| Rule | Severity | Example |
|------|----------|---------|
| Required field is empty | ❌ Fail | InventoryID is blank |
| Data type mismatch | ❌ Fail | Price field contains "N/A" |
| String exceeds max length | ⚠️ Warning | Description > 256 chars |
| Duplicate key within file | ❌ Fail | Two rows with same InventoryID |
| Key already exists (Create Only mode) | ❌ Fail | InventoryID "WIDGET-001" already in Acumatica |
| Key not found (Update Only mode) | ❌ Fail | CustomerID "CUST-999" not in Acumatica |
| Reference value not found | ❌ Fail | ItemClass "BADCLASS" doesn't exist in Acumatica |
| Reference value close match | ⚠️ Warning | Term "2%10NET30" — did you mean "2/10 NET 30"? |
| Value not in allowed set | ⚠️ Warning | ItemStatus = "Live" (not a valid status) |
| Potential formatting issue | ⚠️ Warning | Phone number has inconsistent format |

- Clicking a failed row expands it to show the specific validation errors
- Users can:
  - **Exclude rows** — checkbox to skip individual rows during import
  - **Edit inline** — click a cell to fix the value directly
  - **Exclude all failures** — bulk action to skip all failed rows
- "Proceed to Import" button shows count of rows that will be imported
- Blocked if zero passing rows

### 4.6 Step 5 — Import Execution & Log

**Route:** `/import/[type]/results`

**Behavior:**
- Import begins immediately on page load
- Progress section shows:
  - Progress bar with percentage
  - "Processing row 234 of 847"
  - Elapsed time
  - Running counts: ✅ succeeded, ❌ failed, ⏳ pending
- Records are sent to Acumatica in configurable batches (default: 10 records per batch)
- After each batch completes, the results table updates in real-time
- Each row in the results table shows:
  - Row number
  - Key field value (InventoryID, CustomerID, or VendorID)
  - Status: Success or Failed
  - If failed: Acumatica's error message (parsed into human-readable form)
  - Timestamp

**Post-Import:**
- Summary card: total rows, success count, failure count, duration
- "Export Log as CSV" button — downloads the full row-level results
- "View in Import History" link — navigates to the persistent log
- "Start New Import" button — returns to entity selection
- The entire import session is persisted to the database (see Section 6)

---

## 5. Import Processing Engine

### 5.1 API Communication

All imports use Acumatica's **Contract-Based REST API** with PUT requests to create or update records.

**Authentication Flow:**
1. App authenticates to Acumatica using stored credentials (OAuth2 or basic auth via `/entity/auth/login`)
2. Auth token/cookie is cached for the session duration
3. On 401 response, re-authenticate and retry once
4. On repeated auth failure, abort import with clear error message

**Request Format:**
```json
PUT /entity/Default/{version}/{EntityType}
Content-Type: application/json

{
  "InventoryID": { "value": "WIDGET-001" },
  "Description": { "value": "Blue Widget" },
  "ItemClass": { "value": "FINISHED" },
  "BaseUOM": { "value": "EACH" },
  "DefaultPrice": { "value": 29.99 }
}
```

Note: Acumatica's API uses a `{ "value": ... }` wrapper for each field. The entity adapters handle this transformation.

### 5.2 Batching Strategy

| Setting | Default | Configurable |
|---------|---------|-------------|
| Batch size | 10 records | Yes (1-50) |
| Delay between batches | 500ms | Yes (0-5000ms) |
| Max retries per record | 3 | Yes (0-5) |
| Retry backoff | Exponential (1s, 2s, 4s) | No |
| Timeout per request | 30s | Yes (10-120s) |

### 5.3 Error Handling

| Scenario | Behavior |
|----------|----------|
| Individual record fails validation in Acumatica | Log the error, continue to next record |
| 429 Too Many Requests | Pause batch, wait per Retry-After header, resume |
| 5xx Server Error | Retry with exponential backoff, fail after max retries |
| Network timeout | Retry once, then mark as failed |
| Auth token expired mid-import | Re-authenticate, retry current batch |
| Acumatica instance unreachable | Pause import, notify user, offer resume |

### 5.4 Entity Adapter Interface

Every entity adapter implements this interface. This is the contract that makes the system extensible to new entity types and new ERP platforms.

```typescript
interface EntityAdapter {
  // Identity
  entityType: string;                    // "StockItem", "Customer", "Vendor"
  entityLabel: string;                   // Human-readable name
  keyField: string;                      // "InventoryID", "CustomerID", "VendorID"

  // Schema
  getFields(): EntityField[];            // All mappable fields with metadata
  getRequiredFields(): EntityField[];    // Subset that are required
  getFieldAliases(): AliasMap;           // Common name → API field name

  // Lookups & Pre-Validation
  getLookupRequirements(): LookupRequirement[];  // Which reference entities to fetch
  fetchExistingKeys(                     // Fetch existing record keys for mode validation
    client: AcumaticaClient
  ): Promise<Set<string>>;

  // Transformation
  mapRecord(                             // Transform a flat row into API format
    row: Record<string, string>,
    mapping: FieldMapping[]
  ): AcumaticaRecord;

  // Validation
  validateRecord(                        // Pre-flight validation
    record: AcumaticaRecord,
    lookups: LookupContext,              // Pre-fetched reference data
    mode: ImportMode                     // "create" | "create_or_update" | "update"
  ): ValidationResult;

  // API
  pushRecord(                            // Send to Acumatica
    client: AcumaticaClient,
    record: AcumaticaRecord
  ): Promise<ImportRowResult>;
}

type ImportMode = "create" | "create_or_update" | "update";

interface LookupRequirement {
  name: string;                          // "ItemClass", "UOM", "TaxCategory", etc.
  entity: string;                        // Acumatica entity to query
  keyField: string;                      // Field to extract as the lookup value
  label: string;                         // Human-readable: "Item Classes"
}

interface LookupContext {
  lookups: Record<string, Set<string>>;  // e.g., { "ItemClass": Set(["FINISHED", "RAW"]) }
  existingKeys: Set<string> | null;      // Pre-fetched keys for create/update mode validation
}
```

---

## 6. Data Model

### 6.1 Database Tables

**connections**
```
id              UUID        PK
user_id         string      FK to Clerk user
org_id          string      nullable, FK to Clerk org
name            string      display name ("Production", "Sandbox")
instance_url    string      Acumatica base URL
api_version     string      e.g., "24.200.001"
auth_type       string      "oauth2" | "basic"
credentials     text        encrypted JSON (tokens or user/pass)
is_active       boolean     default true
created_at      timestamp
updated_at      timestamp
```

**import_sessions**
```
id              UUID        PK
user_id         string      FK to Clerk user
connection_id   UUID        FK to connections
entity_type     string      "StockItem" | "Customer" | "Vendor"
mode            string      "create" | "create_or_update" | "update"
file_name       string      original upload filename
total_rows      integer     total rows attempted
success_count   integer     rows successfully imported
fail_count      integer     rows that failed
warning_count   integer     rows imported with warnings
created_count   integer     rows that were new creates
updated_count   integer     rows that were updates (create_or_update mode)
status          string      "running" | "completed" | "failed" | "cancelled"
started_at      timestamp
completed_at    timestamp   nullable
duration_ms     integer     nullable
mapping_used    jsonb       the field mapping applied (for audit)
created_at      timestamp
```

**import_row_logs**
```
id              UUID        PK
session_id      UUID        FK to import_sessions
row_number      integer     original row number from file
key_value       string      the InventoryID, CustomerID, or VendorID
status          string      "success" | "failed" | "skipped"
operation       string      "created" | "updated" | null (null if failed/skipped)
mapped_data     jsonb       the data sent to Acumatica (post-mapping)
error_message   text        nullable, Acumatica error if failed
error_code      string      nullable, Acumatica error code
created_at      timestamp

INDEX: session_id + status (for filtered queries)
INDEX: session_id + row_number (for ordered retrieval)
```

**mapping_templates**
```
id              UUID        PK
user_id         string      FK to Clerk user
org_id          string      nullable
entity_type     string      "StockItem" | "Customer" | "Vendor"
name            string      user-given template name
mappings        jsonb       array of { sourceColumn, targetField, defaultValue }
ignored_columns jsonb       array of source column names to skip
created_at      timestamp
updated_at      timestamp

UNIQUE: user_id + entity_type + name
```

---

## 7. Project Structure

```
acumatica-import-wizard/
├── src/
│   ├── app/
│   │   ├── layout.tsx                        # Root layout with Clerk provider
│   │   ├── page.tsx                          # Dashboard / landing
│   │   ├── import/
│   │   │   ├── page.tsx                      # Entity type selector
│   │   │   └── [type]/
│   │   │       ├── upload/page.tsx           # File upload + parse
│   │   │       ├── map/page.tsx              # Mapping interface
│   │   │       ├── preview/page.tsx          # Validation preview
│   │   │       └── results/page.tsx          # Import progress + log
│   │   ├── logs/
│   │   │   ├── page.tsx                      # Import session history
│   │   │   └── [sessionId]/page.tsx          # Session detail view
│   │   ├── settings/
│   │   │   ├── connections/page.tsx          # Acumatica connection config
│   │   │   └── templates/page.tsx            # Saved mapping templates
│   │   └── api/
│   │       ├── schema/[entityType]/route.ts  # Entity schema endpoint
│   │       ├── mapping/suggest/route.ts      # Auto-mapping engine
│   │       ├── validate/route.ts             # Pre-import validation
│   │       ├── import/process/route.ts       # Batched import processor (SSE)
│   │       └── imports/[sessionId]/route.ts  # Import log CRUD
│   ├── lib/
│   │   ├── acumatica/
│   │   │   ├── auth.ts                       # Auth manager
│   │   │   ├── client.ts                     # Base API client with retry
│   │   │   ├── schema.ts                     # Schema fetcher + cache (includes UDFs)
│   │   │   ├── lookups.ts                    # Reference data fetcher + cache
│   │   │   └── entities/
│   │   │       ├── types.ts                  # Shared interfaces (EntityAdapter, etc.)
│   │   │       ├── stockItem.ts              # Stock Item adapter
│   │   │       ├── customer.ts               # Customer adapter
│   │   │       └── vendor.ts                 # Vendor adapter
│   │   ├── mapping/
│   │   │   ├── engine.ts                     # Auto-mapping algorithm
│   │   │   ├── aliases.ts                    # Field alias dictionaries
│   │   │   └── templates.ts                  # Template CRUD helpers
│   │   ├── validation/
│   │   │   ├── engine.ts                     # Validation runner
│   │   │   ├── rules.ts                      # Per-entity validation rules
│   │   │   └── lookups.ts                    # Lookup-based validation (references, keys)
│   │   ├── parser/
│   │   │   ├── xlsx.ts                       # SheetJS wrapper
│   │   │   └── csv.ts                        # Papaparse wrapper
│   │   └── db/
│   │       ├── schema.ts                     # Drizzle schema definitions
│   │       ├── queries.ts                    # Common query helpers
│   │       └── migrate.ts                    # Migration runner
│   ├── components/
│   │   ├── import/
│   │   │   ├── EntitySelector.tsx            # Entity type cards
│   │   │   ├── FileDropzone.tsx              # Upload component
│   │   │   ├── FilePreview.tsx               # Parsed file preview table
│   │   │   ├── MappingGrid.tsx               # Full mapping interface
│   │   │   ├── MappingRow.tsx                # Single field mapping row
│   │   │   ├── ConfidenceBadge.tsx           # Match confidence indicator
│   │   │   ├── ValidationPreview.tsx         # Validation results table
│   │   │   ├── ImportProgress.tsx            # Progress bar + stats
│   │   │   └── ImportResultsTable.tsx        # Row-level results
│   │   ├── logs/
│   │   │   ├── SessionList.tsx               # Import history table
│   │   │   └── RowDetailTable.tsx            # Session drill-down
│   │   ├── settings/
│   │   │   ├── ConnectionForm.tsx            # Add/edit Acumatica connection
│   │   │   └── ConnectionList.tsx            # Manage connections
│   │   └── ui/                               # shadcn/ui components
│   ├── hooks/
│   │   ├── useFileParser.ts                  # File parsing hook
│   │   ├── useAutoMapping.ts                 # Auto-mapping hook
│   │   ├── useImportProcessor.ts             # Import execution hook
│   │   └── useImportSession.ts               # Session state management
│   └── types/
│       ├── entities.ts                       # Entity type definitions
│       ├── mapping.ts                        # Mapping-related types
│       ├── import.ts                         # Import session types
│       └── acumatica.ts                      # Acumatica API types
├── drizzle/
│   └── migrations/                           # Generated SQL migrations
├── public/
├── .env.local                                # Local env vars
├── .env.example                              # Env template
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── SPEC.md                                   # This file
```

---

## 8. UI/UX Design Direction

### 8.1 Aesthetic

Clean, utilitarian, tool-first. This is a professional productivity tool — the design should feel like a well-built instrument, not a marketing landing page. Think: linear.app meets a spreadsheet.

**Design Tokens:**
- Background: near-black (`#0a0a0b`) with subtle noise texture
- Surface: dark gray cards (`#141416`) with 1px borders (`#262629`)
- Primary accent: electric blue (`#3b82f6`) for actions and active states
- Success: green (`#22c55e`)
- Warning: amber (`#f59e0b`)
- Error: red (`#ef4444`)
- Typography: monospace for data values and field names, sans-serif for UI labels
- Border radius: minimal (4-6px) — sharp, not bubbly

### 8.2 Key UI Patterns

**Wizard Step Indicator:** Horizontal step bar at the top of all import pages showing: Select → Upload → Map → Validate → Import. Current step highlighted, completed steps show checkmarks. Clickable to go back (but not forward past current step).

**Mapping Grid:** The most complex UI element. Each row is a mapping between source → target with:
- Left pill showing source column name + sample values on hover
- Arrow or connector line
- Right dropdown showing target field (searchable, grouped by required/optional)
- Confidence badge (green/yellow/gray dot)
- Default value input (shown when no source column mapped)

**Data Tables:** Use virtual scrolling for the validation preview and results tables to handle 10,000+ rows without performance issues. Sticky headers. Sortable and filterable columns.

**Progress Streaming:** During import, use a Server-Sent Events (SSE) connection from the client to the import API route. Each batch completion event updates the progress bar and results table in real-time.

### 8.3 Responsive Behavior

Primary target: desktop (1280px+). The mapping grid and data tables require wide viewports. On tablet (768-1279px), the mapping grid switches to a stacked card layout. Mobile is not a priority for v1 — show a message suggesting desktop use.

---

## 9. Acumatica API Integration Details

### 9.1 Authentication

**Option A — OAuth2 (Recommended for production):**
- Register the app as a Connected Application in Acumatica
- Use Authorization Code flow for initial token
- Store refresh token encrypted in the connections table
- Auto-refresh access tokens on expiry

**Option B — Basic Auth (Faster for development):**
- POST to `/entity/auth/login` with username, password, company, branch
- Receive session cookie
- Cookie valid for configurable session duration
- Re-login on 401

### 9.2 API Versioning

The API endpoint path includes the version: `/entity/Default/{version}/{Entity}`. Version is stored per connection so the tool works with Acumatica instances on different versions. V1 targets **24.200.001** as the default but should handle 23.200.001+ gracefully.

### 9.3 Schema Discovery

Acumatica exposes entity metadata at:
```
GET /entity/Default/{version}/{Entity}/$adm/schema
```

This returns all fields with their names, types, and required status. The app fetches and caches this per entity type per connection. The cached schema powers:
- The target field dropdown in the mapping UI
- Auto-validation rules (required fields, data types)
- The auto-mapping engine (field names to match against)

### 9.4 Rate Limiting Considerations

Acumatica doesn't publish formal rate limits but their API is not designed for high-throughput bulk operations. Practical guidelines:
- Keep batch sizes at 10-25 records
- Add 200-500ms delay between batches
- Monitor for 429 responses and respect Retry-After headers
- For imports >1,000 rows, warn the user about expected duration
- Consider implementing a "turbo mode" toggle that reduces delays for instances with known capacity

---

## 10. Security

### 10.1 Credential Storage

- Acumatica credentials encrypted at rest using AES-256
- Encryption key stored as environment variable, never in code
- Credentials only decrypted server-side in API routes, never sent to client
- Connection test endpoint validates credentials without storing response data

### 10.2 Data Handling

- File data is parsed and held in browser memory only — never uploaded to the server
- Mapped data sent to the import API route is processed in-memory and forwarded to Acumatica
- Import logs store the mapped data (for audit) but not raw file content
- Row-level log data can be purged after a configurable retention period

### 10.3 Access Control

- Clerk handles authentication and org-level authorization
- Connections are scoped to user or org — users can only see their own connections
- Import sessions are scoped to the user who created them
- Mapping templates can be scoped to user (private) or org (shared)

---

## 11. Implementation Phases

### Phase 1 — Foundation (Week 1-2)

- [ ] Project scaffold: Next.js, Tailwind, shadcn/ui, Drizzle, Clerk (single-user config)
- [ ] Database schema + migrations (connections, import_sessions, import_row_logs, mapping_templates)
- [ ] Acumatica auth manager (basic auth for dev, OAuth2 stubbed)
- [ ] Base API client with retry logic
- [ ] Entity type selector page with import mode selection (Create / Create or Update / Update)
- [ ] File upload + client-side parsing (xlsx and csv)
- [ ] File preview component

### Phase 2 — Mapping Engine (Week 3-4)

- [ ] Entity adapters: Stock Item, Customer, Vendor (field definitions, aliases, mapRecord, getLookupRequirements)
- [ ] Schema fetcher with extended schema support (standard + custom fields / UDFs)
- [ ] Auto-mapping engine (exact, alias, fuzzy three-pass)
- [ ] Mapping grid UI with target field dropdowns (grouped: Required / Optional / Custom Fields)
- [ ] Confidence badges and sample data preview
- [ ] Default value inputs for unmapped required fields
- [ ] Mapping template save/load

### Phase 3 — Validation & Import (Week 5-7)

- [ ] Lookup data fetcher — pre-fetches reference tables (Item Classes, UOMs, Terms, etc.) from Acumatica
- [ ] Existing key fetcher for Create Only / Update Only mode validation
- [ ] Validation engine with per-entity rules + lookup-based validation
- [ ] Validation preview table with pass/warn/fail indicators and reference-aware error messages
- [ ] Inline editing and row exclusion
- [ ] One-import-per-connection enforcement (check for running sessions before starting)
- [ ] Import processor with batching, retry, and SSE progress streaming
- [ ] Import mode-aware processing (track created vs updated counts)
- [ ] Real-time progress UI
- [ ] Results table with row-level detail (including created/updated indicators)
- [ ] Import session persistence to database

### Phase 4 — Logging & Polish (Week 8-9)

- [ ] Import history dashboard (session list with mode column, filtering, search)
- [ ] Session detail drill-down (row-level log with operation type)
- [ ] CSV export of import logs
- [ ] Connection management UI (add, test, edit, delete)
- [ ] Cancel running import functionality
- [ ] Error message humanization (parse Acumatica errors into readable form)
- [ ] Edge cases: empty files, duplicate handling, special characters, large files
- [ ] Performance testing with 5,000+ row imports
- [ ] Schema refresh button in mapping UI (re-fetch for newly added custom fields)

### Future (Post-v1)

- [ ] OAuth2 Connected Application flow
- [ ] Nested entity mapping (WarehouseDetails, CrossReferences, Addresses)
- [ ] Scheduled/recurring imports
- [ ] Multi-user / org support via Clerk organizations (shared connections, shared templates)
- [ ] Sage Intacct adapter
- [ ] Dynamics 365 adapter
- [ ] Multi-file imports (e.g., items + their warehouse details in separate files)
- [ ] Webhook notifications on import completion
- [ ] API endpoint for programmatic imports (headless mode)
- [ ] Attribute-type custom field mapping UI (key-value pair interface)

---

## 12. Environment Variables

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Database (Vercel Postgres / Neon)
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...  # for migrations

# Encryption
CREDENTIALS_ENCRYPTION_KEY=...          # 32-byte hex string for AES-256

# Acumatica (dev defaults — production uses per-connection stored creds)
ACUMATICA_BASE_URL=https://your-instance.acumatica.com
ACUMATICA_API_VERSION=24.200.001
```

---

## 13. Success Metrics

| Metric | Target |
|--------|--------|
| Time to complete a 500-row Stock Item import | < 10 minutes (including mapping) |
| Auto-mapping accuracy on typical spreadsheets | > 70% of fields correctly matched |
| Mapping reuse rate (templates) | > 50% of imports use a saved template |
| Import success rate (data quality dependent) | > 95% for pre-validated rows |
| Zero data loss | 100% — every row outcome logged and auditable |

---

## 14. Design Decisions (Resolved)

### 14.1 Create + Update Mode ✅

The import wizard supports both **Create** and **Update** modes, selectable per import session.

**UI Change:** After entity type selection and before file upload, the user chooses an import mode:
- **Create Only** — Sends PUT requests for new records. If a record with the same key (InventoryID, CustomerID, VendorID) already exists in Acumatica, that row is marked as failed with a "duplicate key" error.
- **Create or Update** — Sends PUT requests that create new records or update existing ones. Acumatica's PUT endpoint handles this natively — if the key exists, it updates; if not, it creates.
- **Update Only** — Sends PUT requests but pre-validates that the key already exists in Acumatica. Rows with keys not found in Acumatica are marked as failed during pre-validation.

**Implementation Impact:**
- Import mode is stored on the `import_sessions` table as a `mode` column (`"create" | "create_or_update" | "update"`)
- For "Create Only" and "Update Only" modes, the pre-validation step fetches existing keys from Acumatica via `GET /entity/Default/{version}/{Entity}?$select=KeyField&$top=0` (or paginated retrieval) to build a lookup set
- The entity adapter interface gets an additional method: `fetchExistingKeys(client: AcumaticaClient): Promise<Set<string>>`
- Validation engine uses the key lookup to flag duplicates (create mode) or missing records (update mode)
- The results log records whether each row was a create or update operation

### 14.2 Custom Field / Extended Schema Support ✅

The schema fetcher pulls **both** standard and custom fields (User-Defined Fields / UDFs) from Acumatica.

**How Acumatica Exposes Custom Fields:**
- UDFs are available on the API entity when the custom field is added to a Generic Inquiry or the entity's endpoint is extended via a customization project
- The `$adm/schema` endpoint includes custom fields that have been exposed on the endpoint
- Custom attributes (from the Attributes tab) are accessible via the `Attributes` nested entity as key-value pairs

**Implementation Impact:**
- Schema fetcher hits `$adm/schema` and includes all returned fields regardless of whether they're standard or custom
- Custom fields are displayed in the mapping target dropdown under a separate "Custom Fields" group
- Attribute-type fields are handled via a special mapping mode: user maps a source column to an attribute name, and the adapter wraps it into the `Attributes` nested entity format:
  ```json
  { "Attributes": [{ "AttributeID": { "value": "COLOR" }, "Value": { "value": "Blue" } }] }
  ```
- Schema cache includes a `isCustom: boolean` flag per field for UI grouping
- Schema refresh button in the mapping UI to re-fetch if the user has added new custom fields to their Acumatica instance

### 14.3 One Import Per Connection ✅

Only one active import session is allowed per Acumatica connection at a time.

**Implementation Impact:**
- Before starting an import, the API checks `import_sessions` for any record with the same `connection_id` and `status = "running"`
- If found, the user sees a message: "An import is already running on this connection. Please wait for it to complete or cancel it."
- The import session list shows a "Cancel" action on running imports that sets `status = "cancelled"` and stops the processor
- This prevents overwhelming the Acumatica instance and avoids race conditions on record creation

### 14.4 Deep Pre-Validation with Lookup Tables ✅

The validation engine pre-fetches reference data from Acumatica to validate field values before import, not just structural checks.

**Lookup Tables to Pre-Fetch (by entity type):**

| Entity | Lookups | API Query |
|--------|---------|-----------|
| Stock Item | Item Classes, UOMs, Tax Categories, Warehouses, Vendor IDs | GET each entity with `$select=ID&$top=0` |
| Customer | Customer Classes, Terms, Tax Zones, Currency IDs, Salesperson IDs | GET each entity with `$select=ID&$top=0` |
| Vendor | Vendor Classes, Terms, Tax Zones, Payment Methods, Cash Accounts | GET each entity with `$select=ID&$top=0` |

**Validation Behavior:**
- Lookups are fetched once at the start of the validation step (after mapping, before preview)
- Loading indicator: "Fetching reference data from Acumatica..." with progress per lookup table
- Validation rules now include:
  - "Item Class 'BADCLASS' does not exist in Acumatica" (❌ Fail)
  - "Warehouse 'MAIN' exists" (✅ Pass)
  - "Term '2%10NET30' not found — did you mean '2/10 NET 30'?" (⚠️ Warning with suggestion)
- Lookup data is cached for the duration of the import session (not persisted — always fresh per session)
- If a lookup fetch fails (e.g., user doesn't have permission to query Item Classes), validation gracefully degrades to structural checks only for that field, with a warning shown to the user

**Implementation Impact:**
- New `lib/validation/lookups.ts` module that fetches and caches reference data
- Validation engine accepts a `LookupContext` parameter with the pre-fetched sets
- Each entity adapter defines a `getLookupRequirements(): LookupRequirement[]` method specifying which reference entities to fetch
- The validation preview page shows a brief loading state while lookups are fetched before displaying results

### 14.5 Single-User Auth ✅

V1 launches as a single-user application. No Clerk organizations or team features.

**Implementation Impact:**
- Clerk configured for individual accounts only (no org switcher, no team invites)
- All data (connections, sessions, templates) scoped to `user_id` only
- `org_id` columns remain in the schema as nullable for future multi-tenant support but are not populated or queried in v1
- Simplifies the settings UI — no sharing controls on connections or templates
- Auth middleware checks `userId` only, no role-based access control needed
