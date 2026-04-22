# Shopify Next.js App Router Starter

A production-ready monorepo starter for embedded Shopify apps. Not a toy template — it ships with OAuth, encrypted session storage, webhook idempotency, per-request CSP, i18n, GraphQL codegen, a full test harness, and Vercel cron jobs all pre-wired. You write your features; the plumbing is already done.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.4 (App Router), React 19 |
| Language | TypeScript 5 strict mode |
| Database | PostgreSQL via Prisma 7 + Neon serverless adapter |
| Shopify | `@shopify/shopify-api` v13, `@shopify/app-bridge-react` v4 |
| State | Zustand v5 + Immer (feature + global stores) |
| Server state | TanStack Query v5 |
| Forms | React Hook Form v7 + Zod v4 |
| UI | Shopify Polaris + Tailwind CSS v4 |
| Testing | Jest + React Testing Library + jest-mock-extended |
| Deployment | Vercel with cron jobs |
| Package manager | pnpm (workspaces) |

## Quick Start

```bash
# Clone and install
git clone https://github.com/your-org/shopify-nextjs-app-router-starter.git
cd shopify-nextjs-app-router-starter
pnpm install

# Configure environment
cp web/.env.example web/.env
# Edit web/.env — see Environment Variables below

# Set up the database
cd web
pnpm migrate

# Generate GraphQL types
pnpm graphql-codegen

# Start the dev server
pnpm dev
```

Then in a separate terminal:

```bash
shopify app dev
```

## Environment Variables

```env
SHOPIFY_API_KEY=              # from Partner Dashboard
SHOPIFY_API_SECRET=           # from Partner Dashboard
SCOPES=read_products          # comma-separated OAuth scopes
HOST=                         # your tunnel URL (e.g. https://xxx.trycloudflare.com)
DATABASE_URL=                 # PostgreSQL connection string
ENCRYPTION_KEY=               # 32-byte hex for AES-256-GCM token encryption
CRON_SECRET=                  # min 16 chars — authenticates Vercel cron requests
NEXT_PUBLIC_SHOPIFY_API_KEY=  # same as SHOPIFY_API_KEY (exposed to client)
NEXT_PUBLIC_HOST=             # same as HOST (exposed to client)
```

Generate a valid `ENCRYPTION_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The app throws at startup if `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `ENCRYPTION_KEY`, or `CRON_SECRET` are missing or invalid.

## Repository Layout

```
/
├── shopify.app.toml         # Shopify CLI config (proxy, webhooks, scopes)
├── vercel.json              # Build output + cron schedule
├── pnpm-workspace.yaml
└── web/                     # Next.js application
    ├── app/
    │   ├── api/
    │   │   ├── auth/        # OAuth entry + redirect
    │   │   ├── webhooks/    # Single webhook entry point
    │   │   ├── billing/     # Subscription initiation + confirm
    │   │   ├── proxy/       # App Proxy (products, analytics, announcements)
    │   │   ├── cron/        # keep-alive + WebhookDelivery prune
    │   │   ├── session/     # validate + refresh endpoints
    │   │   └── upload/      # File upload to Shopify Files API
    │   ├── dashboard/
    │   ├── announcements/
    │   ├── settings/
    │   └── billing/
    ├── features/            # Feature modules (self-contained)
    ├── shared/              # Cross-feature: components, hooks, stores, utils
    ├── lib/                 # Infrastructure: shopify, graphql, i18n, security
    ├── prisma/              # Schema, migrations, generated client
    ├── messages/            # i18n JSON (en.json, fr.json)
    └── tests/               # Jest setup, mocks, test utilities
```

## What's Included

**Authentication** — Shopify OAuth with sessions stored in PostgreSQL. Access tokens encrypted at rest with AES-256-GCM. `ProtectedRoute` component guards all client routes. [→ docs/authentication.md](docs/authentication.md)

