/**
 * Date Formatting Utilities
 */

/**
 * Format date using Intl.DateTimeFormat
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
  },
  locale: string = "en-US",
): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Format date as relative time (e.g. "2 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const diffMs = now - d.getTime();

  if (diffMs < -5000) return formatDate(d);

  const diffSec = Math.floor(Math.abs(diffMs) / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return `${m} minute${m !== 1 ? "s" : ""} ago`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return `${h} hour${h !== 1 ? "s" : ""} ago`;
  }
  if (diffSec < 2592000) {
    const d2 = Math.floor(diffSec / 86400);
    return `${d2} day${d2 !== 1 ? "s" : ""} ago`;
  }
  if (diffSec < 31536000) {
    const mo = Math.floor(diffSec / 2592000);
    return `${mo} month${mo !== 1 ? "s" : ""} ago`;
  }
  const y = Math.floor(diffSec / 31536000);
  return `${y} year${y !== 1 ? "s" : ""} ago`;
}

/**
 * Type guard — checks if value is a valid Date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}
