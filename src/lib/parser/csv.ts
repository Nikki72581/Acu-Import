import Papa from "papaparse";

/**
 * Deduplicate headers by appending (2), (3), etc. to duplicates.
 */
function deduplicateHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((h) => {
    const key = h.toLowerCase();
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    if (count === 0) return h;
    return `${h} (${count + 1})`;
  });
}

/**
 * Sanitize a header name — remove control characters, collapse whitespace.
 */
function sanitizeHeader(header: string): string {
  return header
    .replace(/[\x00-\x1F\x7F]/g, "") // strip control chars
    .replace(/\s+/g, " ")             // collapse whitespace
    .trim();
}

export function parseCsv(
  text: string
): { headers: string[]; rows: Record<string, string>[] } {
  // Strip BOM if present
  const cleaned = text.replace(/^\uFEFF/, "");

  const result = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => sanitizeHeader(header),
  });

  if (result.errors.length > 0) {
    const criticalErrors = result.errors.filter(
      (e) => e.type !== "FieldMismatch"
    );
    if (criticalErrors.length > 0) {
      throw new Error(
        `CSV parse error: ${criticalErrors[0].message} (row ${criticalErrors[0].row})`
      );
    }
  }

  let headers = result.meta.fields ?? [];

  // Deduplicate headers
  headers = deduplicateHeaders(headers);

  // Rebuild rows with deduplicated headers
  const originalHeaders = result.meta.fields ?? [];
  const rows = result.data.map((row) => {
    const stringRow: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      const originalKey = originalHeaders[i];
      stringRow[headers[i]] = row[originalKey] ?? "";
    }
    return stringRow;
  });

  return { headers, rows };
}
