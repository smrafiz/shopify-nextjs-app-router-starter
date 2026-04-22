# Testing

## Setup

Jest is configured at `web/jest.config.ts` using ts-jest with ESM mode. All path aliases from `tsconfig.json` are automatically mapped via `pathsToModuleNameMapper`.

```bash
cd web
pnpm test            # run all tests
pnpm test:watch      # watch mode
pnpm test:coverage   # with coverage report
```

Tests match `**/*.test.ts` and `**/*.test.tsx`. Put test files next to the code they test, or under `web/tests/` for infrastructure tests.

## What's Auto-Mocked in Every Test

`web/tests/setup/jest.setup.ts` runs before every test file and sets up:

- **Zustand** — mocked to a no-op store (prevents state leaking between tests)
- **Prisma** — `@/shared/repositories/prisma-connect` is replaced with `prismaMock`
- **isomorphic-dompurify** — `sanitize()` returns the input unchanged
- **Zod** — replaced with a chainable stub that passes all values through
- **Environment variables** — test values set for `DATABASE_URL`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `HOST`, `SCOPES`, `ENCRYPTION_KEY`

`resetPrismaMock()` and `shopifyMock.reset()` are called in `beforeEach` automatically.

## Prisma Mock

```ts
import { prismaMock } from "@/tests/mocks/prisma/prisma.mock";

it("returns shop settings", async () => {
  prismaMock.appSettings.findFirst.mockResolvedValue({
    id: "1",
    shopId: "shop-1",
    maxBundlesPerShop: 10,
    // ...
  });

  const result = await getAppSettings("my-shop.myshopify.com");
  expect(result.maxBundlesPerShop).toBe(10);
  expect(prismaMock.appSettings.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({ where: { shop: { domain: "my-shop.myshopify.com" } } })
  );
});
```

`prismaMock` is a deep mock of `PrismaClient` via jest-mock-extended. Every model and method is a Jest mock function. `resetPrismaMock()` clears all mock implementations and call history.

The generated Prisma client is also mocked in `moduleNameMapper`:

```
"^@/prisma/generated/client$": "<rootDir>/tests/__mocks__/prisma-client.mock.ts"
```

## Shopify GraphQL Mock

`ShopifyGraphQLMock` mocks at the operation level — you register mock responses by operation name, not by URL.

```ts
import { shopifyMock } from "@/tests/mocks/shopify/shopify-graphql.mock";

it("loads products", async () => {
  shopifyMock.mockQuery("GetProducts", {
    products: {
      nodes: [{ id: "gid://shopify/Product/1", title: "Test" }]
    }
  });

  const result = await shopifyMock.execute("query GetProducts { ... }");
  expect(result.data.products.nodes).toHaveLength(1);
});

it("handles GraphQL errors", async () => {
  shopifyMock.mockError("GetProducts", "Product not found");

  await expect(shopifyMock.execute("query GetProducts { ... }")).rejects.toThrow("Product not found");
});
```

The `reset()` method clears all registered responses and errors. It's called automatically in `beforeEach` via `jest.setup.ts`.

A `mockShopifyProducts` fixture is exported for common test data.

## Test Utilities

```ts
import { render, createTestQueryClient, mockUseAppBridge, waitForLoadingToFinish }
  from "@/tests/setup/test-utils";
```

- **`render()`** — custom render that wraps the component in `QueryClientProvider` with a fresh query client (retry: false, gcTime: 0)
- **`createTestQueryClient()`** — creates a QueryClient configured for tests (no retries, instant GC)
- **`mockUseAppBridge()`** — returns a mock App Bridge instance with a working `idToken()` promise
- **`waitForLoadingToFinish()`** — `setTimeout(resolve, 0)` — flushes the microtask queue

## Example: Testing a Server Action

```ts
import { prismaMock } from "@/tests/mocks/prisma/prisma.mock";
import { getAnnouncements } from "@/features/announcements/actions/announcements.actions";

describe("getAnnouncements", () => {
  it("returns active announcements for shop", async () => {
    prismaMock.announcement.findMany.mockResolvedValue([
      { id: "1", title: "Summer Sale", isActive: true, type: "PROMO" }
    ]);

    const result = await getAnnouncements("test-shop.myshopify.com");

    expect(result).toHaveLength(1);
    expect(prismaMock.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true })
      })
    );
  });
});
```

## TypeScript in Tests

ts-jest runs in ESM mode with `useESM: true`. The `ignoreDeprecations: "6.0"` flag suppresses TypeScript 5.x deprecation warnings that ts-jest hasn't fully addressed yet. `skipLibCheck: true` is set in the test tsconfig to speed up compilation.
