"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
    useGlobalBannerStore,
    type BannerType,
} from "@/shared/stores/global-banner.store";

function toneFromType(type: BannerType): "success" | "info" | "warning" | "critical" {
    switch (type) {
        case "success": return "success";
        case "error": return "critical";
        case "warning": return "warning";
        case "info":
        default: return "info";
    }
}

/**
 * Renders all queued banners from the global banner store.
 * Clears banners on route change.
 * Uses ARIA live regions for accessibility.
 */
export function GlobalBanner() {
    const pathname = usePathname();
    const { banners, removeBanner, clearAllBanners } = useGlobalBannerStore();

    useEffect(() => {
        return () => {
            clearAllBanners();
        };
    }, [pathname, clearAllBanners]);

    if (banners.length === 0) return null;

    const hasError = banners.some((b) => b.type === "error");

    return (
        <div
            role={hasError ? "alert" : "status"}
            aria-live={hasError ? "assertive" : "polite"}
            aria-atomic="false"
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
            {banners.map((banner) => (
                <s-banner
                    key={banner.id}
                    heading={banner.title}
                    tone={toneFromType(banner.type)}
                    dismissible={banner.dismissible}
                    onDismiss={
                        banner.dismissible
                            ? () => removeBanner(banner.id)
                            : undefined
                    }
                >
                    {banner.message}
                </s-banner>
            ))}
        </div>
    );
}
