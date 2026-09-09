import { prisma } from "@/lib/prisma";

/**
 * Fechas (YYYY-MM-DD) de clases anuladas. Las asistencias que caen en una de
 * estas fechas no acreditan horas, pero el registro no se borra: si la clase
 * se reactiva, vuelven a contar.
 */
export async function getCancelledDates(): Promise<Set<string>> {
  const cancelled = await prisma.cancelledClass.findMany({ select: { date: true } });
  return new Set(cancelled.map((c) => c.date));
}

type HourBearing = { date: string; hours: number };

/** Suma de horas acreditadas, descartando las de clases anuladas. */
export function sumCreditedHours(attendances: HourBearing[], cancelledDates: Set<string>): number {
  return attendances.reduce((sum, a) => (cancelledDates.has(a.date) ? sum : sum + a.hours), 0);
}
