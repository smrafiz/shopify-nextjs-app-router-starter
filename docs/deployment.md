# Deployment

## Vercel

The app deploys to Vercel. The `vercel.json` at the repo root configures the build:

```json
{
  "buildCommand": "cd web && pnpm build",
  "outputDirectory": "web/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "crons": [
    { "path": "/api/cron/keep-alive", "schedule": "*/5 * * * *" },
    { "path": "/api/cron/prune", "schedule": "0 2 * * *" }
  ]
}
```

The build runs `pnpm graphql-codegen` before `next build` via the `prebuild` script. Generated GraphQL types are committed, so codegen only re-runs if you modify `.graphql` files.

## Environment Variables

Set all of these in your Vercel project settings under Settings → Environment Variables:

| Variable | Required | Notes |
|---|---|---|
| `SHOPIFY_API_KEY` | yes | from Partner Dashboard |
| `SHOPIFY_API_SECRET` | yes | from Partner Dashboard |
| `SCOPES` | yes | e.g. `read_products,write_products` |
| `HOST` | yes | your production Vercel URL |
| `DATABASE_URL` | yes | Neon connection string (use pooled endpoint) |
| `ENCRYPTION_KEY` | yes | 32-byte hex, generate once and never rotate unless migrating tokens |
| `CRON_SECRET` | yes | min 16 chars, Vercel sends this automatically for cron routes |
| `NEXT_PUBLIC_SHOPIFY_API_KEY` | yes | same as `SHOPIFY_API_KEY` |
| `NEXT_PUBLIC_HOST` | yes | same as `HOST` |

The app throws at startup if `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `ENCRYPTION_KEY`, or `CRON_SECRET` are missing or invalid. A bad deployment will fail fast rather than silently misbehave.

## Cron Jobs

Two cron jobs run automatically on Vercel:

**`/api/cron/keep-alive`** — runs every 5 minutes. Prevents Vercel serverless functions from going cold. Without this, the first request after idle time takes longer and may cause webhook processing delays.

**`/api/cron/prune`** — runs daily at 2am UTC. Deletes `WebhookDelivery` records older than 7 days. Without pruning, the table grows indefinitely.

Both endpoints require `Authorization: Bearer <CRON_SECRET>`. Vercel sets this automatically when `CRON_SECRET` is in your environment. Direct HTTP calls without the header get a 401.

## Database Provisioning

The starter is configured for [Neon](https://neon.tech). Set up a project:

1. Create a Neon project
2. Copy the connection string (use the **pooled** endpoint for production)
3. Set `DATABASE_URL` in Vercel

Run migrations via Vercel's Build & Development Settings or manually:

```bash
# One-time after deploy
DATABASE_URL=<your-neon-url> cd web && pnpm migrate
```

For production, use `prisma migrate deploy` instead of `migrate dev`:

```bash
DATABASE_URL=<your-neon-url> pnpx prisma migrate deploy
```

`migrate deploy` applies pending migrations without interactive prompts and doesn't create new migration files.

## Shopify App Setup

After deploying:

1. Update `application_url` in `shopify.app.toml` to your production URL
2. Run `shopify app deploy` to push config and register webhooks
3. Install the app on a development store via the Partner Dashboard

For each deploy that changes scopes or webhook topics, run `shopify app deploy` again. The CLI will update the app configuration automatically.

## Allowed Dev Origins

`next.config.js` includes:

```js
allowedDevOrigins: ["*.trycloudflare.com"],
```

This allows the Shopify CLI's Cloudflare tunnel to connect during local development. Remove or restrict this in production if you're not using Cloudflare tunnels.

## Production Checklist

- [ ] All env vars set in Vercel
- [ ] `HOST` and `NEXT_PUBLIC_HOST` point to production URL
- [ ] `shopify.app.toml` `application_url` updated
- [ ] `shopify app deploy` run after config changes
- [ ] Database migrations applied (`prisma migrate deploy`)
- [ ] GDPR webhook handlers implemented (not just logging)
- [ ] `ENCRYPTION_KEY` generated and securely stored
- [ ] `CRON_SECRET` is at least 16 characters
