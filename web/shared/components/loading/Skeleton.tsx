"use client";

interface SkeletonProps {
    width?: string;
    height?: string;
    className?: string;
    count?: number;
}

function SkeletonItem({ width = "100%", height = "1rem", className = "" }: Omit<SkeletonProps, "count">) {
    return (
        <div
            className={`rounded overflow-hidden relative bg-[#f3f3f3] ${className}`}
            style={{ width, height }}
        >
            <div
                className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#f3f3f3] via-[#e8e8e8] to-[#f3f3f3] bg-[length:200%_100%]"
                style={{ animation: "shimmer 1.8s infinite linear" }}
            />
            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}

export function Skeleton({ count = 1, ...props }: SkeletonProps) {
    if (count <= 1) return <SkeletonItem {...props} />;
    return (
        <div className="flex flex-col gap-2">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonItem key={i} {...props} />
            ))}
        </div>
    );
}
