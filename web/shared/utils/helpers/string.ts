/**
 * String Utilities
 */

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function truncate(
  s: string,
  maxLength: number,
  suffix: string = "...",
): string {
  if (s.length <= maxLength) return s;
  return s.slice(0, maxLength - suffix.length) + suffix;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
}
