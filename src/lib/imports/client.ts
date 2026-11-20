import Papa from "papaparse";
import ExcelJS from "exceljs";

export interface ParsedFile {
  columns: string[];
  rows: Array<Record<string, string>>;
}

export async function parseImportFile(file: File): Promise<ParsedFile> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    return parseCsv(file);
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return parseXlsx(file);
  }
  throw new Error("Unsupported file type. Upload a CSV or XLSX file.");
}

async function parseCsv(file: File): Promise<ParsedFile> {
  const text = await file.text();
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
  });
  const columns = (result.meta.fields ?? []).filter(Boolean);
  return { columns, rows: result.data };
}

async function parseXlsx(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return { columns: [], rows: [] };

  const headerRow = worksheet.getRow(1) as unknown as { values: unknown[] };
  const columns = headerRow.values
    .slice(1)
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  const rows: Array<Record<string, string>> = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, string> = {};
    columns.forEach((column, index) => {
      const cell = (row as unknown as {
        getCell: (i: number) => { value?: unknown };
      }).getCell(index + 1);
      const value = cell?.value;
      record[column] = value == null ? "" : String(value).trim();
    });
    rows.push(record);
  });

  return { columns, rows };
}
