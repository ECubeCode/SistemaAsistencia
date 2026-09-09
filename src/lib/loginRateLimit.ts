/**
 * Límite de intentos de login por DNI.
 *
 * Los DNIs de los alumnos son fáciles de conseguir, así que sin un freno
 * alcanza con probar contraseñas contra un DNI conocido. Tras
 * MAX_ATTEMPTS fallos seguidos el DNI queda bloqueado LOCK_MINUTES minutos.
 *
 * El estado vive en memoria del proceso: alcanza porque la app corre en un
 * único contenedor, y un reinicio (que solo puede hacer quien administra el
 * servidor) limpia los contadores. Si en el futuro se escala a varias
 * instancias, esto hay que mover a la base o a Redis.
 */

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 10;
// Los intentos fallidos se olvidan si pasa este tiempo sin actividad, para
// que un fallo aislado de hace horas no cuente contra el usuario.
const ATTEMPT_WINDOW_MINUTES = 15;

type Entry = { fails: number; lastFailAt: number; lockedUntil: number };

const attempts = new Map<string, Entry>();

function now() {
  return Date.now();
}

/** Descarta entradas viejas para que el Map no crezca sin control. */
function prune() {
  const cutoff = now() - Math.max(LOCK_MINUTES, ATTEMPT_WINDOW_MINUTES) * 60_000;
  for (const [key, entry] of attempts) {
    if (entry.lockedUntil < now() && entry.lastFailAt < cutoff) attempts.delete(key);
  }
}

/**
 * Minutos que faltan para poder reintentar, o 0 si no está bloqueado.
 */
export function minutesLocked(dni: string): number {
  const entry = attempts.get(dni);
  if (!entry) return 0;
  const remaining = entry.lockedUntil - now();
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / 60_000);
}

/**
 * Registra un intento fallido. Devuelve true si con este fallo el DNI
 * quedó bloqueado.
 */
export function registerFailure(dni: string): boolean {
  prune();
  const entry = attempts.get(dni);

  if (!entry || now() - entry.lastFailAt > ATTEMPT_WINDOW_MINUTES * 60_000) {
    attempts.set(dni, { fails: 1, lastFailAt: now(), lockedUntil: 0 });
    return false;
  }

  entry.fails += 1;
  entry.lastFailAt = now();

  if (entry.fails >= MAX_ATTEMPTS) {
    entry.lockedUntil = now() + LOCK_MINUTES * 60_000;
    entry.fails = 0; // se reinicia el conteo para el próximo ciclo
    return true;
  }
  return false;
}

/** Login exitoso: se limpia el historial de ese DNI. */
export function registerSuccess(dni: string) {
  attempts.delete(dni);
}

export const RATE_LIMIT_CONFIG = { MAX_ATTEMPTS, LOCK_MINUTES };
