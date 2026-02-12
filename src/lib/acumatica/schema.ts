import type { EntityField, EntityType } from "@/types/entities";
import { ENTITY_CONFIGS } from "@/types/entities";

/**
 * Parse the Acumatica $adm/schema response into EntityField[] with isCustom flag.
 * Custom fields (UDFs) follow the pattern "UsrXXX".
 */
export function parseSchemaFields(
  schemaFields: Array<{
    FieldName: string;
    ObjectName: string;
    FieldType?: string;
    Required?: boolean;
    Description?: string;
    MaxLength?: number;
  }>
): EntityField[] {
  return schemaFields
    .filter((f) => f.FieldName.startsWith("Usr"))
    .map((f) => ({
      name: f.FieldName,
      apiName: f.FieldName,
      type: mapSchemaType(f.FieldType),
      required: f.Required ?? false,
      description: f.Description ?? `Custom field: ${f.FieldName}`,
      maxLength: f.MaxLength,
      isCustom: true,
    }));
}

function mapSchemaType(type?: string): EntityField["type"] {
  switch (type?.toLowerCase()) {
    case "int":
    case "int32":
    case "int64":
      return "integer";
    case "decimal":
    case "double":
    case "float":
      return "decimal";
    case "bool":
    case "boolean":
      return "boolean";
    default:
      return "string";
  }
}

/**
 * Get all fields for an entity type, including custom fields if available.
 * Falls back to static field definitions if schema fetch fails.
 */
export function getStaticFields(entityType: EntityType): EntityField[] {
  const config = ENTITY_CONFIGS[entityType];
  return config?.fields ?? [];
}

/**
 * Merge static fields with custom fields from schema.
 */
export function mergeFields(
  staticFields: EntityField[],
  customFields: EntityField[]
): EntityField[] {
  const existing = new Set(staticFields.map((f) => f.apiName));
  const deduped = customFields.filter((f) => !existing.has(f.apiName));
  return [...staticFields, ...deduped];
}
