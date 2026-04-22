"use client";

import { useEffect } from "react";
import { useGlobalBannerStore } from "@/shared/stores/global-banner.store";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const addBanner = useGlobalBannerStore((s) => s.addBanner);
    const clearAllBanners = useGlobalBannerStore((s) => s.clearAllBanners);

    useEffect(() => {
        clearAllBanners();

        addBanner({
            type: "error",
            title: "Something went wrong",
            message: error.message || "An unexpected error occurred.",
            dismissible: true,
        });

        return () => {
            clearAllBanners();
        };
    }, [error, reset, addBanner, clearAllBanners]);

    return (
        <div style={{ padding: "1.5rem" }}>
            <button
                onClick={reset}
                style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#008060",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: "0.875rem",
                }}
            >
                Try again
            </button>
        </div>
    );
}
