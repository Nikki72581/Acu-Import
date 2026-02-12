import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getConnectionsByUser } from "@/lib/db/queries";
import { ConnectionList } from "@/components/settings/ConnectionList";

export const dynamic = "force-dynamic";

export default async function ConnectionsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const connections = await getConnectionsByUser(userId);

  // Strip credentials before passing to client
  const safe = connections.map(({ credentials: _, ...rest }) => ({
    ...rest,
    createdAt: rest.createdAt.toISOString(),
    updatedAt: rest.updatedAt.toISOString(),
  }));

  return <ConnectionList initialConnections={safe} />;
}
