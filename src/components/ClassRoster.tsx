"use client";

import { useCallback, useEffect, useState } from "react";

type RosterEntry = {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  attended: boolean;
  hours: number;
  source: string | null;
};

type Roster = {
  date: string;
  dayOfWeek: string;
  start: string;
  end: string;
  cancelled: boolean;
  reason: string | null;
  isFuture: boolean;
  presentes: number;
  ausentes: number;
  total: number;
  roster: RosterEntry[];
  error?: string;
};

type ClassDate = { date: string; dayOfWeek: string };

export default function ClassRoster() {
  const [dates, setDates] = useState<ClassDate[]>([]);
  const [selected, setSelected] = useState("");
  const [data, setData] = useState<Roster | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"TODOS" | "PRESENTES" | "AUSENTES">("TODOS");

  useEffect(() => {
    fetch("/api/classes/dates?limit=20")
      .then((r) => r.json())
      .then((d) => {
        setDates(d.dates ?? []);
        // Arranca en la clase más reciente.
        if (d.dates?.length) setSelected(d.dates[0].date);
        else setLoading(false);
      });
  }, []);

  const load = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    const d = await fetch(`/api/classes/roster?date=${selected}`).then((r) => r.json());
    setData(d);
    setLoading(false);
  }, [selected]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = (data?.roster ?? []).filter((r) =>
    filter === "TODOS" ? true : filter === "PRESENTES" ? r.attended : !r.attended
  );

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">
        Elegí una clase para ver quiénes registraron asistencia y quiénes no.
      </p>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="clase">Clase</label>
          <select
            id="clase"
            className="input"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {dates.map((d) => (
              <option key={d.date} value={d.date}>
                {d.dayOfWeek} {d.date}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="otraFecha">Otra fecha</label>
          <input
            id="otraFecha"
            type="date"
            className="input"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : !data ? null : data.error ? (
        <p className="text-sm font-medium text-red-600">{data.error}</p>
      ) : (
        <>
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-primary">
              {data.dayOfWeek} {data.date} · {data.start} a {data.end}
            </p>
            {data.cancelled ? (
              <p className="mt-1 text-sm font-medium text-amber-700">
                Clase anulada{data.reason ? `: ${data.reason}` : ""} — no acredita horas.
              </p>
            ) : data.isFuture ? (
              <p className="mt-1 text-sm text-slate-500">
                Esta clase todavía no sucedió.
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-600">
                <strong className="text-green-700">{data.presentes} presentes</strong> ·{" "}
                <strong className="text-red-600">{data.ausentes} sin registrar</strong> de{" "}
                {data.total} alumnos
              </p>
            )}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {([
              ["TODOS", `Todos (${data.total})`],
              ["PRESENTES", `Presentes (${data.presentes})`],
              ["AUSENTES", `Sin registrar (${data.ausentes})`],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  filter === key
                    ? "bg-primary text-white"
                    : "border border-primary/30 bg-white text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>DNI</th>
                  <th>Asistencia</th>
                  <th>Horas</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.apellido}, {r.nombre}</td>
                    <td>{r.dni}</td>
                    <td>
                      {r.attended ? (
                        <span className="badge bg-green-100 text-green-700">Presente</span>
                      ) : (
                        <span className="badge bg-red-100 text-red-700">Sin registrar</span>
                      )}
                    </td>
                    <td>
                      {r.attended && !data.cancelled
                        ? `${r.hours}hs`
                        : r.attended
                          ? "—"
                          : ""}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-slate-500">
                      No hay alumnos en este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
