"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import TopBar from "@/components/TopBar";
import StudentsTable, { StudentRow } from "@/components/StudentsTable";
import NewUserForm from "@/components/NewUserForm";
import LogsTable from "@/components/LogsTable";

type Tab = "alumnos" | "nuevo" | "logs";

export default function AdminPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("alumnos");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadStudents() {
    setLoading(true);
    const data = await fetch("/api/admin/users").then((r) => r.json());
    setStudents(data.users ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadStudents();
  }, []);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar nombre={session.user.nombre} apellido={session.user.apellido} roleLabel="Administrador" />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex gap-2">
          {([
            ["alumnos", "Alumnos"],
            ["nuevo", "Nuevo usuario"],
            ["logs", "Logs del sistema"],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                tab === key ? "bg-primary text-white" : "bg-white text-primary border border-primary/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "alumnos" && (
          <section className="card">
            <h2 className="mb-4 text-lg font-bold text-primary">Alumnos</h2>
            {loading ? (
              <p className="text-slate-500">Cargando...</p>
            ) : (
              <StudentsTable students={students} detailBasePath="/admin/alumnos" />
            )}
          </section>
        )}

        {tab === "nuevo" && (
          <section className="card">
            <h2 className="mb-4 text-lg font-bold text-primary">Crear usuario</h2>
            <NewUserForm onCreated={loadStudents} />
          </section>
        )}

        {tab === "logs" && (
          <section className="card">
            <h2 className="mb-4 text-lg font-bold text-primary">Logs del sistema</h2>
            <LogsTable />
          </section>
        )}
      </main>
    </div>
  );
}
