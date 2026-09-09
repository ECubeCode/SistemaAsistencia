"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import TopBar from "@/components/TopBar";

type Attendance = { id: string; date: string; dayOfWeek: string; hours: number; source: string; note: string | null };
type StudentInfo = {
  id: string; dni: string; nombre: string; apellido: string; active: boolean;
  initialHours: number; initialHoursSet: boolean;
};

export default function AlumnoDetalleAdmin({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [initialHoursInput, setInitialHoursInput] = useState("0");
  const [newDate, setNewDate] = useState("");
  const [newHours, setNewHours] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [usersData, attData] = await Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch(`/api/attendance?studentId=${params.id}`).then((r) => r.json()),
    ]);
    const found = (usersData.users ?? []).find((u: StudentInfo) => u.id === params.id) ?? null;
    setStudent(found);
    if (found) setInitialHoursInput(String(found.initialHours));
    setAttendances(attData.attendances ?? []);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveInitialHours() {
    setMessage(null);
    const res = await fetch(`/api/admin/users/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initialHours: Number(initialHoursInput) }),
    });
    const data = await res.json();
    setMessage(res.ok ? { text: "Horas iniciales actualizadas.", ok: true } : { text: data.error, ok: false });
    if (res.ok) load();
  }

  async function toggleActive() {
    if (!student) return;
    const res = await fetch(`/api/admin/users/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !student.active }),
    });
    if (res.ok) load();
  }

  async function resetPassword() {
    if (newPassword.length < 4) {
      setMessage({ text: "La contraseña debe tener al menos 4 caracteres.", ok: false });
      return;
    }
    const res = await fetch(`/api/admin/users/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json();
    setMessage(res.ok ? { text: "Contraseña restablecida.", ok: true } : { text: data.error, ok: false });
    if (res.ok) setNewPassword("");
  }

  async function addOrEditAttendance() {
    setMessage(null);
    const res = await fetch("/api/admin/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: params.id,
        date: newDate,
        hours: newHours === "" ? undefined : Number(newHours),
      }),
    });
    const data = await res.json();
    setMessage(res.ok ? { text: "Asistencia guardada.", ok: true } : { text: data.error, ok: false });
    if (res.ok) {
      setNewDate("");
      setNewHours("");
      load();
    }
  }

  async function deleteAttendance(date: string) {
    if (!confirm(`¿Eliminar la asistencia del ${date}?`)) return;
    const res = await fetch("/api/admin/attendance", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: params.id, date }),
    });
    if (res.ok) load();
  }

  if (!session) return null;

  const total = (student?.initialHours ?? 0) + attendances.reduce((s, a) => s + a.hours, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar nombre={session.user.nombre} apellido={session.user.apellido} roleLabel="Administrador" />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Link href="/admin" className="text-sm font-semibold text-primary hover:underline">
          ← Volver al listado
        </Link>

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : !student ? (
          <p className="text-slate-500">Alumno no encontrado.</p>
        ) : (
          <>
            <section className="card flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-primary">{student.apellido}, {student.nombre}</h2>
                <p className="text-sm text-slate-500">DNI {student.dni}</p>
                <p className="mt-4 text-4xl font-extrabold text-accent">{total}hs</p>
              </div>
              <button onClick={toggleActive} className={student.active ? "btn-danger" : "btn-outline"}>
                {student.active ? "Desactivar cuenta" : "Reactivar cuenta"}
              </button>
            </section>

            {message && (
              <p className={`text-sm font-medium ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>
            )}

            <section className="card grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-bold text-primary">Horas previas al sistema</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={initialHoursInput}
                    onChange={(e) => setInitialHoursInput(e.target.value)}
                  />
                  <button className="btn-outline whitespace-nowrap" onClick={saveInitialHours}>Guardar</button>
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-bold text-primary">Restablecer contraseña</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input"
                    placeholder="Nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button className="btn-outline whitespace-nowrap" onClick={resetPassword}>Restablecer</button>
                </div>
              </div>
            </section>

            <section className="card">
              <h3 className="mb-2 font-bold text-primary">Cargar / corregir asistencia de una clase pasada</h3>
              <p className="mb-3 text-sm text-slate-500">
                Solo se pueden cargar fechas de martes, jueves o viernes que ya sucedieron. Si dejás
                "Horas" vacío, se acredita el total del día (3hs).
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="label">Fecha</label>
                  <input type="date" className="input" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                </div>
                <div>
                  <label className="label">Horas (opcional)</label>
                  <input
                    type="number"
                    min={0}
                    max={3}
                    className="input w-24"
                    value={newHours}
                    onChange={(e) => setNewHours(e.target.value)}
                  />
                </div>
                <button className="btn-primary" onClick={addOrEditAttendance} disabled={!newDate}>
                  Guardar
                </button>
              </div>
            </section>

            <section className="card">
              <h3 className="mb-4 font-bold text-primary">Historial de asistencias</h3>
              {attendances.length === 0 ? (
                <p className="text-sm text-slate-500">Sin asistencias registradas.</p>
              ) : (
                <table className="table-base">
                  <thead>
                    <tr><th>Fecha</th><th>Día</th><th>Horas</th><th>Origen</th><th></th></tr>
                  </thead>
                  <tbody>
                    {attendances.map((a) => (
                      <tr key={a.id}>
                        <td>{a.date}</td>
                        <td>{a.dayOfWeek}</td>
                        <td>{a.hours}hs</td>
                        <td>{a.source === "ADMIN" ? "Corregido por admin" : "Autoregistrado"}</td>
                        <td>
                          <button className="btn-danger" onClick={() => deleteAttendance(a.date)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
