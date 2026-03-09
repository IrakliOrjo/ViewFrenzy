/**
 * Returns a Date object for N days in the past from now.
 * Useful for Prisma date filters and time-range comparisons.
 */
export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Returns a timestamp (ms) for N days in the past from now.
 * Useful for comparing against Date.getTime() values.
 */
export function daysAgoMs(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

/**
 * Returns today's date as an ISO date string (YYYY-MM-DD).
 */
export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Returns the ISO date string (YYYY-MM-DD) for N days ago.
 */
export function daysAgoISO(days: number): string {
  return daysAgo(days).toISOString().split("T")[0];
}
