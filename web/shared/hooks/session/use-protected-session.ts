"use client";

import { useSessionStore } from "@/shared/stores/session.store";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Validates the current session and redirects to auth if invalid.
 * Safe to call in any page/layout that requires authentication.
 */
export function useProtectedSession() {
    const {
        isInitialized,
        hasValidSession,
        sessionToken,
        validateSession,
        clearSession,
        isSessionExpired,
        shop,
    } = useSessionStore();

    const [isValidating, setIsValidating] = useState(false);
    const [validateAttempted, setValidateAttempted] = useState(false);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const pathnameRef = useRef(pathname);
    pathnameRef.current = pathname;
    const searchParamsRef = useRef(searchParams);
    searchParamsRef.current = searchParams;

    const isThemeExtension =
        typeof window !== "undefined" &&
        (window.parent !== window ||
            document.referrer.includes("admin.shopify.com") ||
            document.referrer.includes("myshopify.com/admin/themes"));

    useEffect(() => {
        if (isThemeExtension || isValidating || validateAttempted) return;

        const checkSession = async () => {
            if (!isInitialized || hasValidSession) return;

            setIsValidating(true);
            setValidateAttempted(true);

            try {
                await validateSession();

                const state = useSessionStore.getState();
                if (state.hasValidSession && !state.isSessionExpired()) {
                    setIsValidating(false);
                    setValidateAttempted(false);
                    return;
                }

                throw new Error("Session validation failed");
            } catch (error) {
                console.warn("[useProtectedSession] Validation failed:", error);
                clearSession();

                const shopParam =
                    searchParamsRef.current.get("shop") || shop;
                const authUrl = `/api/auth?returnTo=${encodeURIComponent(pathnameRef.current)}${shopParam ? `&shop=${shopParam}` : ""}`;

                setTimeout(() => router.push(authUrl), 0);
            } finally {
                setIsValidating(false);
            }
        };

        void checkSession();
    }, [
        isInitialized,
        hasValidSession,
        sessionToken,
        router,
        validateAttempted,
        isThemeExtension,
        isValidating,
        validateSession,
        clearSession,
        shop,
        isSessionExpired,
    ]);

    const isAuthenticated = hasValidSession && !isSessionExpired();
    return {
        isInitialized,
        isAuthenticated,
        sessionToken,
        isRefreshing: isValidating,
        isThemeExtension,
        hasValidSession,
    };
}
