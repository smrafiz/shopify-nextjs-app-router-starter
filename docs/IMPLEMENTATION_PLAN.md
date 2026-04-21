# Shopify Next.js App Router Starter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the infrastructure from `radius-product-bundles` and create a standalone Shopify embedded app starter at `/Users/radiustheme/Shopify/shopify-nextjs-app-router-starter` with an Announcement Banner as the demo feature.

**Architecture:** Next.js 16 App Router + React 19 + Prisma 7 (PostgreSQL) + Zustand + React Query + Polaris. Feature-based module system with 10-layer pattern (actions → api → components → hooks → repositories → services → stores → types → validation → constants). Single demo feature (announcements) demonstrates the full stack end-to-end.

**Tech Stack:** Next.js 16, React 19, @shopify/shopify-api 13, Prisma 7 (pg adapter), Zustand 5, @tanstack/react-query 5, react-hook-form 7, zod 4, Tailwind CSS 4, Polaris Web Components, bun

---

## File Map

```
shopify-nextjs-app-router-starter/
├── package.json                          # Root: shopify CLI scripts
├── shopify.app.toml                      # Shopify app config
├── .env.example                          # Required env vars
├── web/
│   ├── package.json                      # App deps
│   ├── next.config.js                    # Next.js config (security headers, allowed origins)
│   ├── tsconfig.json                     # Strict TS + path aliases
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (Polaris + App Bridge scripts)
│   │   ├── page.tsx                      # Root redirect to /dashboard
│   │   ├── globals.css
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                # Dashboard shell
│   │   │   ├── page.tsx                  # Home/dashboard
│   │   │   └── announcements/
│   │   │       └── page.tsx              # Announcements admin page
│   │   └── api/
│   │       ├── auth/route.ts             # Auth redirect to embedded URL
│   │       ├── webhooks/route.ts         # Webhook handler (idempotency + HMAC)
│   │       └── proxy/
│   │           └── announcements/route.ts # App Proxy: active announcement for storefront
│   ├── lib/
│   │   ├── index.ts                      # Re-exports executeGraphQL*
│   │   ├── shopify/
│   │   │   ├── config/
│   │   │   │   └── initialize-context.ts # shopifyApi() singleton
│   │   │   ├── auth/
│   │   │   │   └── verify.ts             # handleSessionToken, tokenExchange, verifyRequest
│   │   │   ├── webhooks/
│   │   │   │   ├── handlers.ts           # app/uninstalled + GDPR handlers
│   │   │   │   ├── register.ts           # registerWebhooks + addHandlers
│   │   │   │   └── gdpr.ts               # setupGDPRWebHooks helper
│   │   │   └── index.ts                  # Re-exports
│   │   └── graphql/
│   │       └── client/
│   │           └── server-action.ts      # executeGraphQLQuery / Mutation with retry
│   ├── features/
│   │   └── announcements/
│   │       ├── actions/
│   │       │   ├── announcement-read.actions.ts
│   │       │   ├── announcement-write.actions.ts
│   │       │   └── index.ts
│   │       ├── api/
│   │       │   ├── announcement-keys.ts
│   │       │   ├── announcement-queries.ts
│   │       │   ├── announcement-mutations.ts
│   │       │   └── index.ts
│   │       ├── components/
│   │       │   ├── AnnouncementList.tsx
│   │       │   ├── AnnouncementForm.tsx
│   │       │   ├── AnnouncementCard.tsx
│   │       │   └── index.ts
│   │       ├── hooks/
│   │       │   ├── use-announcements.ts
│   │       │   └── index.ts
│   │       ├── repositories/
│   │       │   ├── announcement.repository.ts
│   │       │   └── index.ts
│   │       ├── services/
│   │       │   ├── announcement.service.ts
│   │       │   └── index.ts
│   │       ├── stores/
│   │       │   ├── announcement.store.ts
│   │       │   └── index.ts
│   │       ├── types/
│   │       │   ├── announcement.types.ts
│   │       │   └── index.ts
│   │       ├── validation/
│   │       │   ├── announcement.zod.ts
│   │       │   └── index.ts
│   │       └── index.ts
│   ├── shared/
│   │   ├── repositories/
│   │   │   ├── prisma-connect.ts         # Prisma pg pool client (singleton)
│   │   │   ├── session.repository.ts     # findOfflineSessionByShop, storeSession
│   │   │   ├── shop.repository.ts        # upsertShop, getShopSetupStatus, markSetupComplete
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── action-response.types.ts  # ActionResponse<T> type
│   │   │   ├── graphql.types.ts          # GraphQLRequest, GraphQLResponse
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── domain.utils.ts           # normalizeShopDomain, isValidShopDomain
│   │   │   ├── session.utils.ts          # extractBearerToken, isSessionExpired
│   │   │   └── index.ts
│   │   ├── components/
│   │   │   ├── Providers.tsx             # React Query + AppBridgeProvider
│   │   │   ├── AppLayout.tsx             # Polaris app layout shell + nav
│   │   │   └── index.ts
│   │   └── constants/
│   │       ├── index.ts                  # SHOPIFY_API_VERSION etc.
│   │       └── routes.ts                 # ROUTES.DASHBOARD, ROUTES.ANNOUNCEMENTS
│   ├── widgets/
│   │   ├── vite.config.ts                # Vite build: TS/SCSS → extension assets
│   │   ├── postcss.config.mjs            # Tailwind + autoprefixer
│   │   └── src/
│   │       └── announcement-widget.ts    # Widget source (compiled to extension/assets/)
│   ├── prisma/
│   │   └── schema.prisma                 # Session + WebhookDelivery + Shop + Announcement
│   └── tests/
│       └── announcement.service.test.ts  # Unit tests for announcement service
└── extension/
    └── extensions/
        └── announcement-widget/
            ├── shopify.extension.toml
            ├── blocks/
            │   └── announcement-banner.liquid
            ├── assets/                   # Vite output (gitignored, built from web/widgets/src/)
            │   ├── announcement-widget.js
            │   └── announcement-widget.css
            └── locales/
                └── en.default.json
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `shopify-nextjs-app-router-starter/package.json`
- Create: `shopify-nextjs-app-router-starter/.env.example`
- Create: `shopify-nextjs-app-router-starter/web/package.json`
- Create: `shopify-nextjs-app-router-starter/web/tsconfig.json`
- Create: `shopify-nextjs-app-router-starter/web/next.config.js`

- [ ] **Step 1: Create root package.json**

```json
// shopify-nextjs-app-router-starter/package.json
{
  "name": "shopify-nextjs-app-router-starter",
  "version": "0.1.0",
  "license": "MIT",
  "scripts": {
    "dev": "shopify app dev",
    "build": "shopify app build",
    "deploy": "shopify app deploy",
    "info": "shopify app info"
  },
  "keywords": ["shopify", "nextjs", "polaris", "prisma", "starter"]
}
```

- [ ] **Step 2: Create .env.example**

```bash
# shopify-nextjs-app-router-starter/.env.example
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SCOPES=read_products
HOST=https://your-tunnel-url.trycloudflare.com
DATABASE_URL=postgresql://user:password@localhost:5432/shopify_starter
```

- [ ] **Step 3: Create web/package.json**

```json
// shopify-nextjs-app-router-starter/web/package.json
{
  "name": "shopify-starter-web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "migrate": "prisma migrate dev",
    "postinstall": "prisma generate",
    "prisma:push": "bunx prisma db push",
    "prisma:studio": "bunx prisma studio",
    "prisma:migrate": "bunx prisma migrate dev --name",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "graphql-codegen": "graphql-codegen --config codegen.ts"
  },
  "dependencies": {
    "@graphql-typed-document-node/core": "^3.2.0",
    "@hookform/resolvers": "^5.2.2",
    "@prisma/adapter-pg": "^7.7.0",
    "@prisma/client": "^7.7.0",
    "@shopify/app-bridge-react": "^4.2.10",
    "@shopify/shopify-api": "^13.0.0",
    "@tanstack/react-query": "^5.99.2",
    "@tanstack/react-query-devtools": "^5.99.2",
    "graphql-request": "^7.4.0",
    "isomorphic-dompurify": "^3.9.0",
    "next": "16.2.4",
    "pg": "^8.20.0",
    "prisma": "^7.7.0",
    "react": "19.2.5",
    "react-dom": "19.2.5",
    "react-hook-form": "^7.73.1",
    "zod": "^4.3.6",
    "zustand": "^5.0.12"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.2.3",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/jest": "^30.0.0",
    "@types/node": "^25.6.0",
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.3",
    "autoprefixer": "^10.5.0",
    "jest": "^30.3.0",
    "jest-mock-extended": "^4.0.1",
    "postcss": "^8.5.10",
    "prettier": "^3.8.3",
    "tailwindcss": "^4.2.3",
    "ts-jest": "^29.4.9",
    "typescript": "^6.0.3"
  }
}
```

- [ ] **Step 4: Create web/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@/lib/*": ["./lib/*"],
      "@/features/*": ["./features/*"],
      "@/shared/*": ["./shared/*"],
      "@/prisma/*": ["./prisma/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Create web/next.config.js**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["*.trycloudflare.com"],
  reactStrictMode: true,
  devIndicators: false,
  compress: true,
  poweredByHeader: false,
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
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
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
```

