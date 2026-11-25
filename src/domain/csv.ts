const FORMULA_START = /^[=+\-@\t\r]/

/** Spreadsheets run cells that start like a formula, so those get a leading apostrophe. */
export function csvCell(value: string | number | boolean | null): string {
  let text = value === null ? '' : String(value)
  if (typeof value === 'string' && FORMULA_START.test(text)) text = `'${text}`
  return /[",;\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function toCsv(header: string[], rows: (string | number | boolean | null)[][]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
}
