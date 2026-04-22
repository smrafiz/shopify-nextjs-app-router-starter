"use client";

import { Skeleton } from "./Skeleton";

export function PageSkeleton() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <Skeleton width="40%" height="2rem" />
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded border border-[#e1e3e5] p-5 flex flex-col gap-3">
                    <Skeleton width="60%" height="1.25rem" />
                    <Skeleton width="80%" height="0.875rem" />
                    <Skeleton width="70%" height="0.875rem" />
                </div>
            ))}
        </div>
    );
}
