"use client";

import { useGlobalBannerStore, type BannerType } from "@/shared/stores/global-banner.store";

const toneFromType: Record<BannerType, "success" | "info" | "warning" | "critical"> = {
    success: "success",
    error: "critical",
    warning: "warning",
    info: "info",
};

export function Toast() {
    const { banners, removeBanner } = useGlobalBannerStore();

    if (banners.length === 0) return null;

    const hasError = banners.some((b) => b.type === "error");

    return (
        <div
            role={hasError ? "alert" : "status"}
            aria-live={hasError ? "assertive" : "polite"}
            aria-atomic="false"
            className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
        >
            {banners.map((banner) => (
                <s-banner
                    key={banner.id}
                    heading={banner.title}
                    tone={toneFromType[banner.type]}
                    dismissible={banner.dismissible}
                    onDismiss={
                        banner.dismissible ? () => removeBanner(banner.id) : undefined
                    }
                >
                    {banner.message}
                </s-banner>
            ))}
        </div>
    );
}
