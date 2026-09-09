import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";

// El alumno carga (una unica vez) las horas que ya tenia acumuladas antes
// de que existiera el sistema. Despues de esto solo el admin puede tocarlo.
export async function POST(req: Request) {
  const { session, error } = await requireSession(["ALUMNO"]);
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (user.initialHoursSet) {
    return NextResponse.json({ error: "Las horas iniciales ya fueron cargadas." }, { status: 409 });
  }

  const body = await req.json().catch(() => null);
  const hours = Number(body?.hours);
  if (!Number.isInteger(hours) || hours < 0 || hours > 5000) {
    return NextResponse.json({ error: "Ingresá un número de horas válido." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { initialHours: hours, initialHoursSet: true },
  });

  await logAudit({
    actorId: user.id,
    action: "INITIAL_HOURS_SET_BY_STUDENT",
    targetId: user.id,
    details: `${hours}hs`,
  });

  return NextResponse.json({ ok: true });
}
