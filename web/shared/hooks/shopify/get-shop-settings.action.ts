"use server";

import { executeGraphQLQuery } from "@/lib";
import type { ActionResponse } from "@/shared/types";
import { ShopSettings } from "@/shared/stores/shop-settings.store";

const SHOP_SETTINGS_QUERY = `
  query GetShopSettings {
    shop {
      name
      email
      myshopifyDomain
      currencyCode
      ianaTimezone
      plan {
        displayName
      }
    }
  }
`;

interface ShopSettingsQueryResult {
    shop: {
        name: string;
        email: string;
        myshopifyDomain: string;
        currencyCode: string;
        ianaTimezone: string;
        plan: { displayName: string } | null;
    };
}

export async function getShopSettingsAction(
    sessionToken: string,
): Promise<ActionResponse<ShopSettings>> {
    try {
        const result = await executeGraphQLQuery<ShopSettingsQueryResult>({
            query: SHOP_SETTINGS_QUERY,
            sessionToken,
        });

        if (result.errors?.length) {
            return {
                status: "error",
                message: result.errors.map((e) => e.message).join(", "),
            };
        }

        const shop = result.data?.shop;
        if (!shop) {
            return { status: "error", message: "No shop data returned" };
        }

        return {
            status: "success",
            data: {
                name: shop.name,
                email: shop.email,
                domain: shop.myshopifyDomain,
                currency: shop.currencyCode,
                timezone: shop.ianaTimezone,
                plan: shop.plan?.displayName ?? "free",
            },
        };
    } catch (error) {
        return {
            status: "error",
            message: error instanceof Error ? error.message : "Failed to fetch shop settings",
        };
    }
}
