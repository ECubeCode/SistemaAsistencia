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
      initialHoursSet: boolean;
    };
  }

  interface User {
    id: string;
    dni: string;
    nombre: string;
    apellido: string;
    role: Role;
    initialHoursSet: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    dni: string;
    nombre: string;
    apellido: string;
    role: Role;
    initialHoursSet: boolean;
  }
}
