export type MatchConfidence = "exact" | "alias" | "fuzzy" | "none";

export interface FieldMapping {
  sourceColumn: string;
  targetField: string | null;
  confidence: MatchConfidence;
  defaultValue?: string;
  ignored: boolean;
}

export interface MappingTemplate {
  id: string;
  userId: string;
  orgId?: string | null;
  entityType: string;
  name: string;
  mappings: FieldMapping[];
  ignoredColumns: string[];
  createdAt: Date;
  updatedAt: Date;
}
