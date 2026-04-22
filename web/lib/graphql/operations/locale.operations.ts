"use server";

import { executeGraphQLQuery } from "@/lib/graphql/client/server-action";
import { prisma } from "@/shared/repositories/prisma-connect";
import { CachedLocalesArraySchema } from "./locale.validation";
import type { CachedLocale } from "./locale.validation";

// ---------------------------------------------------------------------------
// Shop info query (basic locale/timezone data)
// ---------------------------------------------------------------------------

export const GET_SHOP_LOCALE = /* GraphQL */ `
  query GetShopLocale {
    shop {
      name
      email
      currencyCode
      ianaTimezone
      primaryDomain {
        url
      }
      billingAddress {
        countryCodeV2
      }
    }
  }
`;

export interface GetShopLocaleQueryResponse {
    shop: {
        name: string;
        email: string;
        currencyCode: string;
        ianaTimezone: string;
        primaryDomain: { url: string };
        billingAddress: { countryCodeV2: string | null } | null;
    };
}

// ---------------------------------------------------------------------------
// Shop published locales query + caching
// ---------------------------------------------------------------------------

const GET_SHOP_LOCALES = /* GraphQL */ `
  query GetShopLocales {
    shopLocales {
      locale
      name
      primary
      published
    }
  }
`;

interface ShopLocalesResponse {
    shopLocales: Array<{
        locale: string;
        name: string;
        primary: boolean;
        published: boolean;
    }>;
}

const LOCALES_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchAndCacheShopLocales(
    sessionToken: string,
    domain: string,
): Promise<CachedLocale[]> {
    const response = await executeGraphQLQuery<ShopLocalesResponse>({
        query: GET_SHOP_LOCALES,
        sessionToken,
    });

    if (response.errors || !response.data?.shopLocales) {
        console.warn("[Locales] Failed to fetch shopLocales:", response.errors);
        return [];
    }

    const raw = response.data.shopLocales
        .filter((l) => l.published)
        .map(({ locale, name, primary }) => ({ locale, name, primary }));

    const published = CachedLocalesArraySchema.parse(raw);
    const primaryLocale = published.find((l) => l.primary)?.locale ?? "en";

    await prisma.shop.update({
        where: { domain },
        data: {
            locales: published,
            primaryLocale,
            localesUpdatedAt: new Date(),
        },
    });

    return published;
}

export async function getShopLocales(
    sessionToken: string,
    domain: string,
): Promise<CachedLocale[]> {
    const shop = await prisma.shop.findUnique({
        where: { domain },
        select: { locales: true, primaryLocale: true, localesUpdatedAt: true },
    });

    const isFresh =
        shop?.localesUpdatedAt &&
        Date.now() - new Date(shop.localesUpdatedAt).getTime() < LOCALES_TTL_MS;

    if (
        shop?.locales &&
        Array.isArray(shop.locales) &&
        (shop.locales as unknown[]).length > 0 &&
        isFresh
    ) {
        return CachedLocalesArraySchema.parse(shop.locales);
    }

    return fetchAndCacheShopLocales(sessionToken, domain);
}

export async function clearLocaleCache(domain: string): Promise<void> {
    await prisma.shop.update({
        where: { domain },
        data: { locales: [], localesUpdatedAt: null },
    });
}

export async function getShopPrimaryLocale(domain: string): Promise<string> {
    const shop = await prisma.shop.findUnique({
        where: { domain },
        select: { primaryLocale: true },
    });
    return shop?.primaryLocale ?? "en";
}
