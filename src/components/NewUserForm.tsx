"use client";

import { useState } from "react";

export default function NewUserForm({ onCreated }: { onCreated: () => void }) {
  const [dni, setDni] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ALUMNO");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dni, nombre, apellido, password, role }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage({ text: data.error ?? "Error al crear el usuario.", ok: false });
      return;
    }
    setMessage({ text: `Usuario ${dni} creado correctamente.`, ok: true });
    setDni("");
    setNombre("");
    setApellido("");
    setPassword("");
    setRole("ALUMNO");
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-lg gap-4">
      <div>
        <label className="label">DNI</label>
        <input className="input" value={dni} onChange={(e) => setDni(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Nombre</label>
          <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div>
          <label className="label">Apellido</label>
          <input className="input" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="label">Contraseña temporal</label>
        <input
          className="input"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={4}
          required
        />
      </div>
      <div>
        <label className="label">Rol</label>
        <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="ALUMNO">Alumno</option>
          <option value="PROFESOR">Profesor</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>

      {message && (
        <p className={`text-sm font-medium ${message.ok ? "text-green-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      <button className="btn-primary" disabled={saving}>
        {saving ? "Creando..." : "Crear usuario"}
      </button>
    </form>
  );
}
