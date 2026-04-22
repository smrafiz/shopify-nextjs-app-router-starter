"use client";

import { Skeleton } from "@/shared/components/loading/Skeleton";

/**
 * Full-page skeleton shown while the dashboard is loading or the session
 * is being validated.
 */
export function DashboardSkeleton() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <Skeleton width="30%" height="2rem" />
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "1rem",
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {[0, 1].map((i) => (
                        <div
                            key={i}
                            className="rounded border border-[#e1e3e5] p-5"
                            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
                        >
                            <Skeleton width="50%" height="1.25rem" />
                            <Skeleton count={4} height="0.875rem" />
                        </div>
                    ))}
                </div>
                <div
                    className="rounded border border-[#e1e3e5] p-5"
                    style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
                >
                    <Skeleton width="60%" height="1.25rem" />
                    <Skeleton count={8} height="0.875rem" />
                </div>
            </div>
        </div>
    );
}
