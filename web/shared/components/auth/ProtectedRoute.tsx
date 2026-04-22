"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useProtectedSession } from "@/shared/hooks/session/use-protected-session";
import { DashboardSkeleton } from "@/shared/components/loading/skeleton/DashboardSkeleton";

/**
 * Guards all routes by validating or refreshing the Shopify session.
 * Show a skeleton while initializing; redirect to auth on failure.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isInitialized, hasValidSession, isRefreshing, isThemeExtension, sessionToken } =
        useProtectedSession();
    const pathname = usePathname();

    // Theme extensions bypass session protection
    if (isThemeExtension) return <>{children}</>;

    // Root "/" is used for Shopify app initialization — never block it
    if (pathname === "/") return <>{children}</>;

    // Show skeleton while checking or refreshing the session
    if (!isInitialized || isRefreshing || (!hasValidSession && !sessionToken)) {
        return <DashboardSkeleton />;
    }

    return <>{children}</>;
}
