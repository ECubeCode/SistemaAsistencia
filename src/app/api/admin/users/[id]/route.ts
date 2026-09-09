import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireSession(["ADMIN"]);
  if (error) return error;

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  const detailsParts: string[] = [];

  if (body?.initialHours !== undefined) {
    const hours = Number(body.initialHours);
    if (!Number.isInteger(hours) || hours < 0 || hours > 5000) {
      return NextResponse.json({ error: "Horas iniciales inválidas." }, { status: 400 });
    }
    data.initialHours = hours;
    data.initialHoursSet = true;
    detailsParts.push(`horas iniciales -> ${hours}`);
  }

  if (body?.active !== undefined) {
    data.active = Boolean(body.active);
    detailsParts.push(`activo -> ${data.active}`);
  }

  if (body?.newPassword) {
    if (target.role !== "ALUMNO") {
      return NextResponse.json(
        { error: "El admin no puede restablecer la contraseña de un profesor ni de otro administrador." },
        { status: 403 }
      );
    }
    const newPassword = String(body.newPassword);
    if (newPassword.length < 4) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 4 caracteres." }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(newPassword, 10);
    // Restablecer la contraseña le da al alumno una nueva oportunidad de
    // personalizarla una vez a través del cambio de contraseña propio.
    data.selfPasswordChangeUsed = false;
    detailsParts.push("contraseña restablecida");
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar." }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id: target.id }, data });

  await logAudit({
    actorId: session!.user.id,
    action: body?.initialHours !== undefined ? "INITIAL_HOURS_UPDATED_BY_ADMIN" : "USER_UPDATED",
    targetId: target.id,
    details: detailsParts.join(", "),
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      initialHours: updated.initialHours,
      active: updated.active,
    },
  });
}
