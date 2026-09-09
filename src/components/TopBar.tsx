"use client";

import { useState } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function TopBar({
  nombre,
  apellido,
  roleLabel,
}: {
  nombre: string;
  apellido: string;
  roleLabel: string;
}) {
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <header className="sticky top-0 z-10 border-b border-primary-dark bg-primary text-white shadow">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="rounded-full bg-white" />
          <div>
            <p className="text-sm font-semibold leading-tight">E.T. N°3 D.E. 9° "María Sánchez de Thompson"</p>
            <p className="text-xs text-accent-light">Asistencia · Prácticas Profesionalizantes</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium leading-tight">{nombre} {apellido}</p>
            <p className="text-xs text-accent-light">{roleLabel}</p>
          </div>
          <button
            onClick={() => setShowChangePassword(true)}
            className="rounded-lg border border-white/40 px-3 py-1.5 text-sm font-medium transition hover:bg-white/10"
          >
            Cambiar contraseña
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg border border-white/40 px-3 py-1.5 text-sm font-medium transition hover:bg-white/10"
          >
            Salir
          </button>
        </div>
      </div>

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </header>
  );
}
