"use client";

interface SpinnerProps {
    size?: "base" | "large";
    label?: string;
}

export function Spinner({ size = "base", label }: SpinnerProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <s-spinner size={size} accessibility-label={label ?? "Loading"} />
            {label && (
                <span className="text-sm text-gray-500">{label}</span>
            )}
        </div>
    );
}
