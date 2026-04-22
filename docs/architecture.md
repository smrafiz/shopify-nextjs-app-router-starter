# Architecture

## Overview

Monorepo with a single Next.js app in `/web`. The Shopify CLI config, Vercel config, and workspace definition live at the root. Everything else — pages, API routes, features, shared code, tests — lives under `/web`.

```
/
├── shopify.app.toml
├── vercel.json
├── pnpm-workspace.yaml
└── web/
    ├── app/              # App Router
    ├── features/         # Feature modules
    ├── shared/           # Cross-feature utilities
    ├── lib/              # Infrastructure
    ├── prisma/           # Schema + migrations
    ├── messages/         # i18n files
    └── tests/            # Test infrastructure
```

## App Router Structure

```
web/app/
├── layout.tsx            # Root layout — wraps in Providers + I18nLoader
├── page.tsx              # Root (redirects to /dashboard)
├── dashboard/            # Main app page
├── announcements/        # Announcement management
├── settings/
├── billing/
└── api/
    ├── auth/             # OAuth entry point
    ├── webhooks/         # Single POST handler
    ├── billing/          # Subscription initiation + confirm
    ├── proxy/            # App Proxy routes
    │   ├── products/
    │   ├── analytics/
    │   └── announcements/
    ├── cron/
    │   ├── keep-alive/
    │   └── prune/
    ├── session/
    │   ├── validate/
    │   └── refresh/
    └── upload/
```

## Data Flow

```
Component
  → React Query hook (useQuery / useMutation)
    → Server Action (Zod validation, session check)
      → Service (business logic)
        → Repository (Prisma queries)
          → PostgreSQL

Component
  → useGraphQL() hook
    → executeGraphQLQuery() server action
      → Shopify Admin API (GraphQL)
```

Each layer has a single responsibility. Repositories do not contain business logic. Services do not contain Prisma calls. Server actions are the only public API boundary — they validate input and call services.

## Feature Module Pattern

Every feature in `web/features/<name>/` follows the same structure:

```
features/<name>/
├── actions/       # "use server" — validation, session check, call service
├── api/           # React Query keys + query/mutation definitions
├── components/    # UI components (may import from shared/)
├── hooks/         # Composed hooks combining queries + store state
├── repositories/  # Prisma queries only, typed return shapes
├── services/      # Pure business logic — no Prisma, no HTTP
├── stores/        # Zustand store (feature-scoped UI state)
├── types/         # TypeScript interfaces
├── constants/     # Enums, string constants
└── validation/    # Zod schemas used by actions + forms
```

The `announcements` feature is a reference implementation. Copy it when adding a new feature.

## Provider Chain

```tsx
// web/shared/components/Providers.tsx
<AppProvider apiKey={apiKey}>           // App Bridge v4
  <TanstackProvider>                   // React Query client
    <SessionProvider>                  // Token init via Zustand
      <ProtectedRoute>                 // Auth guard
        {children}
      </ProtectedRoute>
    </SessionProvider>
  </TanstackProvider>
</AppProvider>
```

Order matters. App Bridge must wrap everything else because `useAppBridge()` is required to get the id token for GraphQL calls and session validation. `SessionProvider` reads from `useSessionStore` (Zustand); `ProtectedRoute` shows a skeleton while the session initializes.

## Shared Code (`web/shared/`)

```
shared/
├── components/      # Polaris-based UI (layout, loading, auth guards)
│   └── providers/   # TanstackProvider, SessionProvider
├── hooks/
│   ├── data/        # useGraphQL, useGraphQLMutation
│   └── session/     # useProtectedSession
├── stores/          # Global Zustand stores
│   ├── useSessionStore
│   ├── useShopStore
│   ├── useModalStore
│   └── useBannerStore
├── repositories/    # prisma-connect (shared Prisma client)
├── types/           # Cross-feature TypeScript types
├── utils/           # Shared utilities
└── constants/       # ROUTES, SHOPIFY_API_VERSION, plans, UI constants
```

## Infrastructure (`web/lib/`)

```
lib/
├── shopify/
│   ├── config/      # initialize-context.ts — Shopify API client singleton
│   └── webhooks/    # handlers.ts, gdpr.ts, register.ts
├── graphql/
│   ├── schema/      # .graphql operation files
│   └── generated/   # codegen output (committed)
├── i18n/
│   ├── provider.tsx # I18nProvider + useTranslations + useLocale
│   ├── server.ts    # getTranslations() for server components
│   ├── translate.ts # translateLabels() via MyMemory API
│   └── direction.ts # RTL locale detection
└── security/
    ├── shop.ts      # detectShop() from request
    └── headers.ts   # addSecurityHeaders() for middleware
```

## Middleware

`web/middleware.ts` runs on all non-API, non-static routes. It:

1. Redirects `/` to `/dashboard`
2. Extracts the shop domain from the request
3. Skips theme extension requests (iframe, Shopify admin referers)
4. Calls `addSecurityHeaders()` to set CSP with per-shop `frame-ancestors`
5. Sets the `NEXT_LOCALE` cookie if a `?locale=` param is present

## Path Aliases

Defined in `web/tsconfig.json` and mirrored in `web/jest.config.ts`:

```
@/*          → /web/*
@/lib/*      → /web/lib/*
@/features/* → /web/features/*
@/shared/*   → /web/shared/*
@/prisma/*   → /web/prisma/*
@/security/* → /web/lib/security/*
```
