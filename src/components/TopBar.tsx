"use client";

import { useState } from "react";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
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
  const { data: session } = useSession();
  const [showChangePassword, setShowChangePassword] = useState(false);

  // El admin no tiene cambio de contraseña propio. Alumnos y profesores
  // solo pueden usarlo una única vez.
  const canChangePassword =
    session?.user.role !== "ADMIN" && session?.user.selfPasswordChangeUsed === false;

  return (
    <header className="sticky top-0 z-10 border-b border-primary-dark bg-primary text-white shadow">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Image
          src="/logo.png"
          alt="Logo del colegio"
          width={40}
          height={40}
          className="shrink-0 rounded-full bg-white"
        />

        {/* En mobile se muestra el nombre corto del colegio; el completo
            aparece recién cuando hay ancho suficiente. min-w-0 permite que
            el texto se recorte en vez de desbordar la barra. */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">
            <span className="sm:hidden">E.T. N°3 D.E. 9°</span>
            <span className="hidden sm:inline">E.T. N°3 D.E. 9° "María Sánchez de Thompson"</span>
          </p>
          <p className="truncate text-xs text-accent-light">
            <span className="sm:hidden">{nombre} {apellido} · {roleLabel}</span>
            <span className="hidden sm:inline">Asistencia · Prácticas Profesionalizantes</span>
          </p>
        </div>

        {/* Datos del usuario: en mobile van en la línea de arriba */}
        <div className="hidden min-w-0 text-right sm:block">
          <p className="truncate text-sm font-medium leading-tight">{nombre} {apellido}</p>
          <p className="text-xs text-accent-light">{roleLabel}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canChangePassword && (
            <button
              onClick={() => setShowChangePassword(true)}
              className="rounded-lg border border-white/40 px-3 py-1.5 text-sm font-medium transition hover:bg-white/10"
              title="Cambiar contraseña"
            >
              <span className="sm:hidden">🔑</span>
              <span className="hidden sm:inline">Cambiar contraseña</span>
            </button>
          )}
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
