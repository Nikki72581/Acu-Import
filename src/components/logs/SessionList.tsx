"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Loader2,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ENTITY_CONFIGS, IMPORT_MODES } from "@/types/entities";
import type { EntityType, ImportMode } from "@/types/entities";

interface SessionRow {
  id: string;
  entityType: string;
  mode: string;
  fileName: string;
  totalRows: number;
  successCount: number;
  failCount: number;
  status: string;
  durationMs: number | null;
  createdAt: string;
  connectionName: string | null;
}

interface SessionListProps {
  sessions: SessionRow[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }
> = {
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SessionList({ sessions }: SessionListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (entityFilter !== "all" && s.entityType !== entityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !s.fileName.toLowerCase().includes(q) &&
          !s.connectionName?.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [sessions, search, statusFilter, entityFilter]);

  const handleCancel = useCallback(async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCancellingId(sessionId);
    try {
      await fetch(`/api/imports/${sessionId}/cancel`, { method: "POST" });
      router.refresh();
    } finally {
      setCancellingId(null);
    }
  }, [router]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="running">Running</SelectItem>
          </SelectContent>
        </Select>

        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="StockItem">Stock Items</SelectItem>
            <SelectItem value="Customer">Customers</SelectItem>
            <SelectItem value="Vendor">Vendors</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {sessions.length === 0
              ? "No import sessions yet."
              : "No sessions match your filters."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Rows</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((session) => {
                const statusCfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.completed;
                const StatusIcon = statusCfg.icon;
                const entityCfg = ENTITY_CONFIGS[session.entityType as EntityType];
                const modeCfg = IMPORT_MODES.find((m) => m.value === session.mode);

                return (
                  <TableRow
                    key={session.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/logs/${session.id}`)}
                  >
                    <TableCell>
                      <Badge variant={statusCfg.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {statusCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {entityCfg?.entityLabel ?? session.entityType}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {modeCfg?.label ?? session.mode}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-sm" title={session.fileName}>
                        {session.fileName}
                      </div>
                      {session.connectionName && (
                        <div className="text-[10px] text-muted-foreground/60 truncate">
                          {session.connectionName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <span className="text-emerald-400">{session.successCount}</span>
                      {session.failCount > 0 && (
                        <>
                          {" / "}
                          <span className="text-red-400">{session.failCount}</span>
                        </>
                      )}
                      <span className="text-muted-foreground/60 ml-1">
                        / {session.totalRows}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDuration(session.durationMs)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(session.createdAt)}
                    </TableCell>
                    <TableCell>
                      {session.status === "running" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={cancellingId === session.id}
                          onClick={(e) => handleCancel(session.id, e)}
                          title="Cancel import"
                        >
                          {cancellingId === session.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
