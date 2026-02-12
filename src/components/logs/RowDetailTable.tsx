"use client";

import { useState, useMemo, useCallback } from "react";
import { Download, Filter } from "lucide-react";
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

interface RowLog {
  id: string;
  rowNumber: number;
  keyValue: string;
  status: string;
  operation: string | null;
  errorMessage: string | null;
  errorCode: string | null;
  createdAt: string;
}

interface RowDetailTableProps {
  rows: RowLog[];
  sessionFileName: string;
}

export function RowDetailTable({ rows, sessionFileName }: RowDetailTableProps) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const handleExportCSV = useCallback(() => {
    if (rows.length === 0) return;

    const headers = [
      "Row Number",
      "Key",
      "Status",
      "Operation",
      "Error Message",
      "Error Code",
      "Timestamp",
    ];

    const csvRows = rows.map((r) =>
      [
        r.rowNumber,
        `"${r.keyValue.replace(/"/g, '""')}"`,
        r.status,
        r.operation || "",
        r.errorMessage ? `"${r.errorMessage.replace(/"/g, '""')}"` : "",
        r.errorCode || "",
        r.createdAt,
      ].join(",")
    );

    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-log-${sessionFileName.replace(/\.[^.]+$/, "")}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows, sessionFileName]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-foreground">
            Row Details ({filtered.length})
          </h2>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <Filter className="mr-1 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rows</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleExportCSV}
          disabled={rows.length === 0}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 py-8 text-center">
          <p className="text-sm text-muted-foreground">No rows to display.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px]">Row #</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead>Error</TableHead>
                <TableHead className="w-[140px]">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.rowNumber}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {row.keyValue}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === "success"
                          ? "default"
                          : row.status === "failed"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.operation || "-"}
                  </TableCell>
                  <TableCell>
                    {row.errorMessage ? (
                      <span className="text-xs text-destructive" title={row.errorMessage}>
                        {row.errorMessage.length > 120
                          ? row.errorMessage.slice(0, 117) + "..."
                          : row.errorMessage}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">
                    {new Date(row.createdAt).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
