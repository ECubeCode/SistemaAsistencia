"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import ExportHoursButton from "@/components/ExportHoursButton";

type Attendance = {
  id: string;
  date: string;
  dayOfWeek: string;
  hours: number;
  source: string;
  cancelled: boolean;
};
type StudentInfo = {
  id: string; dni: string; nombre: string; apellido: string; active: boolean;
};

export default function AlumnoDetalleProfesor({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch(`/api/attendance?studentId=${params.id}`).then((r) => r.json()),
    ]).then(([usersData, attData]) => {
      const found = (usersData.users ?? []).find((u: StudentInfo) => u.id === params.id) ?? null;
      setStudent(found);
      setAttendances(attData.attendances ?? []);
      setTotalHours(attData.totalHours ?? 0);
      setLoading(false);
    });
  }, [params.id]);

  if (!session) return null;

  const creditedCount = attendances.filter((a) => !a.cancelled).length;

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
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-primary">{student.apellido}, {student.nombre}</h2>
                  <p className="text-sm text-slate-500">DNI {student.dni}</p>
                  <p className="mt-4 text-4xl font-extrabold text-accent">{totalHours}hs</p>
                  <p className="text-sm text-slate-500">
                    {creditedCount} {creditedCount === 1 ? "asistencia acreditada" : "asistencias acreditadas"}
                  </p>
                </div>
                <ExportHoursButton label="Exportar horas (CSV)" studentId={student.id} />
              </div>
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
                      <tr key={a.id} className={a.cancelled ? "text-slate-400" : undefined}>
                        <td>{a.date}</td>
                        <td>{a.dayOfWeek}</td>
                        <td>
                          {a.cancelled ? (
                            <span className="badge bg-amber-100 text-amber-700">Clase anulada</span>
                          ) : (
                            `${a.hours}hs`
                          )}
                        </td>
                        <td>{a.source === "ADMIN" ? "Carga manual" : "Autoregistrado"}</td>
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
