import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";
import { getAttendanceStatus, nowInSchoolTZ, type AttendanceStatus } from "@/lib/schedule";

export async function GET() {
  const { session, error } = await requireSession(["ALUMNO"]);
  if (error) return error;

  let status: AttendanceStatus = getAttendanceStatus();

  // Si la clase de hoy fue anulada, se informa como tal y no se habilita
  // el registro, sin importar el horario.
  if (status.state !== "NO_CLASS_TODAY") {
    const { dateStr } = nowInSchoolTZ();
    const cancelled = await prisma.cancelledClass.findUnique({ where: { date: dateStr } });
    if (cancelled) {
      status = {
        state: "CANCELLED",
        dayOfWeek: status.dayOfWeek,
        start: status.start,
        end: status.end,
        reason: cancelled.reason,
      };
    }
  }

  let alreadyRegistered = false;
  if (status.state === "OPEN") {
    const existing = await prisma.attendance.findUnique({
      where: { studentId_date: { studentId: session!.user.id, date: status.date } },
    });
    alreadyRegistered = !!existing;
  }

  return NextResponse.json({ status, alreadyRegistered });
}