- [ ] **Step 6: Commit**

```bash
cd /Users/radiustheme/Shopify/shopify-nextjs-app-router-starter
git init
git add package.json .env.example web/package.json web/tsconfig.json web/next.config.js
git commit -m "chore: project scaffold"
```

---

## Task 2: Prisma Schema

**Files:**
- Create: `web/prisma/schema.prisma`

- [ ] **Step 1: Write schema**

```prisma
// web/prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "./generated"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ──────────────────────────────────────
// Shopify Session Storage
// ──────────────────────────────────────

model Session {
  id               String            @id @default(uuid())
  accessToken      String?
  expires          DateTime?
  isOnline         Boolean
  scope            String?
  shop             String
  state            String
  apiKey           String
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  onlineAccessInfo OnlineAccessInfo?

  @@map("sessions")
}

model OnlineAccessInfo {
  id                  String          @id @default(uuid())
  sessionId           String?         @unique
  expiresIn           Int
  associatedUserScope String
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  associatedUser      AssociatedUser?
  session             Session?        @relation(fields: [sessionId], references: [id])

  @@map("online_access_infos")
}

model AssociatedUser {
  id                 String            @id @default(uuid())
  onlineAccessInfoId String?           @unique
  userId             BigInt
  firstName          String
  lastName           String
  email              String
  accountOwner       Boolean
  locale             String
  collaborator       Boolean
  emailVerified      Boolean
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
  onlineAccessInfo   OnlineAccessInfo? @relation(fields: [onlineAccessInfoId], references: [id])

  @@map("associated_users")
}

// ──────────────────────────────────────
// App Infrastructure
// ──────────────────────────────────────

model Shop {
  id                 String    @id @default(cuid())
  domain             String    @unique
  setupComplete      Boolean   @default(false)
  webhooksRegistered Boolean   @default(false)
  lastSetupCheck     DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  announcements Announcement[]

  @@index([domain, setupComplete])
  @@map("shops")
}

model WebhookDelivery {
  id          String   @id
  topic       String
  shop        String
  processedAt DateTime @default(now())

  @@index([shop, processedAt])
  @@map("webhook_deliveries")
}

// ──────────────────────────────────────
// Feature: Announcements
// ──────────────────────────────────────

model Announcement {
  id        String           @id @default(cuid())
  shopId    String
  title     String
  message   String
  type      AnnouncementType @default(INFO)
  isActive  Boolean          @default(false)
  bgColor   String           @default("#1a1a1a")
  textColor String           @default("#ffffff")
  startsAt  DateTime?
  endsAt    DateTime?
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  shop Shop @relation(fields: [shopId], references: [id], onDelete: Cascade)

  @@index([shopId, isActive])
  @@map("announcements")
}

enum AnnouncementType {
  INFO
  WARNING
  PROMO
  URGENT
}
```

- [ ] **Step 2: Verify schema parses**

```bash
cd /Users/radiustheme/Shopify/shopify-nextjs-app-router-starter/web
bunx prisma validate
```
Expected: `The schema at prisma/schema.prisma is valid`

- [ ] **Step 3: Commit**

```bash
git add web/prisma/schema.prisma
git commit -m "feat: prisma schema (sessions + shop + announcements)"
```

---

## Task 3: DB Connection + Shopify Config

**Files:**
- Create: `web/shared/repositories/prisma-connect.ts`
- Create: `web/lib/shopify/config/initialize-context.ts`
- Create: `web/shared/constants/index.ts`

- [ ] **Step 1: Create prisma-connect.ts**

```typescript
// web/shared/repositories/prisma-connect.ts
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/prisma/generated/client";

const MAX_POOL_SIZE = parseInt(process.env.DB_POOL_SIZE ?? "5", 10);

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({
    connectionString,
    max: MAX_POOL_SIZE,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    keepAlive: true,
  });

  pool.on("error", (err) => {
    console.error("[DB Pool] Idle client error:", err.message);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

- [ ] **Step 2: Create constants**

```typescript
// web/shared/constants/index.ts
export const SHOPIFY_API_VERSION = "2025-10";

export const ROUTES = {
  DASHBOARD: "/",
  ANNOUNCEMENTS: "/announcements",
} as const;
```

- [ ] **Step 3: Create initialize-context.ts**

```typescript
// web/lib/shopify/config/initialize-context.ts
import "@shopify/shopify-api/adapters/web-api";
import { SHOPIFY_API_VERSION } from "@/shared/constants";
import { shopifyApi, LogSeverity } from "@shopify/shopify-api";

const REQUIRED_ENV = ["SHOPIFY_API_KEY", "SHOPIFY_API_SECRET"] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SCOPES?.split(",") || ["read_products"],
  hostName: process.env.HOST?.replace(/https?:\/\//, "") || "",
  hostScheme: "https",
  isEmbeddedApp: true,
  apiVersion: SHOPIFY_API_VERSION,
  logger: {
    level:
      process.env.NODE_ENV === "development"
        ? LogSeverity.Debug
        : LogSeverity.Error,
  },
});

export default shopify;
```

- [ ] **Step 4: Commit**

```bash
git add web/shared/repositories/prisma-connect.ts web/lib/shopify/config/initialize-context.ts web/shared/constants/index.ts
git commit -m "feat: db connection + shopify api config"
```

---

## Task 4: Shared Types + Utils

**Files:**
- Create: `web/shared/types/action-response.types.ts`
- Create: `web/shared/types/graphql.types.ts`
- Create: `web/shared/types/index.ts`
- Create: `web/shared/utils/domain.utils.ts`
- Create: `web/shared/utils/session.utils.ts`
- Create: `web/shared/utils/index.ts`

- [ ] **Step 1: Create action response type**

```typescript
// web/shared/types/action-response.types.ts
export type ActionResponse<T = undefined> =
  | { status: "success"; data: T; message?: string }
  | { status: "error"; message: string; errors?: Record<string, string[]> };
```

- [ ] **Step 2: Create GraphQL types**

```typescript
// web/shared/types/graphql.types.ts
export interface GraphQLRequest {
  query: unknown;
  variables?: Record<string, unknown>;
  sessionToken?: string;
  shop?: string;
  accessToken?: string;
  _retried?: boolean;
  _retryCount?: number;
}

export interface GraphQLError {
  message: string;
  extensions?: { code?: string; timestamp?: string; statusCode?: number };
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}
```

- [ ] **Step 3: Create types barrel**

```typescript
// web/shared/types/index.ts
export * from "./action-response.types";
export * from "./graphql.types";
```

- [ ] **Step 4: Create domain utils**

```typescript
// web/shared/utils/domain.utils.ts
export function normalizeShopDomain(dest: string): string {
  return dest.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}
```

- [ ] **Step 5: Create session utils**

```typescript
// web/shared/utils/session.utils.ts
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export function isSessionExpired(expires: Date | null | undefined): boolean {
  if (!expires) return false;
  return new Date() >= expires;
}
```

- [ ] **Step 6: Create utils barrel**

```typescript
// web/shared/utils/index.ts
export * from "./domain.utils";
export * from "./session.utils";
```

- [ ] **Step 7: Commit**

```bash
git add web/shared/types/ web/shared/utils/
git commit -m "feat: shared types and utils"
```

---

## Task 5: Session + Shop Repositories

**Files:**
- Create: `web/shared/repositories/session.repository.ts`
- Create: `web/shared/repositories/shop.repository.ts`
- Create: `web/shared/repositories/index.ts`

- [ ] **Step 1: Create session repository**

```typescript
// web/shared/repositories/session.repository.ts
import prisma from "./prisma-connect";
import { Session } from "@shopify/shopify-api";