**Database** — Prisma 7 + Neon serverless. Models for sessions, shops, app settings, billing plans, webhook idempotency, and announcements. [→ docs/database.md](docs/database.md)

**Webhooks** — Single handler at `/api/webhooks` with cold-start recovery and `WebhookDelivery` deduplication by `X-Shopify-Webhook-Id`. GDPR handlers included. [→ docs/webhooks.md](docs/webhooks.md)

**Security** — Per-request CSP with `frame-ancestors` scoped to the installing shop. In-memory rate limiting (100 req/min per shop) on proxy routes. Startup env validation. [→ docs/security.md](docs/security.md)

**GraphQL** — Codegen from Shopify Admin API 2025-10. `useGraphQL()` and `useGraphQLMutation()` hooks handle App Bridge token injection and React Query caching automatically. [→ docs/graphql.md](docs/graphql.md)

**i18n** — Custom, no external library. Server and client APIs. Dot-notation namespace lookups, `{param}` interpolation, RTL detection, and MyMemory API integration for dynamic label translation. 40+ locale mappings. [→ docs/i18n.md](docs/i18n.md)

**Caching** — `dynamicIO` enabled. Custom `cacheLife` profiles (`dashboard`, `dashboard-long`). Per-shop tag invalidation prevents cross-tenant cache pollution. [→ docs/caching.md](docs/caching.md)

**Testing** — Jest + ts-jest for ESM. Deep Prisma mock via jest-mock-extended. `ShopifyGraphQLMock` for operation-level mocking. Custom `render()` with QueryClientProvider. [→ docs/testing.md](docs/testing.md)

**Deployment** — Vercel-native. Cron jobs for function keep-alive (every 5 min) and WebhookDelivery pruning (daily at 2am). [→ docs/deployment.md](docs/deployment.md)

## Feature Module Pattern

Each feature under `web/features/<name>/` is self-contained with consistent internal layers:

```
features/<name>/
├── actions/       # Next.js server actions (API boundary, Zod validation)
├── api/           # React Query keys, queries, mutations
├── components/    # Feature UI
├── hooks/         # Composed hooks (React Query + store)
├── repositories/  # Prisma data access only
├── services/      # Business logic (no I/O)
├── stores/        # Zustand UI state
├── types/         # TypeScript interfaces
├── constants/     # Feature constants
└── validation/    # Zod schemas
```

Data flows one direction:

```
Component → React Query hook → Server Action → Service → Repository → Prisma → PostgreSQL
```

The `announcements` feature is a working reference implementation.

## Provider Chain

```
AppProvider (App Bridge v4)
  └─ TanstackProvider (React Query client)
       └─ SessionProvider (token init)
            └─ ProtectedRoute (auth guard)
                 └─ {your page}
```

## Commands

```bash
# from /web
pnpm dev                # Next.js dev server
pnpm build              # graphql-codegen then next build
pnpm test               # Jest
pnpm test:watch         # Jest watch mode
pnpm test:coverage      # Jest with coverage

pnpm migrate            # prisma migrate dev
pnpm prisma:push        # push schema without migration history
pnpm prisma:studio      # Prisma Studio

pnpm graphql-codegen    # regenerate types from Admin API schema
```

## Path Aliases

```
@/*          → /web/*
@/lib/*      → /web/lib/*
@/features/* → /web/features/*
@/shared/*   → /web/shared/*
@/prisma/*   → /web/prisma/*
@/security/* → /web/lib/security/*
```

## Docs

- [Architecture](docs/architecture.md)
- [Authentication](docs/authentication.md)
- [Database](docs/database.md)
- [i18n](docs/i18n.md)
- [Security](docs/security.md)
- [GraphQL](docs/graphql.md)
- [Webhooks](docs/webhooks.md)
- [Caching](docs/caching.md)
- [Testing](docs/testing.md)
- [Deployment](docs/deployment.md)

## License

MIT
