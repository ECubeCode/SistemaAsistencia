"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import TopBar from "@/components/TopBar";

type Attendance = { id: string; date: string; dayOfWeek: string; hours: number; source: string };
type StudentInfo = {
  id: string; dni: string; nombre: string; apellido: string;
  initialHours: number; initialHoursSet: boolean; active: boolean;
};

export default function AlumnoDetalleProfesor({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch(`/api/attendance?studentId=${params.id}`).then((r) => r.json()),
    ]).then(([usersData, attData]) => {
      const found = (usersData.users ?? []).find((u: StudentInfo) => u.id === params.id) ?? null;
      setStudent(found);
      setAttendances(attData.attendances ?? []);
      setLoading(false);
    });
  }, [params.id]);

  if (!session) return null;

  const total = (student?.initialHours ?? 0) + attendances.reduce((sum, a) => sum + a.hours, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar
        nombre={session.user.nombre}
        apellido={session.user.apellido}
        roleLabel={session.user.role === "ADMIN" ? "Administrador" : "Profesor"}
      />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <Link href="/profesor" className="text-sm font-semibold text-primary hover:underline">
          ← Volver al listado
        </Link>

        {loading ? (
          <p className="text-slate-500">Cargando...</p>
        ) : !student ? (
          <p className="text-slate-500">Alumno no encontrado.</p>
        ) : (
          <>
            <section className="card">
              <h2 className="text-lg font-bold text-primary">{student.apellido}, {student.nombre}</h2>
              <p className="text-sm text-slate-500">DNI {student.dni}</p>
              <p className="mt-4 text-4xl font-extrabold text-accent">{total}hs</p>
              <p className="text-sm text-slate-500">
                {student.initialHoursSet ? `${student.initialHours}hs previas + ` : ""}
                {attendances.reduce((s, a) => s + a.hours, 0)}hs registradas ({attendances.length} asistencias)
              </p>
            </section>

            <section className="card">
              <h3 className="mb-4 text-lg font-bold text-primary">Historial de asistencias</h3>
              {attendances.length === 0 ? (
                <p className="text-sm text-slate-500">Sin asistencias registradas.</p>
              ) : (
                <table className="table-base">
                  <thead>
                    <tr><th>Fecha</th><th>Día</th><th>Horas</th><th>Origen</th></tr>
                  </thead>
                  <tbody>
                    {attendances.map((a) => (
                      <tr key={a.id}>
                        <td>{a.date}</td>
                        <td>{a.dayOfWeek}</td>
                        <td>{a.hours}hs</td>
                        <td>{a.source === "ADMIN" ? "Corregido por admin" : "Autoregistrado"}</td>
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
