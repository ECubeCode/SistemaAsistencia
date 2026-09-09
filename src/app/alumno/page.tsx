"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import TopBar from "@/components/TopBar";
import type { AttendanceStatus } from "@/lib/schedule";

type Attendance = {
  id: string;
  date: string;
  dayOfWeek: string;
  hours: number;
  source: string;
};

export default function AlumnoPage() {
  const { data: session, update } = useSession();
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [initialHours, setInitialHours] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showInitialHoursForm, setShowInitialHoursForm] = useState(false);
  const [initialHoursInput, setInitialHoursInput] = useState("0");

  const load = useCallback(async () => {
    const [statusRes, attRes, meRes] = await Promise.all([
      fetch("/api/attendance/status").then((r) => r.json()),
      fetch("/api/attendance").then((r) => r.json()),
      fetch("/api/me").then((r) => r.json()),
    ]);
    setStatus(statusRes.status);
    setAlreadyRegistered(statusRes.alreadyRegistered);
    setAttendances(attRes.attendances ?? []);
    setInitialHours(meRes.user?.initialHours ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (session && session.user.initialHoursSet === false) {
      setShowInitialHoursForm(true);
    }
  }, [session]);

  async function handleRegister() {
    setRegistering(true);
    setMessage(null);
    const res = await fetch("/api/attendance", { method: "POST" });
    const data = await res.json();
    setRegistering(false);
    if (!res.ok) {
      setMessage(data.error ?? "No se pudo registrar la asistencia.");
      return;
    }
    setMessage("¡Asistencia registrada correctamente!");
    await load();
  }

  async function handleInitialHoursSubmit() {
    const hours = Number(initialHoursInput);
    const res = await fetch("/api/initial-hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "No se pudo guardar.");
      return;
    }
    setShowInitialHoursForm(false);
    await update();
    await load();
  }

  const totalFromAttendances = attendances.reduce((sum, a) => sum + a.hours, 0);
  const total = initialHours + totalFromAttendances;

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar nombre={session.user.nombre} apellido={session.user.apellido} roleLabel="Alumno" />

      {showInitialHoursForm && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-bold text-primary">Carga de horas previas</h2>
            <p className="mb-4 text-sm text-slate-600">
              Antes de que existiera este sistema, es posible que ya hayas cumplido horas de
              Prácticas Profesionalizantes. Indicá cuántas horas ya tenías acumuladas (si no
              tenías ninguna, dejá 0). Esto se carga una única vez y después no vas a poder
              modificarlo por tu cuenta, así que revisá bien el número antes de guardar.
            </p>
            <label className="label" htmlFor="initialHours">Horas previas acumuladas</label>
            <input
              id="initialHours"
              type="number"
              min={0}
              className="input mb-4"
              value={initialHoursInput}
              onChange={(e) => setInitialHoursInput(e.target.value)}
            />
            <button className="btn-primary w-full" onClick={handleInitialHoursSubmit}>
              Guardar y continuar
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <section className="card">
          <h2 className="mb-4 text-lg font-bold text-primary">Asistencia de hoy</h2>
          {loading || !status ? (
            <p className="text-slate-500">Cargando...</p>
          ) : (
            <AttendanceCard
              status={status}
              alreadyRegistered={alreadyRegistered}
              onRegister={handleRegister}
              registering={registering}
            />
          )}
          {message && <p className="mt-3 text-sm font-medium text-primary">{message}</p>}
        </section>

        <section className="card">
          <h2 className="mb-1 text-lg font-bold text-primary">Total de horas acumuladas</h2>
          <p className="text-4xl font-extrabold text-accent">{total}hs</p>
          <p className="mt-1 text-sm text-slate-500">
            {initialHours > 0 && `${initialHours}hs previas + `}
            {totalFromAttendances}hs registradas en el sistema ({attendances.length} asistencias)
          </p>
        </section>

        <section className="card">
          <h2 className="mb-4 text-lg font-bold text-primary">Historial de asistencias</h2>
          {attendances.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no registraste ninguna asistencia.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Día</th>
                    <th>Horas</th>
                    <th>Origen</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((a) => (
                    <tr key={a.id}>
                      <td>{a.date}</td>
                      <td>{a.dayOfWeek}</td>
                      <td>{a.hours}hs</td>
                      <td>{a.source === "ADMIN" ? "Carga manual" : "Autoregistrado"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function AttendanceCard({
  status,
  alreadyRegistered,
  onRegister,
  registering,
}: {
  status: AttendanceStatus;
  alreadyRegistered: boolean;
  onRegister: () => void;
  registering: boolean;
}) {
  if (status.state === "NO_CLASS_TODAY") {
    return <p className="text-slate-600">Hoy no hay clase de Prácticas Profesionalizantes.</p>;
  }

  if (status.state === "NOT_STARTED") {
    return (
      <p className="text-slate-600">
        Hoy ({status.dayOfWeek}) la clase es de <strong>{status.start}</strong> a{" "}
        <strong>{status.end}</strong>. Vas a poder registrar tu asistencia cuando comience.
      </p>
    );
  }

  if (status.state === "CLOSED") {
    return (
      <p className="text-slate-600">
        La clase de hoy ({status.start} a {status.end}) ya finalizó y no llegaste a registrar tu
        asistencia. Consultá con tu profesor/a si necesitás una corrección.
      </p>
    );
  }

  if (alreadyRegistered) {
    return (
      <p className="font-medium text-green-700">
        ✔ Ya registraste tu asistencia de hoy ({status.dayOfWeek}, +{status.hours}hs).
      </p>
    );
  }

  return (
    <div>
      <p className="mb-3 text-slate-600">
        La clase de hoy ({status.dayOfWeek}, {status.start} a {status.end}) está en curso. Podés
        registrar tu asistencia ahora (+{status.hours}hs).
      </p>
      <button className="btn-primary" onClick={onRegister} disabled={registering}>
        {registering ? "Registrando..." : "Registrar asistencia"}
      </button>
    </div>
  );
}
