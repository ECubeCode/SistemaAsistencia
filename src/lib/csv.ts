/**
 * Generación de CSV para los reportes de horas.
 *
 * Se usa punto y coma como separador y BOM UTF-8 al inicio porque es lo que
 * Excel en español interpreta bien por defecto (con coma mete todo en una
 * sola columna y sin BOM rompe los acentos). Google Sheets abre ambos.
 */

const SEPARATOR = ";";
const BOM = "\uFEFF";

function escapeField(value: string | number): string {
  const s = String(value ?? "");
  if (s.includes(SEPARATOR) || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeField).join(SEPARATOR));
  return BOM + lines.join("\r\n") + "\r\n";
}

/** Cabeceras de respuesta para que el navegador descargue el archivo. */
export function csvHeaders(filename: string) {
  return {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  };
}
