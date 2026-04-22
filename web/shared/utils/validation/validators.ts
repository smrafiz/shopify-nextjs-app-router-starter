/**
 * Validation Utilities
 */

import isEmail from "validator/lib/isEmail";
import isURL from "validator/lib/isURL";

export function isValidEmail(email: string): boolean {
  return isEmail(email);
}

export function isValidUrl(url: string): boolean {
  return isURL(url, { require_protocol: true });
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && isFinite(value) && value > 0;
}
