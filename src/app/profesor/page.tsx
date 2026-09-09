"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import TopBar from "@/components/TopBar";
import StudentsTable, { StudentRow } from "@/components/StudentsTable";

export default function ProfesorPage() {
  const { data: session } = useSession();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setStudents(data.users ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar
        nombre={session.user.nombre}
        apellido={session.user.apellido}
        roleLabel={session.user.role === "ADMIN" ? "Administrador" : "Profesor"}
      />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <section className="card">
          <h2 className="mb-4 text-lg font-bold text-primary">Alumnos - Prácticas Profesionalizantes</h2>
          {loading ? (
            <p className="text-slate-500">Cargando...</p>
          ) : (
            <StudentsTable students={students} detailBasePath="/profesor/alumnos" />
          )}
        </section>
      </main>
    </div>
  );
}
