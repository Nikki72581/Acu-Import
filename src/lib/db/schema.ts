import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const connections = pgTable("connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  orgId: text("org_id"),
  name: text("name").notNull(),
  instanceUrl: text("instance_url").notNull(),
  apiVersion: text("api_version").notNull().default("24.200.001"),
  authType: text("auth_type").notNull().default("basic"), // "oauth2" | "basic"
  credentials: text("credentials").notNull(), // encrypted JSON
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const importSessions = pgTable("import_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  connectionId: uuid("connection_id")
    .notNull()
    .references(() => connections.id),
  entityType: text("entity_type").notNull(), // "StockItem" | "Customer" | "Vendor"
  mode: text("mode").notNull(), // "create" | "create_or_update" | "update"
  fileName: text("file_name").notNull(),
  totalRows: integer("total_rows").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  failCount: integer("fail_count").notNull().default(0),
  warningCount: integer("warning_count").notNull().default(0),
  createdCount: integer("created_count").notNull().default(0),
  updatedCount: integer("updated_count").notNull().default(0),
  status: text("status").notNull().default("running"), // "running" | "completed" | "failed" | "cancelled"
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),
  mappingUsed: jsonb("mapping_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const importRowLogs = pgTable(
  "import_row_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => importSessions.id),
    rowNumber: integer("row_number").notNull(),
    keyValue: text("key_value").notNull(),
    status: text("status").notNull(), // "success" | "failed" | "skipped"
    operation: text("operation"), // "created" | "updated" | null
    mappedData: jsonb("mapped_data"),
    errorMessage: text("error_message"),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_row_logs_session_status").on(table.sessionId, table.status),
    index("idx_row_logs_session_row").on(table.sessionId, table.rowNumber),
  ]
);

export const mappingTemplates = pgTable(
  "mapping_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    orgId: text("org_id"),
    entityType: text("entity_type").notNull(),
    name: text("name").notNull(),
    mappings: jsonb("mappings").notNull(), // array of { sourceColumn, targetField, defaultValue }
    ignoredColumns: jsonb("ignored_columns"), // array of source column names
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_templates_user_entity_name").on(
      table.userId,
      table.entityType,
      table.name
    ),
  ]
);
