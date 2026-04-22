import crypto from "crypto";

/**
 * Verifies that a request comes from Shopify's App Proxy.
 * Shopify signs the request query params with HMAC-SHA256.
 *
 * @see https://shopify.dev/docs/apps/online-store/app-proxies#validate-proxy-requests
 */
export function verifyProxyHmac(searchParams: URLSearchParams): boolean {
  const hmac = searchParams.get("hmac");
  if (!hmac) return false;

  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) return false;

  const params = new URLSearchParams(searchParams);
  params.delete("hmac");

  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(sortedParams)
    .digest("hex");

  // Lengths must match for timingSafeEqual
  if (hmac.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected));
}
