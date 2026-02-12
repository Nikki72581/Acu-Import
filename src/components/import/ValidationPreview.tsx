"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ValidationStatusBadge } from "./ValidationStatusBadge";
import { ValidationErrorDetail } from "./ValidationErrorDetail";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  XCircle,
} from "lucide-react";
import type { RowValidationResult } from "@/lib/validation/engine";
import type { FieldMapping } from "@/types/mapping";

interface ValidationPreviewProps {
  results: RowValidationResult[];
  rows: Record<string, string>[];
  mappings: FieldMapping[];
  keyField: string;
  excludedRows: Set<number>;
  onExcludeRow: (rowIndex: number, excluded: boolean) => void;
  onExcludeAllFailures: () => void;
  onEditCell: (rowIndex: number, column: string, value: string) => void;
}

type StatusFilter = "all" | "pass" | "warn" | "fail";

export function ValidationPreview({
  results,
  rows,
  mappings,
  keyField,
  excludedRows,
  onExcludeRow,
  onExcludeAllFailures,
  onEditCell,
}: ValidationPreviewProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");

  // Mapped columns (non-ignored, with targets)
  const mappedColumns = useMemo(
    () => mappings.filter((m) => m.targetField && !m.ignored),
    [mappings]
  );

  // Find the source column mapped to keyField
  const keySourceColumn = useMemo(
    () => mappings.find((m) => m.targetField === keyField)?.sourceColumn,
    [mappings, keyField]
  );

  // Filter results by status
  const filteredResults = useMemo(() => {
    if (statusFilter === "all") return results;
    return results.filter((r) => r.status === statusFilter);
  }, [results, statusFilter]);

  const summary = useMemo(
    () => ({
      pass: results.filter((r) => r.status === "pass").length,
      warn: results.filter((r) => r.status === "warn").length,
      fail: results.filter((r) => r.status === "fail").length,
    }),
    [results]
  );

  const toggleExpanded = (rowIndex: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  };

  const startEditing = (rowIndex: number, column: string, currentValue: string) => {
    setEditingCell({ row: rowIndex, col: column });
    setEditValue(currentValue);
  };

  const commitEdit = () => {
    if (editingCell) {
      onEditCell(editingCell.row, editingCell.col, editValue);
      setEditingCell(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-400">
            {summary.pass} pass
          </Badge>
          <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-400">
            {summary.warn} warnings
          </Badge>
          <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-400">
            {summary.fail} failures
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            <Filter className="ml-1.5 h-3 w-3 text-muted-foreground" />
            {(["all", "pass", "warn", "fail"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                  statusFilter === f
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {summary.fail > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={onExcludeAllFailures}
            >
              <XCircle className="h-3 w-3" />
              Exclude All Failures
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="h-[500px] rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10" />
              <TableHead className="w-10">#</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-12">Skip</TableHead>
              {mappedColumns.map((m) => (
                <TableHead key={m.sourceColumn} className="min-w-[120px]">
                  {m.targetField}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.map((result) => {
              const row = rows[result.rowIndex];
              const isExcluded = excludedRows.has(result.rowIndex);
              const isExpanded = expandedRows.has(result.rowIndex);
              const hasDetails = result.errors.length > 0 || result.warnings.length > 0;

              return (
                <TableRow
                  key={result.rowIndex}
                  className={isExcluded ? "opacity-40" : undefined}
                >
                  <TableCell className="p-1">
                    {hasDetails && (
                      <button
                        onClick={() => toggleExpanded(result.rowIndex)}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {result.rowIndex + 1}
                  </TableCell>
                  <TableCell>
                    <ValidationStatusBadge status={result.status} />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={isExcluded}
                      onCheckedChange={(checked) =>
                        onExcludeRow(result.rowIndex, checked === true)
                      }
                    />
                  </TableCell>
                  {mappedColumns.map((m) => {
                    const cellValue = row?.[m.sourceColumn] ?? "";
                    const isEditing =
                      editingCell?.row === result.rowIndex &&
                      editingCell?.col === m.sourceColumn;
                    const isKey = m.targetField === keyField;

                    // Check if this cell has an error
                    const hasError = result.errors.some(
                      (e) => e.field === m.targetField
                    );
                    const hasWarning = result.warnings.some(
                      (w) => w.field === m.targetField
                    );

                    return (
                      <TableCell
                        key={m.sourceColumn}
                        className={`text-xs ${
                          hasError
                            ? "text-red-400"
                            : hasWarning
                              ? "text-amber-400"
                              : ""
                        } ${isKey ? "font-medium" : ""}`}
                      >
                        {isEditing ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEdit();
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                            className="h-6 text-xs"
                            autoFocus
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:underline"
                            onDoubleClick={() =>
                              startEditing(
                                result.rowIndex,
                                m.sourceColumn,
                                cellValue
                              )
                            }
                            title="Double-click to edit"
                          >
                            {cellValue || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
            {/* Expanded detail rows rendered inline */}
            {filteredResults
              .filter(
                (r) =>
                  expandedRows.has(r.rowIndex) &&
                  (r.errors.length > 0 || r.warnings.length > 0)
              )
              .map(() => null)}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Detail panels for expanded rows */}
      {filteredResults
        .filter((r) => expandedRows.has(r.rowIndex))
        .map((result) => (
          <div
            key={`detail-${result.rowIndex}`}
            className="rounded-md border border-border bg-muted/30 px-4 py-2"
          >
            <div className="mb-1 text-xs font-medium text-muted-foreground">
              Row {result.rowIndex + 1} —{" "}
              {keySourceColumn && rows[result.rowIndex]?.[keySourceColumn]}
            </div>
            <ValidationErrorDetail
              errors={result.errors}
              warnings={result.warnings}
            />
          </div>
        ))}
    </div>
  );
}
