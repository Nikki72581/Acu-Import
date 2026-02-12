export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle, Ban, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getImportSessionById, getRowLogsBySession, getConnectionById } from "@/lib/db/queries";
import { RowDetailTable } from "@/components/logs/RowDetailTable";
import { ENTITY_CONFIGS, IMPORT_MODES } from "@/types/entities";
import type { EntityType } from "@/types/entities";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "destructive", icon: AlertTriangle },
  cancelled: { label: "Cancelled", variant: "secondary", icon: Ban },
  running: { label: "Running", variant: "outline", icon: Clock },
};

function formatDuration(ms: number | null): string {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  const secs = ms / 1000;
  if (secs < 60) return `${secs.toFixed(1)}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = Math.round(secs % 60);
  return `${mins}m ${remSecs}s`;
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { sessionId } = await params;

  const session = await getImportSessionById(sessionId, userId);
  if (!session) notFound();

  const [rowLogs, connection] = await Promise.all([
    getRowLogsBySession(sessionId),
    getConnectionById(session.connectionId, userId),
  ]);

  const entityCfg = ENTITY_CONFIGS[session.entityType as EntityType];
  const modeCfg = IMPORT_MODES.find((m) => m.value === session.mode);
  const statusCfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.completed;
  const StatusIcon = statusCfg.icon;

  const serializedRows = rowLogs.map((r) => ({
    id: r.id,
    rowNumber: r.rowNumber,
    keyValue: r.keyValue,
    status: r.status,
    operation: r.operation,
    errorMessage: r.errorMessage,
    errorCode: r.errorCode,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-1.5 -ml-2">
        <Link href="/logs">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to History
        </Link>
      </Button>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">
            Import Session
          </h1>
          <Badge variant={statusCfg.variant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusCfg.label}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {session.fileName}
        </p>
      </div>

      {/* Summary card */}
      <Card className="mb-6">
        <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Entity
            </p>
            <p className="text-sm font-medium">
              {entityCfg?.entityLabel ?? session.entityType}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Mode
            </p>
            <p className="text-sm font-medium">
              {modeCfg?.label ?? session.mode}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Connection
            </p>
            <p className="text-sm font-medium">
              {connection?.name ?? "Unknown"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Duration
            </p>
            <p className="text-sm font-medium">
              {formatDuration(session.durationMs)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Total Rows
            </p>
            <p className="text-sm font-medium">{session.totalRows}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Succeeded
            </p>
            <p className="text-sm font-medium text-emerald-400">
              {session.successCount}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Failed
            </p>
            <p className="text-sm font-medium text-red-400">
              {session.failCount}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Created / Updated
            </p>
            <p className="text-sm font-medium">
              {session.createdCount} / {session.updatedCount}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Row detail table */}
      <RowDetailTable rows={serializedRows} sessionFileName={session.fileName} />
    </div>
  );
}
