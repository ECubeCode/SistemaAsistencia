import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";

// Alumnos y profesores pueden cambiar su propia contraseña, pero solo una
// vez. El admin no tiene esta opción ni siquiera para su propia cuenta.
export async function POST(req: Request) {
  const { session, error } = await requireSession(["ALUMNO", "PROFESOR"]);
  if (error) return error;

  const body = await req.json().catch(() => null);
  const currentPassword = String(body?.currentPassword ?? "");
  const newPassword = String(body?.newPassword ?? "");

  if (newPassword.length < 4) {
    return NextResponse.json({ error: "La nueva contraseña debe tener al menos 4 caracteres." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });

  if (user.selfPasswordChangeUsed) {
    return NextResponse.json(
      { error: "Ya usaste tu única oportunidad de cambiar la contraseña. Consultá con la administración." },
      { status: 403 }
    );
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "La contraseña actual es incorrecta." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, selfPasswordChangeUsed: true },
  });

  await logAudit({
    actorId: user.id,
    action: "PASSWORD_CHANGED_BY_USER",
    targetId: user.id,
  });

  return NextResponse.json({ ok: true });
}
