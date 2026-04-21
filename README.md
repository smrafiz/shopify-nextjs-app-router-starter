# shopify-nextjs-app-router-starter

A production-ready starter for Shopify embedded apps.

**Stack:** Next.js 16 · React 19 · Prisma 7 · PostgreSQL · Zustand · React Query · Shopify Polaris · TypeScript · bun

## Features

- Shopify embedded app with token exchange auth (no OAuth redirect needed)
- Webhook handling with HMAC validation + idempotency (WebhookDelivery dedup)
- GraphQL client with retry (429/502/503/504) + 401 token refresh
- GDPR compliance handlers (customers/data_request, customers/redact, shop/redact)
- 10-layer feature architecture (actions → api → components → hooks → repositories → services → stores → types → validation → constants)
- Demo feature: Announcement Banner (admin CRUD + storefront widget via App Proxy)

## Getting Started

```bash
# 1. Clone and install
git clone https://github.com/your-org/shopify-nextjs-app-router-starter
cd shopify-nextjs-app-router-starter
bun install

# 2. Configure environment
cp .env.example .env
# Fill in SHOPIFY_API_KEY, SHOPIFY_API_SECRET, DATABASE_URL

# 3. Migrate database
cd web && bun run migrate

# 4. Start dev server
cd .. && bun run dev
```

## Architecture

### Feature Module Pattern

Each feature lives in `web/features/<name>/` and follows the same 10-layer structure:

```
features/<name>/
├── actions/      # Server Actions (API boundary, Zod validation)
├── api/          # React Query keys, queries, mutations
├── components/   # Feature UI components
├── hooks/        # Composed hooks (combine RQ + store)
├── repositories/ # Prisma data access (no business logic)
├── services/     # Business logic (pure functions, no I/O)
├── stores/       # Zustand UI state
├── types/        # TypeScript interfaces
├── validation/   # Zod schemas
└── index.ts      # Barrel export
```

### Data Flow

```
Component → React Query hook → Server Action → Service → Repository → Prisma → PostgreSQL
                                                    ↓
                                          Shopify Admin API (GraphQL)
```

### Adding a New Feature

1. Copy `web/features/announcements/` as a template
2. Replace `Announcement` / `announcement` with your entity name
3. Update `web/prisma/schema.prisma` with your model
4. Run `bun run migrate`
5. Add your route in `web/app/(dashboard)/`

## Commands

```bash
bun run dev              # Start dev server (Shopify CLI)
bun run build:widgets    # Build widget TS → extension assets (one-shot)
bun run dev:widgets      # Watch-build widget TS → extension assets
cd web && bun run migrate      # Run DB migrations
cd web && bun test             # Run unit tests
cd web && bunx tsc --noEmit    # Type check
```
