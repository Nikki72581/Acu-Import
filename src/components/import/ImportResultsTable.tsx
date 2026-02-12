"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowUpCircle, PlusCircle } from "lucide-react";

export interface ImportRowResultItem {
  rowIndex: number;
  keyValue: string;
  success: boolean;
  operation?: string;
  error?: string;
}

interface ImportResultsTableProps {
  results: ImportRowResultItem[];
}

export function ImportResultsTable({ results }: ImportResultsTableProps) {
  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Waiting for results...
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-16">Row</TableHead>
            <TableHead>Key</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-28">Operation</TableHead>
            <TableHead>Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.rowIndex}>
              <TableCell className="text-xs text-muted-foreground">
                {result.rowIndex + 1}
              </TableCell>
              <TableCell className="text-xs font-medium">
                {result.keyValue}
              </TableCell>
              <TableCell>
                {result.success ? (
                  <Badge
                    variant="outline"
                    className="gap-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    OK
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1 bg-red-500/15 text-red-400 border-red-500/20"
                  >
                    <XCircle className="h-3 w-3" />
                    Failed
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {result.operation === "created" && (
                  <span className="flex items-center gap-1 text-xs text-blue-400">
                    <PlusCircle className="h-3 w-3" />
                    Created
                  </span>
                )}
                {result.operation === "updated" && (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <ArrowUpCircle className="h-3 w-3" />
                    Updated
                  </span>
                )}
              </TableCell>
              <TableCell className="max-w-[300px] truncate text-xs text-red-400">
                {result.error}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
