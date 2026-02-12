import { eq, and, desc } from "drizzle-orm";
import { db } from ".";
import {
  connections,
  importSessions,
  importRowLogs,
  mappingTemplates,
} from "./schema";

// --- Connections ---

export async function getConnectionsByUser(userId: string) {
  return db
    .select()
    .from(connections)
    .where(eq(connections.userId, userId))
    .orderBy(desc(connections.createdAt));
}

export async function getConnectionById(id: string, userId: string) {
  const results = await db
    .select()
    .from(connections)
    .where(and(eq(connections.id, id), eq(connections.userId, userId)));
  return results[0] ?? null;
}

export async function createConnection(
  data: typeof connections.$inferInsert
) {
  const results = await db.insert(connections).values(data).returning();
  return results[0];
}

export async function updateConnection(
  id: string,
  userId: string,
  data: Partial<typeof connections.$inferInsert>
) {
  return db
    .update(connections)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(connections.id, id), eq(connections.userId, userId)))
    .returning();
}

export async function deleteConnection(id: string, userId: string) {
  return db
    .delete(connections)
    .where(and(eq(connections.id, id), eq(connections.userId, userId)));
}

// --- Import Sessions ---

export async function createImportSession(
  data: typeof importSessions.$inferInsert
) {
  const results = await db.insert(importSessions).values(data).returning();
  return results[0];
}

export async function getImportSessionsByUser(userId: string) {
  return db
    .select()
    .from(importSessions)
    .where(eq(importSessions.userId, userId))
    .orderBy(desc(importSessions.createdAt));
}

export async function getImportSessionById(id: string, userId: string) {
  const results = await db
    .select()
    .from(importSessions)
    .where(
      and(eq(importSessions.id, id), eq(importSessions.userId, userId))
    );
  return results[0] ?? null;
}

export async function updateImportSession(
  id: string,
  data: Partial<typeof importSessions.$inferInsert>
) {
  return db
    .update(importSessions)
    .set(data)
    .where(eq(importSessions.id, id))
    .returning();
}

export async function getRunningSessionByConnection(connectionId: string) {
  const results = await db
    .select()
    .from(importSessions)
    .where(
      and(
        eq(importSessions.connectionId, connectionId),
        eq(importSessions.status, "running")
      )
    );
  return results[0] ?? null;
}

export async function getImportSessionsWithConnection(userId: string) {
  return db
    .select({
      id: importSessions.id,
      userId: importSessions.userId,
      connectionId: importSessions.connectionId,
      entityType: importSessions.entityType,
      mode: importSessions.mode,
      fileName: importSessions.fileName,
      totalRows: importSessions.totalRows,
      successCount: importSessions.successCount,
      failCount: importSessions.failCount,
      warningCount: importSessions.warningCount,
      createdCount: importSessions.createdCount,
      updatedCount: importSessions.updatedCount,
      status: importSessions.status,
      startedAt: importSessions.startedAt,
      completedAt: importSessions.completedAt,
      durationMs: importSessions.durationMs,
      createdAt: importSessions.createdAt,
      connectionName: connections.name,
    })
    .from(importSessions)
    .leftJoin(connections, eq(importSessions.connectionId, connections.id))
    .where(eq(importSessions.userId, userId))
    .orderBy(desc(importSessions.createdAt));
}

export async function getRecentImportSessions(userId: string, limit: number = 5) {
  return db
    .select({
      id: importSessions.id,
      entityType: importSessions.entityType,
      mode: importSessions.mode,
      fileName: importSessions.fileName,
      totalRows: importSessions.totalRows,
      successCount: importSessions.successCount,
      failCount: importSessions.failCount,
      status: importSessions.status,
      durationMs: importSessions.durationMs,
      createdAt: importSessions.createdAt,
      connectionName: connections.name,
    })
    .from(importSessions)
    .leftJoin(connections, eq(importSessions.connectionId, connections.id))
    .where(eq(importSessions.userId, userId))
    .orderBy(desc(importSessions.createdAt))
    .limit(limit);
}

// --- Import Row Logs ---

export async function createImportRowLog(
  data: typeof importRowLogs.$inferInsert
) {
  const results = await db.insert(importRowLogs).values(data).returning();
  return results[0];
}

export async function createImportRowLogsBatch(
  data: (typeof importRowLogs.$inferInsert)[]
) {
  return db.insert(importRowLogs).values(data).returning();
}

export async function getRowLogsBySession(sessionId: string) {
  return db
    .select()
    .from(importRowLogs)
    .where(eq(importRowLogs.sessionId, sessionId))
    .orderBy(importRowLogs.rowNumber);
}

// --- Mapping Templates ---

export async function getMappingTemplates(
  userId: string,
  entityType?: string
) {
  const conditions = [eq(mappingTemplates.userId, userId)];
  if (entityType) {
    conditions.push(eq(mappingTemplates.entityType, entityType));
  }
  return db
    .select()
    .from(mappingTemplates)
    .where(and(...conditions))
    .orderBy(desc(mappingTemplates.updatedAt));
}

export async function createMappingTemplate(
  data: typeof mappingTemplates.$inferInsert
) {
  const results = await db.insert(mappingTemplates).values(data).returning();
  return results[0];
}

export async function updateMappingTemplate(
  id: string,
  userId: string,
  data: Partial<typeof mappingTemplates.$inferInsert>
) {
  return db
    .update(mappingTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(mappingTemplates.id, id), eq(mappingTemplates.userId, userId))
    )
    .returning();
}

export async function deleteMappingTemplate(id: string, userId: string) {
  return db
    .delete(mappingTemplates)
    .where(
      and(eq(mappingTemplates.id, id), eq(mappingTemplates.userId, userId))
    );
}
