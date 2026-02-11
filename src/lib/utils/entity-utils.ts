import { ENTITY_SLUG_MAP, ENTITY_TYPE_TO_SLUG, ENTITY_CONFIGS } from "@/types/entities";
import type { EntityType, ImportMode } from "@/types/entities";

export function slugToEntityType(slug: string): EntityType | null {
  return ENTITY_SLUG_MAP[slug] ?? null;
}

export function entityTypeToSlug(entityType: EntityType): string {
  return ENTITY_TYPE_TO_SLUG[entityType];
}

export function isValidImportMode(mode: string): mode is ImportMode {
  return ["create", "create_or_update", "update"].includes(mode);
}

export function getEntityConfig(entityType: EntityType) {
  return ENTITY_CONFIGS[entityType];
}

export function getRequiredFieldCount(entityType: EntityType): number {
  return ENTITY_CONFIGS[entityType].fields.filter((f) => f.required).length;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
