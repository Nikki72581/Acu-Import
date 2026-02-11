import Papa from "papaparse";

export function parseCsv(
  text: string
): { headers: string[]; rows: Record<string, string>[] } {
  // Strip BOM if present
  const cleaned = text.replace(/^\uFEFF/, "");

  const result = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
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

  const headers = result.meta.fields ?? [];
  const rows = result.data.map((row) => {
    const stringRow: Record<string, string> = {};
    for (const key of headers) {
      stringRow[key] = row[key] ?? "";
    }
    return stringRow;
  });

  return { headers, rows };
}
