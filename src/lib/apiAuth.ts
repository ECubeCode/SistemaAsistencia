import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { Role } from "@/lib/roles";

export async function requireSession(roles?: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  if (roles && !roles.includes(session.user.role)) {
    return { session: null, error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }
  return { session, error: null };
}
