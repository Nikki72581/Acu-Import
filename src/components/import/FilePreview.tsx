"use client";

import { FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFileSize } from "@/lib/utils/entity-utils";
import type { ParsedFile } from "@/types/import";

interface FilePreviewProps {
  parsedFile: ParsedFile;
  onSheetChange: (sheetName: string) => void;
}

const PREVIEW_ROWS = 5;

export function FilePreview({ parsedFile, onSheetChange }: FilePreviewProps) {
  const previewRows = parsedFile.rows.slice(0, PREVIEW_ROWS);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-sm font-medium">
                {parsedFile.fileName}
              </CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-normal">
                  {formatFileSize(parsedFile.fileSize)}
                </Badge>
                <Badge variant="secondary" className="text-xs font-normal">
                  {parsedFile.totalRows.toLocaleString()} rows
                </Badge>
                <Badge variant="secondary" className="text-xs font-normal">
                  {parsedFile.totalColumns} columns
                </Badge>
              </div>
            </div>
          </div>

          {/* Sheet selector for multi-sheet Excel files */}
          {parsedFile.sheetNames.length > 1 && (
            <Select
              value={parsedFile.selectedSheet}
              onValueChange={onSheetChange}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select sheet" />
              </SelectTrigger>
              <SelectContent>
                {parsedFile.sheetNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Preview (first {Math.min(PREVIEW_ROWS, parsedFile.totalRows)} of{" "}
          {parsedFile.totalRows.toLocaleString()} rows)
        </p>

        <div className="overflow-x-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 text-center text-xs font-medium text-muted-foreground">
                  #
                </TableHead>
                {parsedFile.headers.map((header) => (
                  <TableHead
                    key={header}
                    className="text-xs font-medium text-foreground whitespace-nowrap"
                  >
                    <span className="font-mono">{header}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {rowIndex + 1}
                  </TableCell>
                  {parsedFile.headers.map((header) => (
                    <TableCell
                      key={header}
                      className="max-w-[200px] truncate text-xs font-mono text-muted-foreground"
                    >
                      {row[header] || (
                        <span className="italic text-muted-foreground/40">
                          empty
                        </span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