export async function findOfflineSessionByShop(
  shop: string
): Promise<Session | null> {
  const record = await prisma.session.findFirst({
    where: { shop, isOnline: false },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return null;
  return record as unknown as Session;
}

export async function storeSession(session: Session): Promise<void> {
  const apiKey = process.env.SHOPIFY_API_KEY!;
  await prisma.$transaction([
    prisma.session.upsert({
      where: { id: session.id },
      update: {
        accessToken: session.accessToken,
        expires: session.expires,
        scope: session.scope,
        state: session.state ?? "",
        isOnline: session.isOnline,
        apiKey,
      },
      create: {
        id: session.id,
        shop: session.shop,
        accessToken: session.accessToken,
        expires: session.expires,
        isOnline: session.isOnline,
        scope: session.scope,
        state: session.state ?? "",
        apiKey,
      },
    }),
  ]);
}

export async function deleteSessionsByShop(shop: string): Promise<void> {
  await prisma.session.deleteMany({ where: { shop } });
}
```

- [ ] **Step 2: Create shop repository**

```typescript
// web/shared/repositories/shop.repository.ts
import prisma from "./prisma-connect";

export async function upsertShop(domain: string): Promise<void> {
  await prisma.shop.upsert({
    where: { domain },
    update: {},
    create: { domain },
  });
}

export async function getShopSetupStatus(
  domain: string
): Promise<{ setupComplete: boolean; webhooksRegistered: boolean }> {
  const shop = await prisma.shop.findUnique({
    where: { domain },
    select: { setupComplete: true, webhooksRegistered: true },
  });
  return shop ?? { setupComplete: false, webhooksRegistered: false };
}

export async function claimSetupLock(domain: string): Promise<boolean> {
  const now = new Date();
  const lockExpiry = new Date(now.getTime() - 5 * 60 * 1000); // 5 min

  const result = await prisma.shop.updateMany({
    where: {
      domain,
      OR: [
        { lastSetupCheck: null },
        { lastSetupCheck: { lt: lockExpiry } },
      ],
    },
    data: { lastSetupCheck: now },
  });
  return result.count > 0;
}

export async function releaseSetupLock(domain: string): Promise<void> {
  await prisma.shop.update({
    where: { domain },
    data: { lastSetupCheck: null },
  });
}

export async function markSetupComplete(domain: string): Promise<void> {
  await prisma.shop.update({
    where: { domain },
    data: { setupComplete: true },
  });
}

export async function markWebhooksRegistered(domain: string): Promise<void> {
  await prisma.shop.update({
    where: { domain },
    data: { webhooksRegistered: true },
  });
}
```

- [ ] **Step 3: Create repositories barrel**

```typescript
// web/shared/repositories/index.ts
export * from "./session.repository";
export * from "./shop.repository";
export { default as prisma } from "./prisma-connect";
```

- [ ] **Step 4: Commit**

```bash
git add web/shared/repositories/
git commit -m "feat: session and shop repositories"
```

---

## Task 6: Auth + Webhook Infrastructure

**Files:**
- Create: `web/lib/shopify/auth/verify.ts`
- Create: `web/lib/shopify/webhooks/gdpr.ts`
- Create: `web/lib/shopify/webhooks/handlers.ts`
- Create: `web/lib/shopify/webhooks/register.ts`
- Create: `web/lib/shopify/index.ts`
- Create: `web/lib/graphql/client/server-action.ts`
- Create: `web/lib/index.ts`

- [ ] **Step 1: Create verify.ts (auth)**

```typescript
// web/lib/shopify/auth/verify.ts
import { extractBearerToken, isSessionExpired, normalizeShopDomain } from "@/shared/utils";
import {
  findOfflineSessionByShop,
  storeSession,
  upsertShop,
  getShopSetupStatus,
  claimSetupLock,
  releaseSetupLock,
  markSetupComplete,
  markWebhooksRegistered,
} from "@/shared/repositories";
import shopify from "../config/initialize-context";
import { registerWebhooks } from "../webhooks/register";
import { RequestedTokenType, Session } from "@shopify/shopify-api";

export async function verifyRequest(
  req: Request,
  isOnline: boolean
): Promise<{ shop: string; session: Session }> {
  const sessionToken = extractBearerToken(req.headers.get("authorization"));
  if (!sessionToken) throw new Error("No bearer token present");
  return handleSessionToken(sessionToken, isOnline);
}

export async function tokenExchange({
  shop,
  sessionToken,
  online,
  store,
  forceRefresh,
}: {
  shop: string;
  sessionToken: string;
  online?: boolean;
  store?: boolean;
  forceRefresh?: boolean;
}): Promise<Session> {
  if (!online && !forceRefresh) {
    try {
      const existing = await findOfflineSessionByShop(shop);
      if (existing?.accessToken && !isSessionExpired(existing.expires)) {
        return existing;
      }
    } catch {
      // Session doesn't exist yet — will create below
    }
  }

  const { session } = await shopify.auth.tokenExchange({
    shop,
    sessionToken,
    requestedTokenType: online
      ? RequestedTokenType.OnlineAccessToken
      : RequestedTokenType.OfflineAccessToken,
  });

  if (store || forceRefresh) await storeSession(session);
  return session;
}

export async function handleSessionToken(
  sessionToken: string,
  online?: boolean,
  store?: boolean,
  forceRefresh?: boolean
): Promise<{ shop: string; session: Session }> {
  const payload = await shopify.session.decodeSessionToken(sessionToken);
  const shop = normalizeShopDomain(payload.dest);

  const session = await tokenExchange({
    shop,
    sessionToken,
    online,
    store: store !== false,
    forceRefresh,
  });

  if (store !== false) {
    try {
      const { setupComplete, webhooksRegistered } = await getShopSetupStatus(shop);
      if (setupComplete && webhooksRegistered) return { shop, session };

      await upsertShop(shop);

      if (session.accessToken && (await claimSetupLock(shop))) {
        let webhooksSucceeded = false;
        try {
          if (!webhooksRegistered) {
            await registerWebhooks(session);
            await markWebhooksRegistered(shop);
          }
          webhooksSucceeded = true;
        } catch (err) {
          console.error("[Auth] Webhook registration failed:", err);
        }

        if (webhooksSucceeded) {
          await markSetupComplete(shop);
        } else {
          await releaseSetupLock(shop);
        }
      }
    } catch (err) {
      console.error("[Auth] Shop setup failed:", err);
    }
  }

  return { shop, session };
}
```

- [ ] **Step 2: Create gdpr.ts**

```typescript
// web/lib/shopify/webhooks/gdpr.ts
import shopify from "../config/initialize-context";
import { DeliveryMethod } from "@shopify/shopify-api";

export function setupGDPRWebHooks(callbackUrl: string): void {
  shopify.webhooks.addHandlers({
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl,
      callback: async (_topic, shop, body) => {
        console.log(`[GDPR] customers/data_request from ${shop}:`, body);
      },
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl,
      callback: async (_topic, shop, body) => {
        console.log(`[GDPR] customers/redact from ${shop}:`, body);
      },
    },
    SHOP_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl,
      callback: async (_topic, shop) => {
        console.log(`[GDPR] shop/redact from ${shop}`);
      },
    },
  });
}
```

- [ ] **Step 3: Create handlers.ts**

```typescript
// web/lib/shopify/webhooks/handlers.ts
import { deleteSessionsByShop } from "@/shared/repositories";

export async function handleAppUninstalled(
  shop: string,
  _body: string
): Promise<void> {
  try {
    await deleteSessionsByShop(shop);
    console.log(`[Webhook] app/uninstalled: cleaned sessions for ${shop}`);
  } catch (err) {
    console.error(`[Webhook] app/uninstalled failed for ${shop}:`, err);
    throw err;
  }
}
```

- [ ] **Step 4: Create register.ts**

```typescript
// web/lib/shopify/webhooks/register.ts
import shopify from "../config/initialize-context";
import { DeliveryMethod, Session } from "@shopify/shopify-api";
import { setupGDPRWebHooks } from "./gdpr";
import { handleAppUninstalled } from "./handlers";

let webhooksInitialized = false;

export function addHandlers(): void {
  if (webhooksInitialized) return;

  setupGDPRWebHooks("/api/webhooks");

  shopify.webhooks.addHandlers({
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/api/webhooks",
      callback: async (_topic, shop, body) => {
        await handleAppUninstalled(shop, body);
      },
    },
  });

  webhooksInitialized = true;
}

export async function registerWebhooks(session: Session): Promise<void> {
  addHandlers();

  if (!session.accessToken) throw new Error(`No access token for ${session.shop}`);
  if (!session.shop) throw new Error("No shop in session");

  const responses = await shopify.webhooks.register({ session });

  const failed = Object.entries(responses)
    .filter(([, results]) => results.some((r) => !r.success))
    .map(([topic]) => topic);

  if (failed.length > 0) {
    console.warn("[Webhooks] Failed topics:", failed.join(", "));
  }
}
```

- [ ] **Step 5: Create lib/shopify/index.ts**

```typescript
// web/lib/shopify/index.ts
export * from "./auth/verify";
export * from "./webhooks/register";
export * from "./webhooks/gdpr";
```

- [ ] **Step 6: Create GraphQL client**

```typescript
// web/lib/graphql/client/server-action.ts
"use server";

