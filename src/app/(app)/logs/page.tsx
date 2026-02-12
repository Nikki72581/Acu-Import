import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getImportSessionsWithConnection } from "@/lib/db/queries";
import { SessionList } from "@/components/logs/SessionList";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const sessions = await getImportSessionsWithConnection(userId);

  const serialized = sessions.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    startedAt: s.startedAt?.toISOString() ?? null,
    completedAt: s.completedAt?.toISOString() ?? null,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Import History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage past import sessions
        </p>
      </div>
      <SessionList sessions={serialized} />
    </div>
  );
}
