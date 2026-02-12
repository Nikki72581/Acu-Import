import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AcumaticaAuthManager } from "@/lib/acumatica/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    instanceUrl: string;
    apiVersion?: string;
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

  const { instanceUrl, apiVersion, username, password, company, branch } = body;

  if (!instanceUrl?.trim() || !username?.trim() || !password?.trim()) {
    return NextResponse.json(
      { error: "Instance URL, username, and password are required" },
      { status: 400 }
    );
  }

  try {
    const authManager = new AcumaticaAuthManager(
      instanceUrl.trim(),
      apiVersion?.trim() || "24.200.001"
    );
    await authManager.login({
      username: username.trim(),
      password: password.trim(),
      company: company?.trim(),
      branch: branch?.trim(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection test failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
