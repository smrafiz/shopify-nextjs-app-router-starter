"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

export function useAppNavigation() {
    const router = useRouter();

    const navigate = useCallback(
        (path: string) => {
            if (typeof window !== "undefined") window.scrollTo(0, 0);
            router.push(path);
        },
        [router],
    );

    const replace = useCallback(
        (path: string) => {
            router.replace(path);
        },
        [router],
    );

    const back = useCallback(() => {
        router.back();
    }, [router]);

    return { navigate, replace, back };
}
