import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getConnectionsByUser } from "@/lib/db/queries";

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
