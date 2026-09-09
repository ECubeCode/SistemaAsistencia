"use client";

import { FormEvent, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      dni,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res || res.error) {
      setError("DNI o contraseña incorrectos.");
      return;
    }

    const session = await getSession();
    const role = session?.user?.role;
    if (role === "ALUMNO") router.push("/alumno");
    else if (role === "PROFESOR") router.push("/profesor");
    else if (role === "ADMIN") router.push("/admin");
    else router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary to-primary-dark px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="Logo del colegio" width={90} height={90} className="mb-3" />
          <h1 className="text-lg font-bold text-primary">E.T. N°3 D.E. 9° "María Sánchez de Thompson"</h1>
          <p className="mt-1 text-sm text-slate-500">Asistencia · Prácticas Profesionalizantes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="dni">DNI</label>
            <input
              id="dni"
              className="input"
              inputMode="numeric"
              autoComplete="username"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-accent w-full">
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          ¿No tenés usuario o olvidaste tu contraseña? Consultá con la administración del sistema.
        </p>
      </div>
    </div>
  );
}
