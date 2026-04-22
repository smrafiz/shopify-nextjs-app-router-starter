import { generateCSP } from "./csp";
import { NextResponse } from "next/server";

/**
 * Add security headers including CSP
 */
export function addSecurityHeaders(response: NextResponse, shop: string) {
    const shopDomain = shop || "*.myshopify.com";

    response.headers.set(
        "Content-Security-Policy",
        generateCSP(shopDomain, process.env.NODE_ENV === "development"),
    );
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("X-DNS-Prefetch-Control", "on");
    response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
    );
    response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
    );
    response.headers.set(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload",
    );

    return response;
}
