/**
 * Festejos por horas acumuladas.
 *
 * Cada 27hs (9 clases de 3hs) el alumno alcanza un hito y la app lo festeja.
 * A pedido de la dirección no se muestra la meta total de la materia: solo
 * los festejos, para que el progreso no se lea como algo inalcanzable.
 */
export const MILESTONE_HOURS = 27;

/** Cuántos hitos alcanzó con esa cantidad de horas. */
export function milestonesReached(hours: number): number {
  return Math.floor(hours / MILESTONE_HOURS);
}

/** Horas que le faltan para el próximo festejo. */
export function hoursToNextMilestone(hours: number): number {
  return MILESTONE_HOURS - (hours % MILESTONE_HOURS);
}

/**
 * Determina si al pasar de `before` a `after` horas se cruzó un hito.
 * Se compara por cantidad de hitos y no por igualdad exacta para que una
 * corrección del admin que sume varios hitos de golpe también lo detecte.
 */
export function crossedMilestone(before: number, after: number): boolean {
  return milestonesReached(after) > milestonesReached(before);
}