import { print } from "graphql";
import { GraphQLClient } from "graphql-request";
import { handleSessionToken } from "@/lib/shopify";
import { GraphQLRequest, GraphQLResponse } from "@/shared/types";
import { SHOPIFY_API_VERSION } from "@/shared/constants";
import { TypedDocumentNode } from "@graphql-typed-document-node/core";

const RETRYABLE_CODES = [429, 502, 503, 504];
const MAX_RETRIES = 3;
const BACKOFF_MS = [0, 1000, 3000];

function retryableStatus(error: unknown): number | null {
  if (error && typeof error === "object" && "response" in error) {
    const s = (error as any).response?.status;
    if (RETRYABLE_CODES.includes(s)) return s;
  }
  return null;
}

export async function executeGraphQLQuery<T = any>(
  request: GraphQLRequest
): Promise<GraphQLResponse<T>> {
  try {
    const { query, variables = {} } = request;
    if (!query) {
      return { errors: [{ message: "GraphQL query is required", extensions: { code: "MISSING_QUERY" } }] };
    }

    let shop: string;
    let accessToken: string;

    if (request.shop && request.accessToken) {
      shop = request.shop;
      accessToken = request.accessToken;
    } else if (request.sessionToken) {
      const result = await handleSessionToken(request.sessionToken, false, false);
      if (!result.session?.accessToken) {
        return { errors: [{ message: "No access token in session", extensions: { code: "MISSING_ACCESS_TOKEN" } }] };
      }
      shop = result.shop;
      accessToken = result.session.accessToken;
    } else {
      return { errors: [{ message: "Authentication required", extensions: { code: "MISSING_AUTH" } }] };
    }

    const endpoint = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
    const client = new GraphQLClient(endpoint, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    const queryString =
      typeof query === "string"
        ? query
        : (query as TypedDocumentNode)?.loc?.source?.body ?? print(query as any);

    const result = await client.request<T>(queryString, variables);
    return { data: result };
  } catch (error) {
    // 401: force token refresh + retry once
    if (request.sessionToken && !request._retried) {
      const status = (error as any)?.response?.status;
      if (status === 401) {
        try {
          const refreshed = await handleSessionToken(request.sessionToken, false, true, true);
          if (refreshed.session?.accessToken) {
            return executeGraphQLQuery<T>({
              ...request,
              shop: refreshed.shop,
              accessToken: refreshed.session.accessToken,
              _retried: true,
            });
          }
        } catch {
          // Fall through to error handling
        }
      }
    }

    const retryable = retryableStatus(error);
    const retryCount = request._retryCount ?? 0;

    if (retryable && retryCount < MAX_RETRIES) {
      const delay = BACKOFF_MS[retryCount] ?? 3000;
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      return executeGraphQLQuery<T>({ ...request, _retryCount: retryCount + 1 });
    }

    if (retryable && retryCount >= MAX_RETRIES) {
      return {
        errors: [{
          message: `Shopify API unavailable (HTTP ${retryable}). Please try again later.`,
          extensions: { code: "SHOPIFY_UNAVAILABLE", statusCode: retryable },
        }],
      };
    }

    const msg = error instanceof Error ? error.message : "Unknown GraphQL error";
    return { errors: [{ message: msg, extensions: { code: "INTERNAL_ERROR" } }] };
  }
}

export async function executeGraphQLMutation<T = any>(
  request: GraphQLRequest
): Promise<GraphQLResponse<T>> {
  return executeGraphQLQuery<T>(request);
}
```

- [ ] **Step 7: Create lib/index.ts**

```typescript
// web/lib/index.ts
export * from "./graphql/client/server-action";
```

- [ ] **Step 8: Commit**

```bash
git add web/lib/
git commit -m "feat: auth, webhook, and graphql client infrastructure"
```

---

## Task 7: API Routes

**Files:**
- Create: `web/app/api/auth/route.ts`
- Create: `web/app/api/webhooks/route.ts`

- [ ] **Step 1: Create auth redirect route**

```typescript
// web/app/api/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isValidShopDomain } from "@/shared/utils";

const CLIENT_ID = process.env.SHOPIFY_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");
  const returnTo = searchParams.get("returnTo") || "/";

  if (!CLIENT_ID) {
    return NextResponse.json({ error: "Authentication unavailable" }, { status: 500 });
  }

  if (!shop || !isValidShopDomain(shop)) {
    return NextResponse.json({ error: "Invalid or missing shop domain" }, { status: 400 });
  }

  const sanitizedReturnTo = /^\/[a-zA-Z0-9/_-]*$/.test(returnTo) ? returnTo : "/";
  const embeddedUrl = `https://${shop}/admin/apps/${CLIENT_ID}${sanitizedReturnTo}`;
  return NextResponse.redirect(embeddedUrl);
}
```

- [ ] **Step 2: Create webhook route**

```typescript
// web/app/api/webhooks/route.ts
import { headers } from "next/headers";
import { addHandlers } from "@/lib/shopify";
import shopify from "@/lib/shopify/config/initialize-context";
import prisma from "@/shared/repositories/prisma-connect";

let handlerInitPromise: Promise<void> | null = null;

function ensureHandlers(topic: string): Promise<void> {
  const handlers = shopify.webhooks.getHandlers(topic);
  if (handlers && handlers.length > 0) return Promise.resolve();

  if (!handlerInitPromise) {
    console.warn(`[Webhook] No handlers for topic: ${topic}, re-adding.`);
    handlerInitPromise = Promise.resolve().then(() => addHandlers());
  }
  return handlerInitPromise;
}

export async function POST(req: Request) {
  const headerList = await headers();
  const topic = headerList.get("x-shopify-topic") || "unknown";
  const shop = headerList.get("x-shopify-shop-domain") || "unknown";
  const webhookId = headerList.get("x-shopify-webhook-id");

  // Idempotency: skip already-processed deliveries
  if (webhookId) {
    const existing = await prisma.webhookDelivery.findUnique({ where: { id: webhookId } });
    if (existing) return new Response(null, { status: 200 });
  }

  const rawBody = await req.text();
  await ensureHandlers(topic);

  try {
    const { statusCode } = await shopify.webhooks.process({ rawBody, rawRequest: req });

    if (webhookId) {
      prisma.webhookDelivery
        .create({ data: { id: webhookId, topic, shop } })
        .catch(() => {});

      prisma.webhookDelivery
        .deleteMany({
          where: { processedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        })
        .catch(() => {});
    }

    return new Response(null, { status: statusCode });
  } catch (err) {
    console.error(`[Webhook] Processing failed for ${topic} from ${shop}:`, err);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
```

- [ ] **Step 3: Create App Proxy route for storefront**

```typescript
// web/app/api/proxy/announcements/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/shared/repositories/prisma-connect";
import { isValidShopDomain } from "@/shared/utils";

// Rate limiter (per-shop, in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(shop: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(shop);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(shop, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop") ?? "";

  if (!isValidShopDomain(shop)) {
    return NextResponse.json({ error: "Invalid shop" }, { status: 400 });
  }

  if (!checkRateLimit(shop)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const now = new Date();

  const shopRecord = await prisma.shop.findUnique({ where: { domain: shop } });
  if (!shopRecord) return NextResponse.json({ announcement: null });

  const announcement = await prisma.announcement.findFirst({
    where: {
      shopId: shopRecord.id,
      isActive: true,
      OR: [
        { startsAt: null },
        { startsAt: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endsAt: null },
            { endsAt: { gte: now } },
          ],
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      bgColor: true,
      textColor: true,
    },
  });

  return NextResponse.json({ announcement }, { headers: { "Cache-Control": "no-store" } });
}
```

- [ ] **Step 4: Commit**

```bash
git add web/app/api/
git commit -m "feat: api routes (auth redirect, webhooks, app proxy)"
```

---

## Task 8: Announcements Feature — Types + Validation + Repository

**Files:**
- Create: `web/features/announcements/types/announcement.types.ts`
- Create: `web/features/announcements/types/index.ts`
- Create: `web/features/announcements/validation/announcement.zod.ts`
- Create: `web/features/announcements/validation/index.ts`
- Create: `web/features/announcements/repositories/announcement.repository.ts`
- Create: `web/features/announcements/repositories/index.ts`

- [ ] **Step 1: Write types**

```typescript
// web/features/announcements/types/announcement.types.ts
export type AnnouncementType = "INFO" | "WARNING" | "PROMO" | "URGENT";

export interface Announcement {
  id: string;
  shopId: string;
  title: string;
  message: string;
  type: AnnouncementType;
  isActive: boolean;
  bgColor: string;
  textColor: string;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateAnnouncementInput = {
  title: string;
  message: string;
  type: AnnouncementType;
  bgColor: string;
  textColor: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

export type UpdateAnnouncementInput = Partial<CreateAnnouncementInput> & {
  isActive?: boolean;
};
```

- [ ] **Step 2: Create types barrel**

```typescript
// web/features/announcements/types/index.ts
export * from "./announcement.types";
```

- [ ] **Step 3: Write Zod schemas**

```typescript
// web/features/announcements/validation/announcement.zod.ts
import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  message: z.string().min(1, "Message is required").max(500),
  type: z.enum(["INFO", "WARNING", "PROMO", "URGENT"]),
  bgColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .default("#1a1a1a"),
  textColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .default("#ffffff"),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateAnnouncementFormValues = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementFormValues = z.infer<typeof updateAnnouncementSchema>;
```

- [ ] **Step 4: Create validation barrel**

```typescript
// web/features/announcements/validation/index.ts
export * from "./announcement.zod";
```

- [ ] **Step 5: Write repository**

```typescript
// web/features/announcements/repositories/announcement.repository.ts
import prisma from "@/shared/repositories/prisma-connect";
import { CreateAnnouncementInput, UpdateAnnouncementInput } from "../types";

export async function findShopIdByDomain(domain: string): Promise<string | null> {
  const shop = await prisma.shop.findUnique({
    where: { domain },
    select: { id: true },
  });
  return shop?.id ?? null;
}

export async function findAllByShop(shopId: string) {
  return prisma.announcement.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
  });
}

export async function findById(id: string) {
  return prisma.announcement.findUnique({ where: { id } });
}

export async function createAnnouncement(
  shopId: string,
  data: CreateAnnouncementInput
) {
  return prisma.announcement.create({
    data: {
      shopId,
      title: data.title,
      message: data.message,
      type: data.type,
      bgColor: data.bgColor,
      textColor: data.textColor,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
    },
  });
}

export async function updateAnnouncement(
  id: string,
  data: UpdateAnnouncementInput
) {
  return prisma.announcement.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.message !== undefined && { message: data.message }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.bgColor !== undefined && { bgColor: data.bgColor }),
      ...(data.textColor !== undefined && { textColor: data.textColor }),
      ...(data.startsAt !== undefined && { startsAt: data.startsAt }),
      ...(data.endsAt !== undefined && { endsAt: data.endsAt }),
    },
  });
}

