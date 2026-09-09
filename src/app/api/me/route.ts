import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";

export async function GET() {
  const { session, error } = await requireSession();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { id: true, dni: true, nombre: true, apellido: true, role: true, initialHours: true, initialHoursSet: true },
  });

  return NextResponse.json({ user });
}
