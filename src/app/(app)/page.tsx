export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Plus, Clock, CheckCircle2, AlertTriangle, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRecentImportSessions } from "@/lib/db/queries";
import { ENTITY_CONFIGS } from "@/types/entities";
import type { EntityType } from "@/types/entities";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }
> = {
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "destructive", icon: AlertTriangle },
  cancelled: { label: "Cancelled", variant: "secondary", icon: Ban },
  running: { label: "Running", variant: "outline", icon: Clock },
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const recentSessions = await getRecentImportSessions(userId, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome to the Acumatica Import Wizard
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/import">
          <Card className="group cursor-pointer border-border bg-card transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-medium text-foreground">Start New Import</h2>
                <p className="text-sm text-muted-foreground">
                  Import stock items, customers, or vendors
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/logs">
          <Card className="group cursor-pointer border-border bg-card transition-colors hover:border-primary/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-accent">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-medium text-foreground">Import History</h2>
                <p className="text-sm text-muted-foreground">
                  View past imports and audit logs
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent imports */}
      <div className="mt-10">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">
          Recent Imports
        </h2>

        {recentSessions.length === 0 ? (
          <Card className="border-dashed border-border bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No imports yet. Start your first import to see history here.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/import">Start Import</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session) => {
              const entityCfg = ENTITY_CONFIGS[session.entityType as EntityType];
              const statusCfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.completed;
              const StatusIcon = statusCfg.icon;

              return (
                <Link key={session.id} href={`/logs/${session.id}`}>
                  <Card className="border-border bg-card transition-colors hover:border-primary/30">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge variant={statusCfg.variant} className="gap-1 shrink-0">
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </Badge>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {entityCfg?.entityLabel ?? session.entityType}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {session.fileName}
                            {session.connectionName && (
                              <span className="text-muted-foreground/50">
                                {" "}&middot; {session.connectionName}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm">
                          <span className="text-emerald-400">{session.successCount}</span>
                          {session.failCount > 0 && (
                            <>
                              {" / "}
                              <span className="text-red-400">{session.failCount}</span>
                            </>
                          )}
                          <span className="text-muted-foreground/60"> / {session.totalRows}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(session.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}

            <div className="pt-2 text-center">
              <Button asChild variant="ghost" size="sm">
                <Link href="/logs">View All Imports</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