export async function deleteAnnouncement(id: string) {
  return prisma.announcement.delete({ where: { id } });
}
```

- [ ] **Step 6: Create repository barrel**

```typescript
// web/features/announcements/repositories/index.ts
export * from "./announcement.repository";
```

- [ ] **Step 7: Commit**

```bash
git add web/features/announcements/types/ web/features/announcements/validation/ web/features/announcements/repositories/
git commit -m "feat: announcement types, validation, and repository"
```

---

## Task 9: Announcements Feature — Service + Actions

**Files:**
- Create: `web/features/announcements/services/announcement.service.ts`
- Create: `web/features/announcements/services/index.ts`
- Create: `web/features/announcements/actions/announcement-read.actions.ts`
- Create: `web/features/announcements/actions/announcement-write.actions.ts`
- Create: `web/features/announcements/actions/index.ts`

- [ ] **Step 1: Write service**

```typescript
// web/features/announcements/services/announcement.service.ts
import {
  findShopIdByDomain,
  findAllByShop,
  findById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../repositories";
import { CreateAnnouncementInput, UpdateAnnouncementInput } from "../types";
import { ActionResponse } from "@/shared/types";

export async function getAnnouncementsForShop(
  domain: string
): Promise<ActionResponse<Awaited<ReturnType<typeof findAllByShop>>>> {
  const shopId = await findShopIdByDomain(domain);
  if (!shopId) return { status: "error", message: "Shop not found" };
  const data = await findAllByShop(shopId);
  return { status: "success", data };
}

export async function createAnnouncementForShop(
  domain: string,
  input: CreateAnnouncementInput
): Promise<ActionResponse<Awaited<ReturnType<typeof createAnnouncement>>>> {
  const shopId = await findShopIdByDomain(domain);
  if (!shopId) return { status: "error", message: "Shop not found" };
  const data = await createAnnouncement(shopId, input);
  return { status: "success", data };
}

export async function updateAnnouncementById(
  id: string,
  domain: string,
  input: UpdateAnnouncementInput
): Promise<ActionResponse<Awaited<ReturnType<typeof updateAnnouncement>>>> {
  const existing = await findById(id);
  if (!existing) return { status: "error", message: "Announcement not found" };

  const shopId = await findShopIdByDomain(domain);
  if (!shopId || existing.shopId !== shopId) {
    return { status: "error", message: "Unauthorized" };
  }

  const data = await updateAnnouncement(id, input);
  return { status: "success", data };
}

export async function deleteAnnouncementById(
  id: string,
  domain: string
): Promise<ActionResponse<null>> {
  const existing = await findById(id);
  if (!existing) return { status: "error", message: "Announcement not found" };

  const shopId = await findShopIdByDomain(domain);
  if (!shopId || existing.shopId !== shopId) {
    return { status: "error", message: "Unauthorized" };
  }

  await deleteAnnouncement(id);
  return { status: "success", data: null };
}
```

- [ ] **Step 2: Create services barrel**

```typescript
// web/features/announcements/services/index.ts
export * from "./announcement.service";
```

- [ ] **Step 3: Write read actions**

```typescript
// web/features/announcements/actions/announcement-read.actions.ts
"use server";

import { handleSessionToken } from "@/lib/shopify";
import { getAnnouncementsForShop } from "../services";

export async function getAnnouncementsAction(sessionToken: string) {
  try {
    const { shop } = await handleSessionToken(sessionToken);
    return getAnnouncementsForShop(shop);
  } catch (err) {
    console.error("[Action] getAnnouncements failed:", err);
    return { status: "error" as const, message: "Failed to fetch announcements" };
  }
}
```

- [ ] **Step 4: Write write actions**

```typescript
// web/features/announcements/actions/announcement-write.actions.ts
"use server";

import { handleSessionToken } from "@/lib/shopify";
import {
  createAnnouncementForShop,
  updateAnnouncementById,
  deleteAnnouncementById,
} from "../services";
import { createAnnouncementSchema, updateAnnouncementSchema } from "../validation";
import { CreateAnnouncementInput, UpdateAnnouncementInput } from "../types";

export async function createAnnouncementAction(
  sessionToken: string,
  input: CreateAnnouncementInput
) {
  try {
    const parsed = createAnnouncementSchema.safeParse(input);
    if (!parsed.success) {
      return { status: "error" as const, message: "Validation failed", errors: parsed.error.flatten().fieldErrors };
    }
    const { shop } = await handleSessionToken(sessionToken);
    return createAnnouncementForShop(shop, parsed.data as CreateAnnouncementInput);
  } catch (err) {
    console.error("[Action] createAnnouncement failed:", err);
    return { status: "error" as const, message: "Failed to create announcement" };
  }
}

export async function updateAnnouncementAction(
  sessionToken: string,
  id: string,
  input: UpdateAnnouncementInput
) {
  try {
    const parsed = updateAnnouncementSchema.safeParse(input);
    if (!parsed.success) {
      return { status: "error" as const, message: "Validation failed", errors: parsed.error.flatten().fieldErrors };
    }
    const { shop } = await handleSessionToken(sessionToken);
    return updateAnnouncementById(id, shop, parsed.data as UpdateAnnouncementInput);
  } catch (err) {
    console.error("[Action] updateAnnouncement failed:", err);
    return { status: "error" as const, message: "Failed to update announcement" };
  }
}

export async function deleteAnnouncementAction(
  sessionToken: string,
  id: string
) {
  try {
    const { shop } = await handleSessionToken(sessionToken);
    return deleteAnnouncementById(id, shop);
  } catch (err) {
    console.error("[Action] deleteAnnouncement failed:", err);
    return { status: "error" as const, message: "Failed to delete announcement" };
  }
}
```

- [ ] **Step 5: Create actions barrel**

```typescript
// web/features/announcements/actions/index.ts
export * from "./announcement-read.actions";
export * from "./announcement-write.actions";
```

- [ ] **Step 6: Commit**

```bash
git add web/features/announcements/services/ web/features/announcements/actions/
git commit -m "feat: announcement service and server actions"
```

---

## Task 10: Announcements Feature — React Query + Zustand

**Files:**
- Create: `web/features/announcements/api/announcement-keys.ts`
- Create: `web/features/announcements/api/announcement-queries.ts`
- Create: `web/features/announcements/api/announcement-mutations.ts`
- Create: `web/features/announcements/api/index.ts`
- Create: `web/features/announcements/stores/announcement.store.ts`
- Create: `web/features/announcements/stores/index.ts`
- Create: `web/features/announcements/hooks/use-announcements.ts`
- Create: `web/features/announcements/hooks/index.ts`

- [ ] **Step 1: Create query keys**

```typescript
// web/features/announcements/api/announcement-keys.ts
export const announcementKeys = {
  all: ["announcements"] as const,
  lists: () => [...announcementKeys.all, "list"] as const,
  detail: (id: string) => [...announcementKeys.all, "detail", id] as const,
};
```

- [ ] **Step 2: Create queries**

```typescript
// web/features/announcements/api/announcement-queries.ts
import { useQuery } from "@tanstack/react-query";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getAnnouncementsAction } from "../actions";
import { announcementKeys } from "./announcement-keys";

