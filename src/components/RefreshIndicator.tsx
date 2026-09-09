"use client";

/**
 * Muestra cuándo se actualizaron los datos por última vez y permite forzar
 * una actualización. El texto es deliberadamente neutro: no menciona quién
 * puede haber hecho los cambios.
 */
export default function RefreshIndicator({
  lastUpdate,
  refreshing,
  onRefresh,
}: {
  lastUpdate: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span>
        {refreshing
          ? "Actualizando..."
          : lastUpdate
            ? `Actualizado ${lastUpdate.toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "Se actualiza solo"}
      </span>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="rounded border border-slate-300 px-2 py-0.5 font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
        title="Actualizar ahora"
      >
        Actualizar
      </button>
    </div>
  );
}
