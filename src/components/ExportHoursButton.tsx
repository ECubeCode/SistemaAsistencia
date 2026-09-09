"use client";

/**
 * Descarga el reporte de horas en CSV. Es un enlace directo al endpoint:
 * el servidor manda Content-Disposition y el navegador guarda el archivo.
 *
 * - Sin props: el reporte propio (alumno).
 * - studentId: el reporte de ese alumno (profesor/admin).
 * - scope="all": el consolidado de todos los alumnos (profesor/admin).
 */
export default function ExportHoursButton({
  label,
  studentId,
  scope,
  variant = "accent",
}: {
  label: string;
  studentId?: string;
  scope?: "all";
  variant?: "accent" | "outline";
}) {
  const params = new URLSearchParams();
  if (scope) params.set("scope", scope);
  if (studentId) params.set("studentId", studentId);
  const query = params.toString();
  const href = `/api/export/csv${query ? `?${query}` : ""}`;

  return (
    <a href={href} className={variant === "outline" ? "btn-outline" : "btn-accent"} download>
      {label}
    </a>
  );
}
