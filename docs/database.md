# Database

## Setup

The app uses PostgreSQL via Prisma 7 with the Neon serverless adapter (`@prisma/adapter-pg`). The generated client outputs to `web/prisma/generated/` (not the default location — adjust imports accordingly).

```bash
# Run migrations
cd web && pnpm migrate

# Push schema changes without creating a migration file
pnpm prisma:push

# Open Prisma Studio
pnpm prisma:studio

# Create a named migration
pnpm prisma:migrate add-product-table
```

The Prisma client is a singleton at `web/shared/repositories/prisma-connect.ts`. Import it as:

```ts
import prisma from "@/shared/repositories/prisma-connect";
```

## Schema Models

### Session Models (Shopify OAuth)

**`Session`** — Stores Shopify OAuth sessions. `accessToken` is AES-256-GCM encrypted. `apiKey` scopes sessions per app when sharing a database.

**`OnlineAccessInfo`** — Linked to `Session` for online tokens. Stores expiry and the authorized scopes for the associated staff user.

**`AssociatedUser`** — Staff member linked to an online session (userId, name, email, accountOwner flag).

### App Models

**`Shop`** — One record per installing store. Tracks setup progress, webhook registration status, billing state, and cached locale data.

```prisma
model Shop {
  domain               String    @unique
  status               ShopStatus  @default(ACTIVE)
  setupComplete        Boolean   @default(false)
  webhooksRegistered   Boolean   @default(false)
  locales              Json?     # CachedLocale[] with 24hr TTL
  primaryLocale        String?
  # ...
  @@index([domain, setupComplete])
}
```

**`AppSettings`** — Per-shop app configuration. One-to-one with `Shop`. Stores discount defaults, display flags, label overrides (`labelsJson`), global styles (`globalStylesJson`), and custom CSS.

**`ShopPlan`** — Billing plan tracking. Links to Shopify subscription via `billingId`. Tracks trial state, current period, and cancellation.

### Infrastructure Models

**`WebhookDelivery`** — Idempotency table. Stores `X-Shopify-Webhook-Id` values to prevent duplicate processing. Records are pruned after 7 days by the cron job.

```prisma
model WebhookDelivery {
  id          String   @id    # the X-Shopify-Webhook-Id value
  topic       String
  shop        String
  processedAt DateTime @default(now())
  @@index([shop, processedAt])
}
```

**`Announcement`** — Demo feature. Storefront announcement banners with type, color, schedule, and active flag. Served via App Proxy.

## Enums

| Enum | Values |
|---|---|
| `ShopStatus` | ACTIVE, SUSPENDED, UNINSTALLED |
| `PlanName` | FREE, PRO |
| `ShopifySubscriptionStatus` | ACTIVE, CANCELLED, DECLINED, EXPIRED, FROZEN, PENDING |
| `BillingInterval` | EVERY_30_DAYS, ANNUAL |
| `AnnouncementType` | INFO, WARNING, PROMO, URGENT |

## Adding a Model

1. Add the model to `web/prisma/schema.prisma`
2. Run `pnpm migrate` to create and apply the migration
3. Create a repository file in your feature: `features/<name>/repositories/<name>.repository.ts`
4. Import and call from your service layer — never from components or server actions directly

```ts
// features/products/repositories/product.repository.ts
import prisma from "@/shared/repositories/prisma-connect";

export async function findProductsByShop(shopId: string) {
  return prisma.product.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
  });
}
```

## Neon Configuration

The Neon serverless adapter runs over HTTP/WebSocket, which means it works in Vercel Edge and serverless environments without maintaining a persistent connection pool. The `DATABASE_URL` should be a Neon connection string (pooled endpoint recommended for production).

For local development you can use any PostgreSQL instance — Neon's free tier, Docker, or a local install.
