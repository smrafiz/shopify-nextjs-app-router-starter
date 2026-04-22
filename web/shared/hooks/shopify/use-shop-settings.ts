"use client";

import { useQuery } from "@tanstack/react-query";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useShopSettingsStore } from "@/shared/stores/shop-settings.store";
import { getShopSettingsAction } from "./get-shop-settings.action";

const SHOP_SETTINGS_KEY = ["shopSettings"] as const;

export function useShopSettings() {
    const shopify = useAppBridge();
    const { settings, isInitialized, setSettings } = useShopSettingsStore();

    const { isLoading, error } = useQuery({
        queryKey: SHOP_SETTINGS_KEY,
        queryFn: async () => {
            const token = await shopify.idToken();
            const result = await getShopSettingsAction(token);
            if (result.status === "error") throw new Error(result.message);
            setSettings(result.data!);
            return result.data!;
        },
        enabled: !isInitialized,
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });

    return {
        shopSettings: settings,
        isLoading: isLoading && !isInitialized,
        error: error instanceof Error ? error.message : null,
    };
}
