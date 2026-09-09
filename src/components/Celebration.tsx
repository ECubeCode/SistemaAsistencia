"use client";

import { useEffect, useRef, useState } from "react";
import { MILESTONE_HOURS } from "@/lib/milestones";

const COLORS = ["#4B2E83", "#29ABE2", "#6B45AE", "#6FC8ED", "#FFC845", "#FF6B6B", "#3DD68C"];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
};

/**
 * Lluvia de papelitos multicolor cuando el alumno cruza un hito de horas.
 *
 * Se dibuja en un canvas propio a pantalla completa (pointer-events: none,
 * así no bloquea la interacción) y se apaga sola. Si el sistema pide menos
 * animaciones, se muestra solo el cartel sin partículas.
 */
export default function Celebration({
  hours,
  milestone,
  onDone,
}: {
  hours: number;
  milestone: number;
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;

    let raf = 0;
    let stopped = false;

    if (canvas && !reduceMotion) {
      const ctx = canvas.getContext("2d");
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const resize = () => {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener("resize", resize);

      const w = () => canvas.width / dpr;
      const h = () => canvas.height / dpr;

      // Menos partículas en pantallas chicas para no castigar al celular.
      const count = window.innerWidth < 640 ? 90 : 160;
      // La dispersión inicial y la velocidad están calibradas para que la
      // caída termine cerca de los 6s en los que se retira el cartel: con
      // valores más lentos los papelitos quedaban cortados a mitad de caída.
      const particles: Particle[] = Array.from({ length: count }, () => ({
        x: Math.random() * w(),
        y: -20 - Math.random() * h() * 0.35,
        vx: (Math.random() - 0.5) * 1.6,
        vy: 3.2 + Math.random() * 4,
        size: 6 + Math.random() * 7,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
      }));

      const render = () => {
        if (!ctx || stopped) return;
        ctx.clearRect(0, 0, w(), h());

        let alive = 0;
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.spin;
          p.vx += Math.sin(p.y / 40) * 0.04; // leve vaivén al caer

          if (p.y < h() + 40) alive++;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        }

        if (alive === 0) {
          stopped = true;
          return;
        }
        raf = requestAnimationFrame(render);
      };
      render();

      return () => {
        stopped = true;
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
      };
    }
  }, []);

  // El cartel se retira solo; el canvas queda hasta que caen todos los papeles.
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 6000);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!visible) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-40"
        aria-hidden="true"
      />
      <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center px-4">
        <div
          className="pointer-events-auto max-w-sm rounded-2xl border-2 border-accent bg-white p-6 text-center shadow-2xl"
          role="status"
        >
          <p className="mb-2 text-4xl" aria-hidden="true">
            🎉
          </p>
          <h2 className="mb-1 text-xl font-extrabold text-primary">
            ¡{milestone === 1 ? "Primer" : `${milestone}°`} festejo!
          </h2>
          <p className="text-slate-600">
            Llegaste a <strong className="text-accent-dark">{hours}hs</strong> de Prácticas
            Profesionalizantes.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Un festejo cada {MILESTONE_HOURS}hs. ¡Seguí así!
          </p>
          <button
            onClick={() => {
              setVisible(false);
              onDone();
            }}
            className="btn-primary mt-4 w-full"
          >
            ¡Genial!
          </button>
        </div>
      </div>
    </>
  );
}
