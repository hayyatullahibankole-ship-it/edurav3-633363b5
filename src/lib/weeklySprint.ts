// Weekly sprint runs Monday 00:00 to Sunday 23:59:59 Lagos time (UTC+1, no DST).
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

export function weeklySprintEnd(now: Date = new Date()): Date {
  const lagos = new Date(now.getTime() + LAGOS_OFFSET_MS);
  const day = lagos.getUTCDay(); // 0 = Sunday
  const daysToNextMonday = day === 0 ? 1 : 8 - day;
  const nextMondayLagos = Date.UTC(lagos.getUTCFullYear(), lagos.getUTCMonth(), lagos.getUTCDate() + daysToNextMonday);
  return new Date(nextMondayLagos - LAGOS_OFFSET_MS);
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`;
}
