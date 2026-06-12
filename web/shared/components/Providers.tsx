"use client";

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
 *   TanstackProvider (React Query) → SessionProvider (token init)
 *     → ProtectedRoute (auth guard)
 *
 * Add feature-specific providers between SessionProvider and
 * ProtectedRoute as your app grows.
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

    return (
        <TanstackProvider dehydratedState={dehydratedState}>
            <Suspense fallback={<DashboardSkeleton />}>
                <SessionProvider>
                    <ProtectedRoute>{children}</ProtectedRoute>
                </SessionProvider>
            </Suspense>
        </TanstackProvider>
    );
}
