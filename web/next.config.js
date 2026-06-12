/** @type {import('next').NextConfig} */
const nextConfig = {
    allowedDevOrigins: ["*.trycloudflare.com"],
    reactStrictMode: true,
    devIndicators: false,
    compress: true,
    poweredByHeader: false,
    cacheComponents: true,
    cacheLife: {
        dashboard: {
            stale: 30,
            revalidate: 60,
            expire: 300,
        },
        "dashboard-long": {
            stale: 300,
            revalidate: 600,
            expire: 3600,
        },
    },
    env: {
        NEXT_PUBLIC_HOST: process.env.HOST,
        NEXT_PUBLIC_SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
    },
    images: {
        remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    { key: "X-DNS-Prefetch-Control", value: "on" },
                    {
                        key: "Strict-Transport-Security",
                        value: "max-age=63072000; includeSubDomains; preload",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
