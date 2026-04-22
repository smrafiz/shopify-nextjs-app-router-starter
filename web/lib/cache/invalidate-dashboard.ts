/**
 * Cache invalidation helpers for Next.js 16.
 *
 * - updateTag(tag)     → hard invalidation for "use cache" entries (Server Actions only)
 * - revalidateTag(tag) → invalidation for unstable_cache entries
 */

import { revalidateTag } from "next/cache";
import { cacheTags, invalidateShopCache } from "./cache-tags";

/**
 * Invalidate all shop-level caches.
 * Call from Server Actions after significant data changes.
 */
export { invalidateShopCache };

/**
 * Invalidate cached Shopify product data for a shop.
 * Call from webhook handlers (products/update, create, delete).
 */
export function invalidateProductCacheByShop(shop: string) {
    revalidateTag(cacheTags.shopifyProducts(shop), "max");
}
