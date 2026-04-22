# Webhooks

## Handler Entry Point

All webhook topics route through a single POST handler at `/api/webhooks/route.ts`. The Shopify CLI config registers subscriptions pointing here:

```toml
# shopify.app.toml
[[webhooks.subscriptions]]
topics = ["app/uninstalled"]
uri = "/api/webhooks"

[[webhooks.subscriptions]]
compliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]
uri = "/api/webhooks"
```

HMAC validation is handled by `shopify.webhooks.process()` from `@shopify/shopify-api`. You don't need to validate signatures manually.

## Idempotency

Shopify may deliver the same webhook more than once. The `WebhookDelivery` table prevents duplicate processing:

```ts
// Check before processing
const existing = await prisma.webhookDelivery.findUnique({ where: { id: webhookId } });
if (existing) return new Response(null, { status: 200 });

// Record after successful processing
prisma.webhookDelivery.create({ data: { id: webhookId, topic, shop } }).catch(() => {});
```

The `id` field is the `X-Shopify-Webhook-Id` header value. Records older than 7 days are pruned by the `/api/cron/prune` job.

## Cold-Start Recovery

Vercel serverless functions can lose in-memory state between requests. If a webhook arrives after a cold start, the topic handlers may not be registered yet. A module-level Promise lock handles this:

```ts
let handlerInitPromise: Promise<void> | null = null;

function ensureHandlers(topic: string): Promise<void> {
  const handlers = shopify.webhooks.getHandlers(topic);
  if (handlers && handlers.length > 0) return Promise.resolve();

  if (!handlerInitPromise) {
    handlerInitPromise = Promise.resolve().then(() => addHandlers());
  }
  return handlerInitPromise;
}
```

This ensures `addHandlers()` is only called once even if multiple webhooks arrive concurrently during initialization.

## Adding a Topic Handler

Add your handler in `web/lib/shopify/webhooks/handlers.ts`:

```ts
import shopify from "../config/initialize-context";
import { DeliveryMethod } from "@shopify/shopify-api";

export function addHandlers(): void {
  shopify.webhooks.addHandlers({
    PRODUCTS_UPDATE: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/api/webhooks",
      callback: async (topic, shop, body) => {
        const payload = JSON.parse(body);
        // handle product update
      },
    },
  });
}
```

Then register the topic in `shopify.app.toml` and redeploy.

## GDPR Handlers

GDPR compliance webhooks are set up in `web/lib/shopify/webhooks/gdpr.ts`. The three required topics are:

- **`customers/data_request`** — a customer requested their data. Log the request.
- **`customers/redact`** — a customer requested deletion. Delete their data.
- **`shop/redact`** — a shop uninstalled and was deleted. Delete all shop data.

The starter logs the payloads. Replace these stubs with real data handling before submitting to the Shopify App Store:

```ts
CUSTOMERS_REDACT: {
  callback: async (_topic, shop, body) => {
    const { customer } = JSON.parse(body);
    await deleteCustomerData(shop, customer.id);
  },
},
```

## Webhook Registration

`web/lib/shopify/webhooks/register.ts` exports a `registerWebhooks(session)` function that calls the Shopify API to ensure all subscriptions are active. Call this after OAuth completes to register webhooks for new installs.

The `Shop.webhooksRegistered` flag tracks whether registration has been done for a given store.
