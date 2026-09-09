"use client";

import { useCallback, useEffect, useState } from "react";

type CancelledClass = {
  id: string;
  date: string;
  dayOfWeek: string;
  reason: string | null;
};

export default function CancelledClasses({ onChange }: { onChange?: () => void }) {
  const [cancelled, setCancelled] = useState<CancelledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    const data = await fetch("/api/classes").then((r) => r.json());
    setCancelled(data.cancelled ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function cancelClass() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, reason }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage({ text: data.error ?? "No se pudo anular la clase.", ok: false });
      return;
    }

    const afectadas = data.affected ?? 0;
    setMessage({
      text:
        afectadas > 0
          ? `Clase anulada. ${afectadas} ${afectadas === 1 ? "asistencia ya registrada dejó" : "asistencias ya registradas dejaron"} de acreditar horas.`
          : "Clase anulada.",
      ok: true,
    });
    setDate("");
    setReason("");
    await load();
    onChange?.();
  }

  async function reactivate(d: string) {
    setMessage(null);
    const res = await fetch("/api/classes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: d }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ text: data.error ?? "No se pudo reactivar la clase.", ok: false });
      return;
    }
    setMessage({ text: "Clase reactivada. Las asistencias de esa fecha vuelven a contar.", ok: true });
    await load();
    onChange?.();
  }

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">
        Si una clase no se dicta (feriado, paro, suspensión), anulala acá. Podés anular clases que
        ya pasaron y también futuras. Las asistencias que ya estén registradas en esa fecha dejan
        de acreditar horas, pero no se borran: si reactivás la clase, vuelven a contar.
      </p>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Fecha de la clase</label>
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="min-w-[220px] flex-1">
          <label className="label">Motivo (opcional)</label>
          <input
            type="text"
            className="input"
            placeholder="Ej: feriado nacional"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={cancelClass} disabled={!date || saving}>
          {saving ? "Anulando..." : "Anular clase"}
        </button>
      </div>

      {message && (
        <p className={`mb-4 text-sm font-medium ${message.ok ? "text-green-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      <h4 className="mb-2 text-sm font-semibold text-slate-600">Clases anuladas</h4>
      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : cancelled.length === 0 ? (
        <p className="text-sm text-slate-500">No hay clases anuladas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Día</th>
                <th>Motivo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cancelled.map((c) => (
                <tr key={c.id}>
                  <td>{c.date}</td>
                  <td>{c.dayOfWeek}</td>
                  <td className="text-slate-500">{c.reason ?? "—"}</td>
                  <td>
                    <button className="btn-outline !px-3 !py-1 !text-sm" onClick={() => reactivate(c.date)}>
                      Reactivar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
