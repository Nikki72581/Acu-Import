import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getConnectionById,
  updateConnection,
  deleteConnection,
} from "@/lib/db/queries";
import { encryptCredentials } from "@/lib/acumatica/encryption";

export const dynamic = "force-dynamic";

export async function GET(
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

  const { credentials: _, ...safe } = connection;
  return NextResponse.json(safe);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await getConnectionById(id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  let body: {
    name?: string;
    instanceUrl?: string;
    apiVersion?: string;
    username?: string;
    password?: string;
    company?: string;
    branch?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.name?.trim()) updates.name = body.name.trim();
  if (body.instanceUrl?.trim()) updates.instanceUrl = body.instanceUrl.trim().replace(/\/+$/, "");
  if (body.apiVersion?.trim()) updates.apiVersion = body.apiVersion.trim();

  // Re-encrypt credentials if any auth fields changed
  if (body.username || body.password || body.company !== undefined || body.branch !== undefined) {
    const creds: Record<string, string> = {};
    if (body.username?.trim()) creds.username = body.username.trim();
    if (body.password?.trim()) creds.password = body.password.trim();
    if (body.company !== undefined) creds.company = body.company?.trim() || "";
    if (body.branch !== undefined) creds.branch = body.branch?.trim() || "";

    // Only encrypt if we have username and password
    if (creds.username && creds.password) {
      updates.credentials = encryptCredentials(creds);
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const results = await updateConnection(id, userId, updates);
  if (!results.length) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  const { credentials: _, ...safe } = results[0];
  return NextResponse.json(safe);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await getConnectionById(id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  await deleteConnection(id, userId);
  return NextResponse.json({ success: true });
}
