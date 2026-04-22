import { NextResponse } from "next/server";

/**
 * Creates a rate limiter for a given set of options.
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  cleanupIntervalMs?: number;
}) {
  const { windowMs, maxRequests, cleanupIntervalMs = 300_000 } = options;
  const map = new Map<string, { count: number; windowStart: number }>();
  let lastCleanup = Date.now();

  return function checkRateLimit(key: string): boolean {
    const now = Date.now();

    if (now - lastCleanup > cleanupIntervalMs) {
      lastCleanup = now;
      for (const [k, entry] of map) {
        if (now - entry.windowStart > windowMs) {
          map.delete(k);
        }
      }
    }

    const entry = map.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      map.set(key, { count: 1, windowStart: now });
      return true;
    }

    entry.count++;
    return entry.count <= maxRequests;
  };
}

export const RATE_LIMIT_RESPONSE = NextResponse.json(
  { error: "Too many requests" },
  { status: 429 }
);
