import { NextResponse } from "next/server";
import { ENTITY_CONFIGS } from "@/types/entities";
import type { EntityType } from "@/types/entities";
import { ENTITY_SLUG_MAP } from "@/types/entities";
import { getStaticFields } from "@/lib/acumatica/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entityType: string }> }
) {
  const { entityType: slug } = await params;

  // Accept both slugs ("stock-items") and entity types ("StockItem")
  const entityType: EntityType | undefined =
    (ENTITY_SLUG_MAP[slug] as EntityType) ??
    (Object.keys(ENTITY_CONFIGS).includes(slug) ? (slug as EntityType) : undefined);

  if (!entityType) {
    return NextResponse.json(
      { error: `Unknown entity type: ${slug}` },
      { status: 400 }
    );
  }

  // Return static fields (custom field fetching from Acumatica is an optional enhancement)
  const fields = getStaticFields(entityType);

  return NextResponse.json({
    entityType,
    fields,
    source: "static",
  });
}
