"use client";

import { useSessionStore } from "@/shared/stores/session.store";
import { useShopStore } from "@/shared/stores/shop.store";
import { storeToken } from "@/shared/actions";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

/**
 * Initializes the session from App Bridge token.
 * Mount this once at the root of your authenticated layout.
 */
export function useSessionProvider() {
    const app = useAppBridge();
    const searchParams = useSearchParams();

    const {
        updateSessionToken,
        clearSession,
        setParams,
        validateSession,
        hasValidSession,
        sessionToken,
        shop,
        host,
        isInitialized,
        sessionError,
    } = useSessionStore();

    const { setShop } = useShopStore();

    const [retryCount, setRetryCount] = useState(0);
    const tokenProcessed = useRef(false);

    const isThemeExtension =
        typeof window !== "undefined" &&
        (window.parent !== window ||
            document.referrer.includes("admin.shopify.com") ||
            document.referrer.includes("myshopify.com/admin/themes"));

    useEffect(() => {
        if (tokenProcessed.current || hasValidSession) return;

        const handleSession = async () => {
            if (tokenProcessed.current) return;
            tokenProcessed.current = true;

            try {
                if (!app) {
                    tokenProcessed.current = false;
                    return;
                }

                const token = await app.idToken();

                if (!token) {
                    clearSession();
                    if (retryCount < 3) {
                        setTimeout(() => {
                            setRetryCount((prev) => prev + 1);
                            tokenProcessed.current = false;
                        }, 3000);
                    }
                    return;
                }

                updateSessionToken(token);

                let stored = false;
                try {
                    await storeToken(token);
                    stored = true;
                } catch (e) {
                    console.error("[useSessionProvider] Token storage failed:", e);
                }

                if (!stored) {
                    clearSession();
                    return;
                }

                await validateSession();
            } catch (error) {
                console.error("[useSessionProvider] Init failed:", error);
                clearSession();

                if (retryCount < 3) {
                    setTimeout(() => {
                        setRetryCount((prev) => prev + 1);
                        tokenProcessed.current = false;
                    }, 3000);
                }
            }
        };

        void handleSession();
    }, [
        app,
        isThemeExtension,
        hasValidSession,
        retryCount,
        updateSessionToken,
        clearSession,
        validateSession,
    ]);

    // Sync shop/host params from URL on first load
    useEffect(() => {
        if (isThemeExtension) return;

        const shopParam = searchParams.get("shop");
        const hostParam = searchParams.get("host");

        if (!isInitialized && (shopParam || hostParam)) {
            setParams(shopParam ?? shop, hostParam ?? host);
        }
    }, [isInitialized, searchParams, isThemeExtension, setParams, shop, host]);

    // Expose app bridge globally for non-React code
    useEffect(() => {
        if (!isThemeExtension && app) {
            window.__APP_BRIDGE__ = app as unknown as typeof window.__APP_BRIDGE__;
        }
    }, [app, isThemeExtension]);

    // Sync session store shop to shop store
    useEffect(() => {
        if (shop) {
            setShop({ domain: shop });
        }
    }, [shop, setShop]);

    return {
        isThemeExtension,
        hasValidSession,
        sessionError,
        sessionToken,
        retryCount,
    };
}
