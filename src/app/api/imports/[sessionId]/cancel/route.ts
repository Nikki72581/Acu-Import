import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getImportSessionById, updateImportSession } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const session = await getImportSessionById(sessionId, userId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "running") {
    return NextResponse.json(
      { error: "Session is not running" },
      { status: 400 }
    );
  }

  await updateImportSession(sessionId, {
    status: "cancelled",
    completedAt: new Date(),
    durationMs: Date.now() - session.startedAt.getTime(),
  });

  return NextResponse.json({ success: true });
}
