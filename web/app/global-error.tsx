"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Global Error]", error);
    }, [error]);

    return (
        <html lang="en">
            <body style={{ margin: 0, padding: "2rem", fontFamily: "sans-serif" }}>
                <div
                    style={{
                        maxWidth: 600,
                        margin: "4rem auto",
                        padding: "1.5rem",
                        border: "1px solid #d82c0d",
                        borderRadius: 8,
                        backgroundColor: "#fff4f4",
                    }}
                >
                    <h2 style={{ color: "#d82c0d", marginTop: 0 }}>
                        Application error
                    </h2>
                    <p style={{ color: "#202223" }}>
                        {error.message ||
                            "An unexpected error occurred. Please reload the page."}
                    </p>
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
            </body>
        </html>
    );
}
