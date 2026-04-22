"use client";

import { ReactNode } from "react";
import { useSessionProvider } from "@/shared/hooks/session/use-session-provider";

/**
 * Initializes the App Bridge session on mount.
 * Wrap the authenticated portion of your app with this provider.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
    useSessionProvider();
    return <>{children}</>;
}
