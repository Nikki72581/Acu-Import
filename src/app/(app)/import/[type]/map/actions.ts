"use server";

import { auth } from "@clerk/nextjs/server";
import {
  getMappingTemplates,
  createMappingTemplate,
  deleteMappingTemplate,
} from "@/lib/db/queries";
import type { FieldMapping } from "@/types/mapping";

export async function loadTemplates(entityType: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const templates = await getMappingTemplates(userId, entityType);
  return templates;
}

export async function saveTemplate(
  entityType: string,
  name: string,
  mappings: FieldMapping[],
  ignoredColumns: string[]
) {
  const { userId, orgId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const template = await createMappingTemplate({
    userId,
    orgId: orgId ?? null,
    entityType,
    name,
    mappings: mappings as unknown as Record<string, unknown>,
    ignoredColumns: ignoredColumns as unknown as Record<string, unknown>,
  });

  return template;
}

export async function deleteTemplate(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await deleteMappingTemplate(id, userId);
}
