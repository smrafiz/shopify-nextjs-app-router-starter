import { detectShop } from "@/security/shop";
import { addSecurityHeaders } from "@/security/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware to add CSP and security headers for Shopify embedded app pages.
 *
 * Skips: static assets, API routes, and theme extension requests.
 */
export default function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;
    const locale = searchParams.get("locale");

    const skipPaths = [
        "/api/",
        "/_next/",
        "/favicon.ico",
        "/public/",
        "/extensions/",
    ];

    // Redirect root to dashboard
    if (pathname === "/") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
    }

    const shop = detectShop(request, searchParams);

    if (skipPaths.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // Skip for theme extensions
    const referer = request.headers.get("referer");
    const secFetchDest = request.headers.get("sec-fetch-dest");

    if (
        secFetchDest === "iframe" ||
        referer?.includes("admin.shopify.com") ||
        referer?.includes("myshopify.com/admin/themes")
    ) {
        return NextResponse.next();
    }

    const response = addSecurityHeaders(NextResponse.next(), shop);

    if (locale) {
        response.cookies.set("NEXT_LOCALE", locale, {
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
            sameSite: "none",
            secure: true,
        });
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!api/auth|api/webhooks|api/proxy|api/gdpr|api/upload|_next|_proxy|_auth|_static|_vercel|favicon.ico|extensions|[\\w-]+\\.\\w+).*)",
    ],
};
