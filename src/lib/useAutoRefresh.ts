"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_INTERVAL_MS = 30_000;

/**
 * Mantiene los datos de una pantalla al día sin que el usuario tenga que
 * recargar: si alguien corrige una asistencia mientras el profesor tiene el
 * listado abierto, el cambio aparece solo.
 *
 * - Refresca cada `intervalMs` mientras la pestaña está visible.
 * - No consulta nada mientras la pestaña está en segundo plano, y refresca
 *   en cuanto el usuario vuelve a ella.
 *
 * Devuelve el momento de la última actualización y un disparador manual.
 */
export function useAutoRefresh(
  // Se ignora lo que devuelva: solo interesa esperar a que termine.
  reload: () => unknown | Promise<unknown>,
  intervalMs: number = DEFAULT_INTERVAL_MS
) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // La función de recarga se guarda en una ref para que el efecto no se
  // reinicie en cada render del componente que la define.
  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (document.visibilityState !== "visible") return;
      setRefreshing(true);
      try {
        await reloadRef.current();
        if (!cancelled) setLastUpdate(new Date());
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    };

    const timer = setInterval(run, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [intervalMs]);

  const refreshNow = async () => {
    setRefreshing(true);
    try {
      await reloadRef.current();
      setLastUpdate(new Date());
    } finally {
      setRefreshing(false);
    }
  };

  return { lastUpdate, refreshing, refreshNow };
}
