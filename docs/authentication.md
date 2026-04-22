# Authentication

## OAuth Flow

Shopify initiates installation by redirecting to `/api/auth?shop=<shop-domain>`. The handler validates the shop domain format and redirects to the Shopify admin install URL:

```
GET /api/auth?shop=my-store.myshopify.com
→ https://my-store.myshopify.com/admin/apps/<CLIENT_ID>
```

After the merchant authorizes the app, Shopify calls your OAuth callback. The `@shopify/shopify-api` SDK handles HMAC validation, code exchange, and token storage.

Sessions are stored in PostgreSQL via the Prisma `Session` model. The `apiKey` field on `Session` allows multiple apps to share the same database.

## Session Models

```prisma
model Session {
  id               String            @id @default(uuid())
  accessToken      String?           # AES-256-GCM encrypted
  expires          DateTime?
  isOnline         Boolean
  scope            String?
  shop             String
  state            String
  apiKey           String
  onlineAccessInfo OnlineAccessInfo?
}

model OnlineAccessInfo {
  id                  String
  expiresIn           Int
  associatedUserScope String
  session             Session?
  associatedUser      AssociatedUser?
}

model AssociatedUser {
  userId      BigInt
  firstName   String
  lastName    String
  email       String
  accountOwner Boolean
  # ...
}
```

Online sessions include the `OnlineAccessInfo` and `AssociatedUser` relations. Offline sessions (used for webhooks and background jobs) have `isOnline: false` and no associated user.

## Token Encryption

Access tokens are encrypted at rest using AES-256-GCM before being written to the database. The encryption key comes from the `ENCRYPTION_KEY` env var (32-byte hex string).

The `isEncrypted()` helper detects plaintext tokens and auto-encrypts them on read — handles any tokens that were stored before encryption was enabled.

Generate a key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Session Validation

Every server action should call `handleSessionToken()` before doing anything else. This validates the current session and refreshes it if expired.

The `/api/session/validate` and `/api/session/refresh` endpoints serve the client-side session check.

## Provider Chain

On the client, session state lives in `useSessionStore` (Zustand). `SessionProvider` initializes it on mount. `ProtectedRoute` watches the store and renders a skeleton while the session is loading:

```tsx
// web/shared/components/auth/ProtectedRoute.tsx
export function ProtectedRoute({ children }) {
  const { isInitialized, hasValidSession, isRefreshing, isThemeExtension } =
    useProtectedSession();

  if (isThemeExtension) return <>{children}</>;
  if (pathname === "/") return <>{children}</>;  // Shopify init route
  if (!isInitialized || isRefreshing || !hasValidSession) {
    return <DashboardSkeleton />;
  }
  return <>{children}</>;
}
```

Theme extension requests bypass session protection — they come from the storefront, not the admin.

## Access Modes

The app is configured for offline access by default (`direct_api_mode = "offline"` in `shopify.app.toml`), which gives a permanent token for background jobs and webhooks. `embedded_app_direct_api_access = true` lets the embedded app call the Admin API directly using the session token from App Bridge.

To support online mode as well (staff-specific permissions), set `isOnline: true` when initializing sessions for admin UI calls.

## Adding OAuth Scopes

Edit `shopify.app.toml`:

```toml
[access_scopes]
scopes = "read_products,write_products,read_orders"
```

Then redeploy and re-install. Shopify will prompt the merchant to re-authorize.
