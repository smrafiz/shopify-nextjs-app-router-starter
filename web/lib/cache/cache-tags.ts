/**
 * Centralized cache tag definitions for Next.js unstable_cache invalidation.
 *
 * Tags are per-shop to avoid cross-tenant cache pollution.
 * Use these constants with unstable_cache and revalidateTag.
 */

import { revalidateTag } from "next/cache";

export const cacheTags = {
  /** Shop configuration and settings */
  shop: (shop: string) => `shop-${shop}`,

  /** Session and auth state */
  session: (shop: string) => `session-${shop}`,

  /** In-app announcements or notifications */
  announcements: (shop: string) => `announcements-${shop}`,

  /**
   * Shopify product data for a shop.
   * Keyed by shop so invalidation is scoped per-tenant.
   * Bust via products/update webhook.
   */
  shopifyProducts: (shop: string) => `shopify-products-${shop}`,
} as const;

/** Revalidation durations in seconds */
export const cacheDurations = {
  /** 5 minutes — frequently changing data */
  short: 300,

  /** 10 minutes — moderately stable data */
  medium: 600,

  /**
   * 1 hour — Shopify product data.
   * Changes infrequently; webhook handlers bust this tag on product update.
   * TTL is a safety net, not the primary freshness mechanism.
   */
  shopifyProducts: 3600,

  /** 24 hours — rarely changing config */
  long: 86400,
} as const;

// ---------------------------------------------------------------------------
// Invalidation helpers
// ---------------------------------------------------------------------------

/** Invalidate all shop-scoped cache tags for a given shop domain. */
export function invalidateShopCache(shop: string): void {
  revalidateTag(cacheTags.shop(shop));
  revalidateTag(cacheTags.session(shop));
  revalidateTag(cacheTags.announcements(shop));
}

/** Invalidate Shopify product cache for a shop. */
export function invalidateProductCache(shop: string): void {
  revalidateTag(cacheTags.shopifyProducts(shop));
}
