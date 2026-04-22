"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/shared/stores/session.store";

export function useSession() {
    const {
        shop,
        isValidating,
        hasToken,
        sessionError,
        isInitialized,
        hasValidSession,
        validateSession,
    } = useSessionStore();

    useEffect(() => {
        if (!isInitialized && !isValidating) {
            void validateSession();
        }
    }, [isInitialized, isValidating, validateSession]);

    return {
        shop,
        isValidating,
        hasToken,
        error: sessionError,
        isInitialized,
        hasValidSession,
    };
}
