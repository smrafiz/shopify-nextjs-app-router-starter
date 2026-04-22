"use client";

import { usePathname } from "next/navigation";

export function useActiveRoute() {
    const pathname = usePathname();

    return {
        pathname,
        isActive: (path: string) =>
            pathname === path || pathname.startsWith(path + "/"),
        isExact: (path: string) => pathname === path,
    };
}
