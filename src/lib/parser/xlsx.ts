import type { WorkBook } from "xlsx";

let xlsxModule: typeof import("xlsx") | null = null;

async function getXlsx() {
  if (!xlsxModule) {
    xlsxModule = await import("xlsx");
  }
  return xlsxModule;
}

export async function getSheetNames(buffer: ArrayBuffer): Promise<string[]> {
  const XLSX = await getXlsx();
  const workbook = XLSX.read(buffer, { type: "array" });
  return workbook.SheetNames;
}

export async function parseXlsx(
  buffer: ArrayBuffer,
  sheetName?: string
): Promise<{ headers: string[]; rows: Record<string, string>[]; selectedSheet: string; sheetNames: string[] }> {
  const XLSX = await getXlsx();
  const workbook: WorkBook = XLSX.read(buffer, { type: "array" });

  const sheetNames = workbook.SheetNames;
  const selected = sheetName && sheetNames.includes(sheetName)
    ? sheetName
    : sheetNames[0];

  const sheet = workbook.Sheets[selected];
  if (!sheet) {
    throw new Error(`Sheet "${selected}" not found`);
  }

  // Convert to JSON with header row
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (rawData.length === 0) {
    return { headers: [], rows: [], selectedSheet: selected, sheetNames };
  }

  const rawHeaders = Object.keys(rawData[0]);

  // Sanitize headers — strip control chars, collapse whitespace
  const sanitized = rawHeaders.map((h) =>
    h.replace(/[\x00-\x1F\x7F]/g, "").replace(/\s+/g, " ").trim()
  );

  // Deduplicate headers
  const seen = new Map<string, number>();
  const headers = sanitized.map((h) => {
    const key = h.toLowerCase();
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    if (count === 0) return h;
    return `${h} (${count + 1})`;
  });

  // Convert all values to strings using deduplicated headers
  const rows = rawData.map((row) => {
    const stringRow: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      const val = row[rawHeaders[i]];
      stringRow[headers[i]] = val === null || val === undefined ? "" : String(val);
    }
    return stringRow;
  });

  return { headers, rows, selectedSheet: selected, sheetNames };
}
