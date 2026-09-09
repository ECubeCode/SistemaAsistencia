import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";

export async function GET(req: Request) {
  const { error } = await requireSession(["ADMIN"]);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const take = Math.min(Number(searchParams.get("take") ?? 200), 500);

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      actor: { select: { nombre: true, apellido: true, dni: true, role: true } },
      target: { select: { nombre: true, apellido: true, dni: true, role: true } },
    },
  });

  return NextResponse.json({ logs });
}
