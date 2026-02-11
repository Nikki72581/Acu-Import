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

  const headers = Object.keys(rawData[0]);

  // Convert all values to strings
  const rows = rawData.map((row) => {
    const stringRow: Record<string, string> = {};
    for (const key of headers) {
      const val = row[key];
      stringRow[key] = val === null || val === undefined ? "" : String(val);
    }
    return stringRow;
  });

  return { headers, rows, selectedSheet: selected, sheetNames };
}
