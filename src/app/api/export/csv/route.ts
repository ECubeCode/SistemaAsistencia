import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";
import { classDayForDateStr } from "@/lib/schedule";
import { getCancelledDates } from "@/lib/hours";
import { buildCsv, csvHeaders } from "@/lib/csv";
import { logAudit } from "@/lib/audit";

/** "2026-09-08" -> "2026-09-08 21:10" usando el horario de inicio de esa clase. */
function fechaYHora(date: string): string {
  const classDay = classDayForDateStr(date);
  return classDay ? `${date} ${classDay.start}` : date;
}

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/**
 * Exporta el reporte de horas en CSV.
 *
 * - Alumno: solo su propio reporte.
 * - Profesor / admin: el de un alumno concreto (?studentId=) o el
 *   consolidado de todos (?scope=all).
 *
 * Las asistencias de clases anuladas no se exportan, porque no acreditan horas.
 */
export async function GET(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");
  const queryStudentId = searchParams.get("studentId");
  const isStaff = session!.user.role === "PROFESOR" || session!.user.role === "ADMIN";

  const cancelledDates = await getCancelledDates();

  // --- Consolidado de todos los alumnos (solo profesor/admin) ---
  if (scope === "all") {
    if (!isStaff) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const students = await prisma.user.findMany({
      where: { role: "ALUMNO" },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
      select: {
        dni: true,
        nombre: true,
        apellido: true,
        attendances: { orderBy: { date: "asc" }, select: { date: true, hours: true } },
      },
    });

    const rows: (string | number)[][] = [];
    for (const s of students) {
      for (const a of s.attendances) {
        if (cancelledDates.has(a.date)) continue;
        rows.push([`${s.apellido}, ${s.nombre}`, s.dni, fechaYHora(a.date), a.hours]);
      }
    }

    await logAudit({
      actorId: session!.user.id,
      action: "HOURS_EXPORTED",
      details: `Consolidado de todos los alumnos (${rows.length} registros)`,
    });

    const csv = buildCsv(["Alumno", "DNI", "Fecha y hora", "Horas"], rows);
    return new NextResponse(csv, { headers: csvHeaders("horas-todos-los-alumnos.csv") });
  }

  // --- Reporte individual ---
  let studentId = session!.user.id;
  if (queryStudentId && queryStudentId !== session!.user.id) {
    if (!isStaff) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    studentId = queryStudentId;
  }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      dni: true,
      nombre: true,
      apellido: true,
      attendances: { orderBy: { date: "asc" }, select: { date: true, hours: true } },
    },
  });
  if (!student) return NextResponse.json({ error: "Alumno no encontrado." }, { status: 404 });

  const rows = student.attendances
    .filter((a) => !cancelledDates.has(a.date))
    .map((a) => [fechaYHora(a.date), a.hours] as (string | number)[]);

  await logAudit({
    actorId: session!.user.id,
    action: "HOURS_EXPORTED",
    targetId: studentId,
    details: `${rows.length} registros`,
  });

  const csv = buildCsv(["Fecha y hora", "Horas"], rows);
  const filename = `horas-${slug(`${student.apellido} ${student.nombre}`)}-${student.dni}.csv`;
  return new NextResponse(csv, { headers: csvHeaders(filename) });
}
