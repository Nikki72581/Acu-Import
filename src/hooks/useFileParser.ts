"use client";

import { useState, useCallback } from "react";
import type { ParsedFile } from "@/types/import";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ROWS = 10_000;

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

interface UseFileParserReturn {
  parsedFile: ParsedFile | null;
  isLoading: boolean;
  error: string | null;
  parseFile: (file: File) => Promise<void>;
  selectSheet: (sheetName: string) => Promise<void>;
  reset: () => void;
}

// Keep raw buffer in module scope so we can re-parse on sheet change
let currentBuffer: ArrayBuffer | null = null;

export function useFileParser(): UseFileParserReturn {
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(async (file: File) => {
    setError(null);
    setIsLoading(true);
    setParsedFile(null);

    try {
      // Validate file extension
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        throw new Error(
          `Invalid file type "${ext}". Accepted formats: CSV, XLSX, XLS.`
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 10MB limit.`
        );
      }

      // Validate non-empty
      if (file.size === 0) {
        throw new Error("File is empty. Please upload a file with data.");
      }

      if (ext === ".csv") {
        const text = await file.text();
        const { parseCsv } = await import("@/lib/parser/csv");
        const { headers, rows } = parseCsv(text);

        if (headers.length === 0) {
          throw new Error("No columns found. Check that the file has a header row.");
        }

        if (rows.length === 0) {
          throw new Error("File has headers but no data rows.");
        }

        if (rows.length > MAX_ROWS) {
          throw new Error(
            `File has ${rows.length.toLocaleString()} rows, which exceeds the ${MAX_ROWS.toLocaleString()} row limit.`
          );
        }

        currentBuffer = null;
        setParsedFile({
          fileName: file.name,
          fileSize: file.size,
          sheetNames: [],
          selectedSheet: "",
          headers,
          rows,
          totalRows: rows.length,
          totalColumns: headers.length,
        });
      } else {
        // XLSX or XLS
        const buffer = await file.arrayBuffer();
        currentBuffer = buffer;

        const { parseXlsx } = await import("@/lib/parser/xlsx");
        const { headers, rows, selectedSheet, sheetNames } =
          await parseXlsx(buffer);

        if (headers.length === 0) {
          throw new Error("No columns found. Check that the sheet has a header row.");
        }

        if (rows.length === 0) {
          throw new Error("Sheet has headers but no data rows.");
        }

        if (rows.length > MAX_ROWS) {
          throw new Error(
            `Sheet has ${rows.length.toLocaleString()} rows, which exceeds the ${MAX_ROWS.toLocaleString()} row limit.`
          );
        }

        setParsedFile({
          fileName: file.name,
          fileSize: file.size,
          sheetNames,
          selectedSheet,
          headers,
          rows,
          totalRows: rows.length,
          totalColumns: headers.length,
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to parse file";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectSheet = useCallback(async (sheetName: string) => {
    if (!currentBuffer) return;

    setIsLoading(true);
    setError(null);

    try {
      const { parseXlsx } = await import("@/lib/parser/xlsx");
      const { headers, rows, selectedSheet, sheetNames } =
        await parseXlsx(currentBuffer, sheetName);

      if (headers.length === 0) {
        throw new Error("No columns found. Check that the sheet has a header row.");
      }

      if (rows.length === 0) {
        throw new Error("Sheet has headers but no data rows.");
      }

      if (rows.length > MAX_ROWS) {
        throw new Error(
          `Sheet has ${rows.length.toLocaleString()} rows, which exceeds the ${MAX_ROWS.toLocaleString()} row limit.`
        );
      }

      setParsedFile((prev) =>
        prev
          ? {
              ...prev,
              headers,
              rows,
              selectedSheet,
              sheetNames,
              totalRows: rows.length,
              totalColumns: headers.length,
            }
          : null
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to parse sheet";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setParsedFile(null);
    setError(null);
    setIsLoading(false);
    currentBuffer = null;
  }, []);

  return { parsedFile, isLoading, error, parseFile, selectSheet, reset };
}