export function useAnnouncementsQuery() {
  const shopify = useAppBridge();

  return useQuery({
    queryKey: announcementKeys.lists(),
    queryFn: async () => {
      const token = await shopify.idToken();
      const result = await getAnnouncementsAction(token);
      if (result.status === "error") throw new Error(result.message);
      return result.data;
    },
  });
}
```

- [ ] **Step 3: Create mutations**

```typescript
// web/features/announcements/api/announcement-mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
} from "../actions";
import { announcementKeys } from "./announcement-keys";
import { CreateAnnouncementInput, UpdateAnnouncementInput } from "../types";

export function useCreateAnnouncement() {
  const shopify = useAppBridge();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAnnouncementInput) => {
      const token = await shopify.idToken();
      const result = await createAnnouncementAction(token, input);
      if (result.status === "error") throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}

export function useUpdateAnnouncement() {
  const shopify = useAppBridge();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateAnnouncementInput }) => {
      const token = await shopify.idToken();
      const result = await updateAnnouncementAction(token, id, input);
      if (result.status === "error") throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}

export function useDeleteAnnouncement() {
  const shopify = useAppBridge();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await shopify.idToken();
      const result = await deleteAnnouncementAction(token, id);
      if (result.status === "error") throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}
```

- [ ] **Step 4: Create api barrel**

```typescript
// web/features/announcements/api/index.ts
export * from "./announcement-keys";
export * from "./announcement-queries";
export * from "./announcement-mutations";
```

- [ ] **Step 5: Create Zustand store**

```typescript
// web/features/announcements/stores/announcement.store.ts
import { create } from "zustand";
import { Announcement } from "../types";

interface AnnouncementStore {
  selectedId: string | null;
  isFormOpen: boolean;
  setSelected: (id: string | null) => void;
  openForm: (announcement?: Announcement) => void;
  closeForm: () => void;
}

export const useAnnouncementStore = create<AnnouncementStore>((set) => ({
  selectedId: null,
  isFormOpen: false,
  setSelected: (id) => set({ selectedId: id }),
  openForm: (announcement) => set({ selectedId: announcement?.id ?? null, isFormOpen: true }),
  closeForm: () => set({ selectedId: null, isFormOpen: false }),
}));
```

- [ ] **Step 6: Create stores barrel**

```typescript
// web/features/announcements/stores/index.ts
export * from "./announcement.store";
```

- [ ] **Step 7: Create hook**

```typescript
// web/features/announcements/hooks/use-announcements.ts
import { useAnnouncementsQuery } from "../api/announcement-queries";
import { useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement } from "../api/announcement-mutations";
import { useAnnouncementStore } from "../stores";

