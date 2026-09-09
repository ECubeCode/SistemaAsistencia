"use client";

import Link from "next/link";

export type StudentRow = {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  role: string;
  active: boolean;
  totalHours: number;
  totalAttendances: number;
};

export default function StudentsTable({
  students,
  detailBasePath,
}: {
  students: StudentRow[];
  detailBasePath: string;
}) {
  const alumnos = students.filter((s) => s.role === "ALUMNO");

  return (
    <div className="overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            <th>Alumno</th>
            <th>DNI</th>
            <th>Estado</th>
            <th>Asistencias</th>
            <th>Horas totales</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {alumnos.map((s) => (
            <tr key={s.id}>
              <td className="font-medium">{s.apellido}, {s.nombre}</td>
              <td>{s.dni}</td>
              <td>
                <span className={`badge ${s.active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                  {s.active ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td>{s.totalAttendances}</td>
              <td className="font-semibold text-accent-dark">{s.totalHours}hs</td>
              <td>
                <Link href={`${detailBasePath}/${s.id}`} className="text-sm font-semibold text-primary hover:underline">
                  Ver detalle
                </Link>
              </td>
            </tr>
          ))}
          {alumnos.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center text-slate-500">
                No hay alumnos cargados todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
