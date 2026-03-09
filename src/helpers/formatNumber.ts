/**
 * Format a number for display.
 * - Under 1K: "487"
 * - 1K-999K: "24.3K"
 * - 1M+: "1.2M"
 */
export function formatNumber(num: number | bigint): string {
  const n = typeof num === "bigint" ? Number(num) : num;

  if (n < 1000) return n.toString();
  if (n < 1_000_000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  const m = n / 1_000_000;
  return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
}

/**
 * Format a percentage with sign.
 * E.g. 2.5 → "+2.5%", -3.1 → "-3.1%"
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
