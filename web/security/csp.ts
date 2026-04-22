/**
 * Generate Content Security Policy string
 */
export function generateCSP(shop: string, isDev = false): string {
    const frameAncestors = `frame-ancestors https://${shop} https://admin.shopify.com;`;

    const csp = [
        "default-src 'self';",
        "script-src 'self' 'unsafe-inline' https://cdn.shopify.com https://*.shopify.com;",
        "style-src 'self' 'unsafe-inline' https://cdn.shopify.com;",
        "img-src 'self' data: https: blob:;",
        "font-src 'self' https://fonts.gstatic.com https://cdn.shopify.com;",
        "connect-src 'self' https://*.shopify.com wss://*.shopify.com;",
        frameAncestors,
        "form-action 'self';",
        "base-uri 'self';",
    ];

    return csp.join(" ");
}
