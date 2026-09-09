import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { Role } from "@/lib/roles";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        dni: { label: "DNI", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const dni = credentials?.dni?.trim();
        const password = credentials?.password ?? "";
        if (!dni || !password) return null;

        const user = await prisma.user.findUnique({ where: { dni } });
        if (!user || !user.active) {
          await logAudit({ action: "LOGIN_FAILED", details: `DNI ${dni}` });
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await logAudit({ actorId: user.id, action: "LOGIN_FAILED" });
          return null;
        }

        await logAudit({ actorId: user.id, action: "LOGIN" });

        return {
          id: user.id,
          dni: user.dni,
          nombre: user.nombre,
          apellido: user.apellido,
          role: user.role as Role,
          initialHoursSet: user.initialHoursSet,
          selfPasswordChangeUsed: user.selfPasswordChangeUsed,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = (user as any).id;
        token.dni = (user as any).dni;
        token.nombre = (user as any).nombre;
        token.apellido = (user as any).apellido;
        token.role = (user as any).role;
        token.initialHoursSet = (user as any).initialHoursSet;
        token.selfPasswordChangeUsed = (user as any).selfPasswordChangeUsed;
      }
      if (trigger === "update") {
        // Refresca los flags (horas iniciales / cambio de contraseña) tras completarse la accion.
        const fresh = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (fresh) {
          token.initialHoursSet = fresh.initialHoursSet;
          token.selfPasswordChangeUsed = fresh.selfPasswordChangeUsed;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).dni = token.dni;
        (session.user as any).nombre = token.nombre;
        (session.user as any).apellido = token.apellido;
        (session.user as any).role = token.role;
        (session.user as any).initialHoursSet = token.initialHoursSet;
        (session.user as any).selfPasswordChangeUsed = token.selfPasswordChangeUsed;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
