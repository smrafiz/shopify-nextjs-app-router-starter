# Security

## Content Security Policy

CSP headers are set in two places:

1. **`next.config.js`** — sets static CSP headers on all routes via the `headers()` config
2. **`web/middleware.ts`** — calls `addSecurityHeaders()` to apply per-request CSP with the shop-specific `frame-ancestors` value

The `frame-ancestors` directive is scoped to the installing shop's domain, which prevents the app from being embedded in any other origin. This is required for Shopify embedded apps and replaces the old `X-Frame-Options` header.

```
frame-ancestors https://*.myshopify.com https://admin.shopify.com
```

`script-src` includes `'unsafe-inline'` because Shopify Polaris and App Bridge inject inline scripts. Removing it breaks the UI.

Static headers from `next.config.js`:
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-DNS-Prefetch-Control: on`

## Token Encryption

Shopify access tokens are encrypted with AES-256-GCM before being written to the `Session` table. The key is a 32-byte hex string from the `ENCRYPTION_KEY` environment variable.

The `isEncrypted()` helper detects unencrypted tokens (plaintext Shopify tokens start with `shpat_`, `shpua_`, etc.) and auto-encrypts them on read. This makes it safe to add encryption to an existing deployment without a migration.

The app throws at startup if `ENCRYPTION_KEY` is missing or not a valid 32-byte hex string.

## Rate Limiting

The App Proxy routes (`/api/proxy/*`) and the upload endpoint are rate-limited using an in-memory sliding window limiter scoped per shop domain:

- **Limit:** 100 requests per minute per shop
- **Response on exceeded:** HTTP 429 with `Retry-After: 60` header

The limiter is in-memory, so it resets on Vercel function cold starts. For production apps with meaningful traffic you'll want to replace this with Redis-backed limiting (e.g. Upstash).

## Startup Validation

The app validates required environment variables at startup and throws if any are missing or invalid:

| Variable | Requirement |
|---|---|
| `SHOPIFY_API_KEY` | must be present |
| `SHOPIFY_API_SECRET` | must be present |
| `ENCRYPTION_KEY` | must be a 64-character hex string (32 bytes) |
| `CRON_SECRET` | minimum 16 characters |

## Cron Authentication

Cron routes at `/api/cron/*` require a `Authorization: Bearer <CRON_SECRET>` header. Requests without a valid token get a 401. The secret minimum length (16 chars) is enforced at startup to prevent weak values from being deployed.

Vercel sends this header automatically when the `CRON_SECRET` env var is set in your project.

## Upload Endpoint

`/api/upload` enforces:
- **CORS:** only Shopify origins are allowed (allowlist, not `*`)
- **File size:** 20MB maximum (enforced before reading the body into memory)
- **Body validation:** `Array.isArray()` check on parsed JSON before processing

## XSS Protection

Any content rendered with `dangerouslySetInnerHTML` is sanitized through `isomorphic-dompurify` before use. The `sanitize()` call is in place in all three locations where raw HTML is rendered.

## Input Validation

All server action inputs are validated with Zod before processing. The validation schemas live in `features/<name>/validation/`. Malformed or unexpected input returns a validation error rather than reaching the service or repository layer.
