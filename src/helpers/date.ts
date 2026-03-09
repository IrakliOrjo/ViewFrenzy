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

/**
 * Format a Date as a human-readable relative time string.
 * E.g. "5 minutes ago", "3 hours ago", "2 days ago", "1 week ago".
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
}
