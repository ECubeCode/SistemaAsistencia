import { Role } from "@/lib/roles";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      dni: string;
      nombre: string;
      apellido: string;
      role: Role;
      selfPasswordChangeUsed: boolean;
    };
  }

  interface User {
    id: string;
    dni: string;
    nombre: string;
    apellido: string;
    role: Role;
    selfPasswordChangeUsed: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    dni: string;
    nombre: string;
    apellido: string;
    role: Role;
    selfPasswordChangeUsed: boolean;
  }
}
