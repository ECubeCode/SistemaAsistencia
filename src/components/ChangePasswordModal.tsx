"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { update } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ text: "La confirmación no coincide con la nueva contraseña.", ok: false });
      return;
    }

    setSaving(true);
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage({ text: data.error ?? "No se pudo cambiar la contraseña.", ok: false });
      return;
    }

    setMessage({ text: "¡Contraseña actualizada correctamente!", ok: true });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setDone(true);
    await update();
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary">Cambiar contraseña</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Cerrar">
            ✕
          </button>
        </div>

        {done ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-green-700">{message?.text}</p>
            <p className="text-sm text-slate-500">
              Este cambio de contraseña solo se puede hacer una vez. Si en el futuro necesitás
              modificarla de nuevo, vas a tener que solicitarlo en la escuela.
            </p>
            <button onClick={onClose} className="btn-primary w-full">
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-slate-500">
              Solo vas a poder cambiar tu contraseña una única vez, así que elegí bien la nueva.
            </p>
            <div>
              <label className="label">Contraseña actual</label>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Nueva contraseña</label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={4}
                required
              />
            </div>
            <div>
              <label className="label">Repetir nueva contraseña</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={4}
                required
              />
            </div>

            {message && !message.ok && <p className="text-sm font-medium text-red-600">{message.text}</p>}

            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
