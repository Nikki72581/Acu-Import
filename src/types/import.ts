import type { ImportMode, EntityType } from "./entities";

export type ImportSessionStatus =
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type ImportRowStatus = "success" | "failed" | "skipped";

export type ImportOperation = "created" | "updated";

export interface ParsedFile {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  selectedSheet: string;
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  totalColumns: number;
}

export interface ImportSession {
  id: string;
  userId: string;
  connectionId: string;
  entityType: EntityType;
  mode: ImportMode;
  fileName: string;
  totalRows: number;
  successCount: number;
  failCount: number;
  warningCount: number;
  createdCount: number;
  updatedCount: number;
  status: ImportSessionStatus;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  createdAt: Date;
}

export interface ImportRowLog {
  id: string;
  sessionId: string;
  rowNumber: number;
  keyValue: string;
  status: ImportRowStatus;
  operation: ImportOperation | null;
  mappedData: Record<string, unknown> | null;
  errorMessage: string | null;
  errorCode: string | null;
  createdAt: Date;
}
