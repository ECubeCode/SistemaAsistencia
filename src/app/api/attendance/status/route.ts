import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";
import { getAttendanceStatus } from "@/lib/schedule";

export async function GET() {
  const { session, error } = await requireSession(["ALUMNO"]);
  if (error) return error;

  const status = getAttendanceStatus();

  let alreadyRegistered = false;
  if (status.state === "OPEN") {
    const existing = await prisma.attendance.findUnique({
      where: { studentId_date: { studentId: session!.user.id, date: status.date } },
    });
    alreadyRegistered = !!existing;
  }

  return NextResponse.json({ status, alreadyRegistered });
}
