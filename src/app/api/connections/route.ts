import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getConnectionsByUser, createConnection } from "@/lib/db/queries";
import { encryptCredentials } from "@/lib/acumatica/encryption";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await getConnectionsByUser(userId);

  // Return without credentials for security
  const safe = connections.map(({ credentials: _, ...rest }) => rest);
  return NextResponse.json(safe);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name: string;
    instanceUrl: string;
    apiVersion?: string;
    authType?: string;
    username: string;
    password: string;
    company?: string;
    branch?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, instanceUrl, apiVersion, authType, username, password, company, branch } = body;

  if (!name?.trim() || !instanceUrl?.trim() || !username?.trim() || !password?.trim()) {
    return NextResponse.json(
      { error: "Name, instance URL, username, and password are required" },
      { status: 400 }
    );
  }

  const credentials = encryptCredentials({
    username: username.trim(),
    password: password.trim(),
    ...(company?.trim() && { company: company.trim() }),
    ...(branch?.trim() && { branch: branch.trim() }),
  });

  const connection = await createConnection({
    userId,
    name: name.trim(),
    instanceUrl: instanceUrl.trim().replace(/\/+$/, ""),
    apiVersion: apiVersion?.trim() || "24.200.001",
    authType: authType || "basic",
    credentials,
  });

  // Return without credentials
  const { credentials: _, ...safe } = connection!;
  return NextResponse.json(safe, { status: 201 });
}
