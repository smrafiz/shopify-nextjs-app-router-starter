"use client";

import { AppProvider } from "@shopify/app-bridge-react";
import { DehydratedState } from "@tanstack/react-query";
import { ReactNode, Suspense, useEffect, useState } from "react";
import { TanstackProvider } from "./providers/TanstackProvider";
import { SessionProvider } from "./providers/SessionProvider";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { DashboardSkeleton } from "./loading/skeleton/DashboardSkeleton";

/**
 * Root provider composition for the Shopify embedded app.
 *
 * Order matters:
 *   AppProvider (App Bridge) → TanstackProvider (React Query)
 *     → SessionProvider (token init) → ProtectedRoute (auth guard)
 *
 * Add feature-specific providers (e.g. AppSettingsProvider) between
 * SessionProvider and ProtectedRoute as your app grows.
 */
export function Providers({
    children,
    dehydratedState,
}: {
    children: ReactNode;
    dehydratedState?: DehydratedState | null;
}) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) return null;

    const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY ?? "";

    return (
        <AppProvider apiKey={apiKey}>
            <TanstackProvider dehydratedState={dehydratedState}>
                <Suspense fallback={<DashboardSkeleton />}>
                    <SessionProvider>
                        <ProtectedRoute>{children}</ProtectedRoute>
                    </SessionProvider>
                </Suspense>
            </TanstackProvider>
        </AppProvider>
    );
}
