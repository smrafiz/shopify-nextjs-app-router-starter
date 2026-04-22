/**
 * Number Formatting Utilities
 */

/**
 * Format number with locale thousand separators
 */
export function formatNumber(n: number, locale: string = "en-US"): string {
  return n.toLocaleString(locale);
}

/**
 * Format number as percentage string
 */
export function formatPercent(n: number, decimals: number = 1): string {
  return `${n.toFixed(decimals)}%`;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
