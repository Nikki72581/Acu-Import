import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getConnectionById } from "@/lib/db/queries";
import { decryptCredentials } from "@/lib/acumatica/encryption";
import { AcumaticaAuthManager } from "@/lib/acumatica/auth";
import type { AcumaticaCredentials } from "@/types/acumatica";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const connection = await getConnectionById(id, userId);
  if (!connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  let credentials: AcumaticaCredentials;
  try {
    credentials = decryptCredentials<AcumaticaCredentials>(connection.credentials);
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to decrypt credentials" },
      { status: 500 }
    );
  }

  try {
    const authManager = new AcumaticaAuthManager(
      connection.instanceUrl,
      connection.apiVersion
    );
    await authManager.login(credentials);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection test failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
