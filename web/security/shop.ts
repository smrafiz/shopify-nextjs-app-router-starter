import { NextRequest } from "next/server";

/**
 * Detect Shopify shop domain from query params, cookies, or session data
 */
export function detectShop(
    request?: NextRequest,
    searchParams?: URLSearchParams,
): string {
    if (searchParams) {
        const shopParam = searchParams.get("shop");
        if (shopParam) return shopParam;
    }

    if (request) {
        const shopCookie = request.cookies.get("shopify-shop")?.value;
        if (shopCookie) return shopCookie;

        const sessionCookie = request.cookies.get("shopify-session")?.value;
        const shopFromSession = sessionCookie
            ? extractShopFromSession(sessionCookie)
            : null;
        if (shopFromSession) return shopFromSession;
    }

    return "*.myshopify.com";
}

function extractShopFromSession(session: string): string | null {
    if (!session) return null;

    try {
        const decoded = decodeURIComponent(session);
        const data = JSON.parse(decoded);
        if (data?.shop) return data.shop;
    } catch {
        // URL-decode parse failed
    }

    try {
        const jsonStr = Buffer.from(session, "base64").toString("utf-8");
        const data = JSON.parse(jsonStr);
        if (data?.shop) return data.shop;
    } catch {
        // Base64 parse failed
    }

    const match = session.match(/([a-z0-9-]+\.myshopify\.com)/i);
    return match ? match[1] : null;
}