export function useAnnouncements() {
  const { data: announcements = [], isLoading, error } = useAnnouncementsQuery();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();
  const { isFormOpen, selectedId, openForm, closeForm } = useAnnouncementStore();

  const selectedAnnouncement = announcements.find((a) => a.id === selectedId) ?? null;

  return {
    announcements,
    isLoading,
    error,
    isFormOpen,
    selectedAnnouncement,
    openForm,
    closeForm,
    create: createMutation.mutateAsync,
    update: (id: string, input: Parameters<typeof updateMutation.mutateAsync>[0]["input"]) =>
      updateMutation.mutateAsync({ id, input }),
    remove: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
```

- [ ] **Step 8: Create hooks barrel**

```typescript
// web/features/announcements/hooks/index.ts
export * from "./use-announcements";
```

- [ ] **Step 9: Commit**

```bash
git add web/features/announcements/api/ web/features/announcements/stores/ web/features/announcements/hooks/
git commit -m "feat: announcement react-query layer, store, and hook"
```

---

## Task 11: Announcements Feature — UI Components

**Files:**
- Create: `web/features/announcements/components/AnnouncementCard.tsx`
- Create: `web/features/announcements/components/AnnouncementForm.tsx`
- Create: `web/features/announcements/components/AnnouncementList.tsx`
- Create: `web/features/announcements/components/index.ts`
- Create: `web/features/announcements/index.ts`

- [ ] **Step 1: Create AnnouncementCard**

```tsx
// web/features/announcements/components/AnnouncementCard.tsx
import { useAnnouncements } from "../hooks";
import { Announcement } from "../types";

interface Props {
  announcement: Announcement;
}

export function AnnouncementCard({ announcement }: Props) {
  const { update, remove, openForm, isDeleting } = useAnnouncements();

  const typeColors: Record<string, string> = {
    INFO: "#0070f3",
    WARNING: "#f5a623",
    PROMO: "#7c3aed",
    URGENT: "#dc2626",
  };

  return (
    <div
      style={{
        border: "1px solid #e1e3e5",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: typeColors[announcement.type] ?? "#6b7280",
              textTransform: "uppercase",
            }}
          >
            {announcement.type}
          </span>
          <span
            style={{
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "12px",
              backgroundColor: announcement.isActive ? "#dcfce7" : "#f3f4f6",
              color: announcement.isActive ? "#16a34a" : "#6b7280",
            }}
          >
            {announcement.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{announcement.title}</p>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>{announcement.message}</p>
      </div>

      <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
        <button
          onClick={() =>
            update(announcement.id, { isActive: !announcement.isActive })
          }
          style={{ cursor: "pointer", padding: "6px 12px", borderRadius: "6px", border: "1px solid #e1e3e5" }}
        >
          {announcement.isActive ? "Deactivate" : "Activate"}
        </button>
        <button
          onClick={() => openForm(announcement)}
          style={{ cursor: "pointer", padding: "6px 12px", borderRadius: "6px", border: "1px solid #e1e3e5" }}
        >
          Edit
        </button>
        <button
          onClick={() => remove(announcement.id)}
          disabled={isDeleting}
          style={{
            cursor: "pointer",
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #fca5a5",
            color: "#dc2626",
            backgroundColor: "#fff5f5",
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create AnnouncementForm**

```tsx
// web/features/announcements/components/AnnouncementForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAnnouncements } from "../hooks";
import { createAnnouncementSchema, CreateAnnouncementFormValues } from "../validation";

export function AnnouncementForm() {
  const { create, update, selectedAnnouncement, closeForm, isCreating, isUpdating } =
    useAnnouncements();

  const { register, handleSubmit, formState: { errors } } = useForm<CreateAnnouncementFormValues>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: selectedAnnouncement
      ? {
          title: selectedAnnouncement.title,
          message: selectedAnnouncement.message,
          type: selectedAnnouncement.type,
          bgColor: selectedAnnouncement.bgColor,
          textColor: selectedAnnouncement.textColor,
        }
      : {
          type: "INFO",
          bgColor: "#1a1a1a",
          textColor: "#ffffff",
        },
  });

  const onSubmit = async (values: CreateAnnouncementFormValues) => {
    if (selectedAnnouncement) {
      await update(selectedAnnouncement.id, values);
    } else {
      await create(values);
    }
    closeForm();
  };

  const inputStyle = {
    width: "100%",
    padding: "8px",
    border: "1px solid #e1e3e5",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    marginBottom: "4px",
    fontWeight: 500,
    fontSize: "14px",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ padding: "20px" }}>
      <h3 style={{ marginBottom: "20px" }}>
        {selectedAnnouncement ? "Edit Announcement" : "New Announcement"}
      </h3>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Title</label>
        <input {...register("title")} style={inputStyle} placeholder="Summer Sale ends tonight" />
        {errors.title && <p style={{ color: "#dc2626", fontSize: "12px" }}>{errors.title.message}</p>}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Message</label>
        <textarea
          {...register("message")}
          style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
          placeholder="Get 20% off all products this weekend only!"
        />
        {errors.message && <p style={{ color: "#dc2626", fontSize: "12px" }}>{errors.message.message}</p>}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Type</label>
        <select {...register("type")} style={inputStyle}>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="PROMO">Promo</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        <div>
          <label style={labelStyle}>Background Color</label>
          <input {...register("bgColor")} type="color" style={{ width: "100%", height: "40px", cursor: "pointer" }} />
        </div>
        <div>
          <label style={labelStyle}>Text Color</label>
          <input {...register("textColor")} type="color" style={{ width: "100%", height: "40px", cursor: "pointer" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          type="submit"
          disabled={isCreating || isUpdating}
          style={{
            padding: "10px 20px",
            backgroundColor: "#008060",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {isCreating || isUpdating ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={closeForm}
          style={{ padding: "10px 20px", border: "1px solid #e1e3e5", borderRadius: "6px", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create AnnouncementList**

```tsx
// web/features/announcements/components/AnnouncementList.tsx
import { useAnnouncements } from "../hooks";
import { AnnouncementCard } from "./AnnouncementCard";
import { AnnouncementForm } from "./AnnouncementForm";

export function AnnouncementList() {
  const { announcements, isLoading, error, isFormOpen, openForm } = useAnnouncements();

  if (isLoading) return <p>Loading announcements...</p>;
  if (error) return <p style={{ color: "#dc2626" }}>Error: {error.message}</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>Announcements</h2>
        <button
          onClick={() => openForm()}
          style={{
            padding: "10px 20px",
            backgroundColor: "#008060",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          + New Announcement
        </button>
      </div>

      {isFormOpen && (
        <div
          style={{
            border: "1px solid #e1e3e5",
            borderRadius: "8px",
            marginBottom: "20px",
            backgroundColor: "#fafafa",
          }}
        >
          <AnnouncementForm />
        </div>
      )}

      {announcements.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            border: "2px dashed #e1e3e5",
            borderRadius: "8px",
            color: "#6b7280",
          }}
        >
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>No announcements yet</p>
          <p style={{ margin: 0, fontSize: "14px" }}>
            Create your first announcement to display on your storefront.
          </p>
        </div>
      ) : (
        announcements.map((a) => <AnnouncementCard key={a.id} announcement={a} />)
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create components barrel + feature barrel**

```typescript
// web/features/announcements/components/index.ts
export * from "./AnnouncementList";
export * from "./AnnouncementForm";
export * from "./AnnouncementCard";

// web/features/announcements/index.ts
export * from "./actions";
export * from "./components";
export * from "./hooks";
export * from "./types";
```

- [ ] **Step 5: Commit**

```bash
git add web/features/announcements/components/ web/features/announcements/index.ts
git commit -m "feat: announcement UI components (list, form, card)"
```

---

## Task 12: Providers + App Layout + Routes

**Files:**
- Create: `web/shared/components/Providers.tsx`
- Create: `web/shared/components/AppLayout.tsx`
- Create: `web/shared/components/index.ts`
- Create: `web/app/layout.tsx`
- Create: `web/app/globals.css`
- Create: `web/app/page.tsx`
- Create: `web/app/(dashboard)/layout.tsx`
- Create: `web/app/(dashboard)/page.tsx`
- Create: `web/app/(dashboard)/announcements/page.tsx`

- [ ] **Step 1: Create Providers**

```tsx
// web/shared/components/Providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@shopify/app-bridge-react";
import { ReactNode, useState } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000 },
          mutations: { retry: 0 },
        },
      })
  );

  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY ?? "";

  return (
    <AppProvider apiKey={apiKey}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AppProvider>
  );
}
```

- [ ] **Step 2: Create AppLayout (navigation shell)**

```tsx
// web/shared/components/AppLayout.tsx
"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/shared/constants";

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "Announcements", href: ROUTES.ANNOUNCEMENTS },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <nav
        style={{
          width: "220px",
          borderRight: "1px solid #e1e3e5",
          padding: "20px 0",
          backgroundColor: "#fafafa",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "0 20px 20px", fontWeight: 700, fontSize: "16px" }}>
          My Shopify App
        </div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "block",
              padding: "10px 20px",
              color: pathname === item.href ? "#008060" : "#374151",
              fontWeight: pathname === item.href ? 600 : 400,
              textDecoration: "none",
              backgroundColor: pathname === item.href ? "#f0faf5" : "transparent",
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main style={{ flex: 1, padding: "32px" }}>{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Create shared components barrel**

```typescript
// web/shared/components/index.ts
export * from "./Providers";
export * from "./AppLayout";
```

- [ ] **Step 4: Create root layout**

```tsx
// web/app/layout.tsx
import { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/shared/components";

export const metadata: Metadata = {
  title: "My Shopify App",
  other: {
    "shopify-app-origins": process.env.NEXT_PUBLIC_HOST || "",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="shopify-api-key"
          content={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || ""}
        />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Create globals.css**

```css
/* web/app/globals.css */
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #1a1a1a;
  background: #fff;
}

a { color: inherit; }
```

- [ ] **Step 6: Create root page (redirect)**

```tsx
// web/app/page.tsx
import { redirect } from "next/navigation";
import { ROUTES } from "@/shared/constants";

export default function RootPage() {
  redirect(ROUTES.DASHBOARD);
}
```

- [ ] **Step 7: Create dashboard layout**

```tsx
// web/app/(dashboard)/layout.tsx
import { ReactNode } from "react";
import { AppLayout } from "@/shared/components";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
```

- [ ] **Step 8: Create dashboard home page**

```tsx
// web/app/(dashboard)/page.tsx
export default function DashboardPage() {
  return (
    <div>
      <h1>Welcome to your Shopify App</h1>
      <p style={{ color: "#6b7280" }}>
        This is the starter template. Start by adding your features in{" "}
        <code>web/features/</code>.
      </p>
      <div
        style={{
          marginTop: "24px",
          padding: "20px",
          border: "1px solid #e1e3e5",
          borderRadius: "8px",
          backgroundColor: "#f9fafb",
        }}
      >
        <h3 style={{ margin: "0 0 8px" }}>Announcement Banner</h3>
        <p style={{ margin: "0 0 16px", color: "#6b7280", fontSize: "14px" }}>
          Manage storefront announcements from the Announcements page.
        </p>
        <a href="/announcements" style={{ color: "#008060", fontWeight: 600 }}>
          Manage Announcements →
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Create announcements page**

```tsx
// web/app/(dashboard)/announcements/page.tsx
import { Metadata } from "next";
import { AnnouncementList } from "@/features/announcements";

export const metadata: Metadata = {
  title: "Announcements",
};

export default function AnnouncementsPage() {
  return <AnnouncementList />;
}
```

- [ ] **Step 10: Commit**

```bash
git add web/shared/components/ web/app/
git commit -m "feat: providers, layout, and app routes"
```

---

## Task 13: Service Unit Tests

**Files:**
- Create: `web/tests/announcement.service.test.ts`
- Create: `web/jest.config.ts`

- [ ] **Step 1: Create jest config**

```typescript
// web/jest.config.ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: { module: "CommonJS" } }],
  },
};

export default config;
```

- [ ] **Step 2: Write failing test for service**

```typescript
// web/tests/announcement.service.test.ts
import { getAnnouncementsForShop, createAnnouncementForShop } from "@/features/announcements/services/announcement.service";

jest.mock("@/features/announcements/repositories/announcement.repository", () => ({
  findShopIdByDomain: jest.fn(),
  findAllByShop: jest.fn(),
  createAnnouncement: jest.fn(),
  findById: jest.fn(),
  updateAnnouncement: jest.fn(),
  deleteAnnouncement: jest.fn(),
}));

import {
  findShopIdByDomain,
  findAllByShop,
  createAnnouncement,
} from "@/features/announcements/repositories/announcement.repository";

const mockFindShopId = findShopIdByDomain as jest.MockedFunction<typeof findShopIdByDomain>;
const mockFindAll = findAllByShop as jest.MockedFunction<typeof findAllByShop>;
const mockCreate = createAnnouncement as jest.MockedFunction<typeof createAnnouncement>;

describe("announcement.service", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("getAnnouncementsForShop", () => {
    it("returns error when shop not found", async () => {
      mockFindShopId.mockResolvedValue(null);
      const result = await getAnnouncementsForShop("unknown.myshopify.com");
      expect(result.status).toBe("error");
    });

    it("returns announcements for valid shop", async () => {
      const fakeAnnouncements = [
        {
          id: "ann_1",
          shopId: "shop_1",
          title: "Summer Sale",
          message: "20% off everything",
          type: "PROMO" as const,
          isActive: true,
          bgColor: "#1a1a1a",
          textColor: "#ffffff",
          startsAt: null,
          endsAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockFindShopId.mockResolvedValue("shop_1");
      mockFindAll.mockResolvedValue(fakeAnnouncements);
      const result = await getAnnouncementsForShop("test.myshopify.com");
      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].title).toBe("Summer Sale");
      }
    });
  });

  describe("createAnnouncementForShop", () => {
    it("returns error when shop not found", async () => {
      mockFindShopId.mockResolvedValue(null);
      const result = await createAnnouncementForShop("unknown.myshopify.com", {
        title: "Test",
        message: "Test message",
        type: "INFO",
        bgColor: "#000000",
        textColor: "#ffffff",
      });
      expect(result.status).toBe("error");
    });

    it("creates announcement for valid shop", async () => {
      const created = {
        id: "ann_new",
        shopId: "shop_1",
        title: "Flash Sale",
        message: "One day only!",
        type: "URGENT" as const,
        isActive: false,
        bgColor: "#dc2626",
        textColor: "#ffffff",
        startsAt: null,
        endsAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockFindShopId.mockResolvedValue("shop_1");
      mockCreate.mockResolvedValue(created);
      const result = await createAnnouncementForShop("test.myshopify.com", {
        title: "Flash Sale",
        message: "One day only!",
        type: "URGENT",
        bgColor: "#dc2626",
        textColor: "#ffffff",
      });
      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.data.title).toBe("Flash Sale");
      }
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail (service not yet wired)**

```bash
cd /Users/radiustheme/Shopify/shopify-nextjs-app-router-starter/web
bun test
```
Expected: Tests should pass since mocks are wired. If they fail with import errors, check path aliases in jest.config.ts.

- [ ] **Step 4: Commit**

```bash
git add web/tests/ web/jest.config.ts
git commit -m "test: announcement service unit tests"
```

---

## Task 14: Theme Extension (Announcement Widget)

**Files:**
- Create: `extension/extensions/announcement-widget/shopify.extension.toml`
- Create: `extension/extensions/announcement-widget/blocks/announcement-banner.liquid`
- Create: `extension/extensions/announcement-widget/assets/announcement-widget.js`
- Create: `extension/extensions/announcement-widget/assets/announcement-widget.css`
- Create: `extension/extensions/announcement-widget/locales/en.default.json`

- [ ] **Step 1: Create extension toml**

```toml
# extension/extensions/announcement-widget/shopify.extension.toml
api_version = "2025-10"
name = "Announcement Banner"
handle = "announcement-banner"

[[extensions]]
type = "theme"
name = "Announcement Banner"
handle = "announcement-banner"

  [extensions.capabilities]
  network_access = true
```

- [ ] **Step 2: Create Liquid block**

```liquid
{% comment %}
  Announcement Banner Block
  Fetches the active announcement from the App Proxy and renders it.
  Dismiss state stored in sessionStorage.
{% endcomment %}

<div
  id="announcement-banner-{{ block.id }}"
  class="announcement-banner announcement-banner--hidden"
  data-shop="{{ shop.permanent_domain }}"
  data-block-id="{{ block.id }}"
  {{ block.shopify_attributes }}
>
  <div class="announcement-banner__inner">
    <span class="announcement-banner__message" id="announcement-message-{{ block.id }}"></span>
    <button
      class="announcement-banner__close"
      aria-label="Dismiss announcement"
      data-dismiss-target="announcement-banner-{{ block.id }}"
    >
      &times;
    </button>
  </div>
</div>

{{ 'announcement-widget.css' | asset_url | stylesheet_tag }}
<script src="{{ 'announcement-widget.js' | asset_url }}" defer></script>
```

- [ ] **Step 3: Create widget JS**

```javascript
// extension/extensions/announcement-widget/assets/announcement-widget.js
(function () {
  "use strict";

  const STORAGE_KEY = "dismissed_announcements";

  function getDismissed() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function dismiss(id) {
    const dismissed = getDismissed();
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
    }
  }

  function isDismissed(id) {
    return getDismissed().includes(id);
  }

  async function loadAnnouncement(banner) {
    const shop = banner.dataset.shop;
    const blockId = banner.dataset.blockId;
    if (!shop) return;

    try {
      const res = await fetch(`/apps/announcements?shop=${encodeURIComponent(shop)}`);
      if (!res.ok) return;
      const { announcement } = await res.json();
      if (!announcement) return;
      if (isDismissed(announcement.id)) return;

      const msgEl = document.getElementById(`announcement-message-${blockId}`);
      if (msgEl) msgEl.textContent = announcement.message;

      banner.style.backgroundColor = announcement.bgColor || "#1a1a1a";
      banner.style.color = announcement.textColor || "#ffffff";
      banner.dataset.announcementId = announcement.id;
      banner.classList.remove("announcement-banner--hidden");
    } catch (err) {
      console.warn("[AnnouncementBanner] Failed to load:", err);
    }
  }

  function attachDismiss(banner) {
    const btn = banner.querySelector(".announcement-banner__close");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const id = banner.dataset.announcementId;
      if (id) dismiss(id);
      banner.classList.add("announcement-banner--hidden");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".announcement-banner").forEach((banner) => {
      loadAnnouncement(banner);
      attachDismiss(banner);
    });
  });
})();
```

- [ ] **Step 4: Create widget CSS**

```css
/* extension/extensions/announcement-widget/assets/announcement-widget.css */
.announcement-banner {
  width: 100%;
  padding: 12px 16px;
  text-align: center;
  position: relative;
  transition: opacity 0.2s ease;
}

.announcement-banner--hidden {
  display: none;
}

.announcement-banner__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
}

.announcement-banner__message {
  font-size: 14px;
  font-weight: 500;
}

.announcement-banner__close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  opacity: 0.7;
  padding: 0;
  color: inherit;
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}

.announcement-banner__close:hover {
  opacity: 1;
}
```

- [ ] **Step 5: Create locales**

```json
// extension/extensions/announcement-widget/locales/en.default.json
{
  "t": {
    "dismiss": "Dismiss announcement"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add extension/
git commit -m "feat: announcement banner theme extension"
```

---

## Task 15: shopify.app.toml + Final Config

**Files:**
- Create: `shopify-nextjs-app-router-starter/shopify.app.toml`

- [ ] **Step 1: Create toml**

```toml
# shopify-nextjs-app-router-starter/shopify.app.toml
name = "Shopify Next.js Starter"
client_id = ""
application_url = "https://example.com"
embedded = true
extension_directories = ["extension/extensions/*"]

[app_proxy]
url = "https://example.com/api/proxy"
subpath = "announcements"
prefix = "apps"

[build]
automatically_update_urls_on_dev = true

[webhooks]
api_version = "2026-01"

  [[webhooks.subscriptions]]
  topics = ["app/uninstalled"]
  uri = "/api/webhooks"

  [[webhooks.subscriptions]]
  compliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]
  uri = "/api/webhooks"

[access.admin]
direct_api_mode = "offline"
embedded_app_direct_api_access = true

[access_scopes]
scopes = "read_products"

[auth]
redirect_urls = []

[pos]
embedded = false
```

- [ ] **Step 2: Run type check**

```bash
cd /Users/radiustheme/Shopify/shopify-nextjs-app-router-starter/web
bunx tsc --noEmit
```
Expected: No errors. Fix any import path issues found.

- [ ] **Step 3: Run tests**

```bash
bun test
```
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add shopify.app.toml
git commit -m "feat: shopify app config"
```

---

## Task 16: README

**Files:**
- Create: `shopify-nextjs-app-router-starter/README.md`

- [ ] **Step 1: Write README**

````markdown
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
bun run dev           # Start dev server (Shopify CLI)
cd web && bun run migrate   # Run DB migrations
cd web && bun test          # Run unit tests
cd web && bunx tsc --noEmit # Type check
```
````

- [ ] **Step 2: Final commit**

```bash
git add README.md
git commit -m "docs: README with setup and architecture guide"
git tag v0.1.0
```

---

## Self-Review

### Spec coverage

| Requirement | Task |
|-------------|------|
| Extract framework | Tasks 1–7 |
| Announcement feature | Tasks 8–11 |
| All 10 layers demonstrated | Tasks 8–11 |
| Storefront integration | Task 14 (widget) + Task 7 (proxy route) |
| Auth / webhooks | Tasks 6–7 |
| GDPR handlers | Task 6 |
| Tests | Task 13 |
| README | Task 16 |

### Known gaps

- **Codegen**: Not set up (complex to scaffold without a live Shopify API connection). Add after `shopify app dev` is running.
- **Tailwind CSS**: Not configured (no `tailwind.config.js`). Add if styling beyond inline is needed.
- **Billing**: Not included — add when needed using the same feature pattern.

### Type consistency check

- `ActionResponse<T>` defined in Task 4, used in Tasks 8–9 ✓
- `GraphQLRequest` defined in Task 4, used in Task 6 ✓
- `CreateAnnouncementInput` defined in Task 8, used in Tasks 9–11 ✓
- `announcementKeys` defined in Task 10, used in same task ✓
- Repository functions named consistently across service, actions, tests ✓
