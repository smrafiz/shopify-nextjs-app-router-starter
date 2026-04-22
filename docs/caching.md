# Caching

## dynamicIO

`experimental.dynamicIO: true` is enabled in `next.config.js`. This opts into Next.js's newer caching model where static and dynamic data fetching is explicit rather than automatic. Fetches inside `use cache` regions are cached; everything else is treated as dynamic.

```js
// next.config.js
experimental: {
  dynamicIO: true,
  cacheComponents: true,
  turbopackFileSystemCacheForDev: true,
}
```

`cacheComponents: true` enables component-level caching. `turbopackFileSystemCacheForDev` speeds up dev rebuilds by persisting the Turbopack cache to disk.

## Custom cacheLife Profiles

Two profiles are defined for dashboard data:

| Profile | stale | revalidate | expire |
|---|---|---|---|
| `dashboard` | 30s | 60s | 300s (5 min) |
| `dashboard-long` | 300s | 600s | 3600s (1 hr) |

Use `dashboard` for data that changes frequently (recent activity, counters). Use `dashboard-long` for data that rarely changes (settings, plan info, shop config).

```ts
import { unstable_cacheLife as cacheLife } from "next/cache";

async function getDashboardStats(shopDomain: string) {
  "use cache";
  cacheLife("dashboard");

  return fetchStats(shopDomain);
}
```

The `global.d.ts` file augments the `next/cache` module to expose these profile names as typed strings, so you get autocomplete.

## Per-Shop Tag Invalidation

When shop data changes, invalidate only that shop's cached data using `revalidateTag`:

```ts
import { revalidateTag } from "next/cache";

// After updating shop settings
revalidateTag(`shop-${domain}`);
```

Tag your cached functions with the shop domain:

```ts
import { unstable_cacheTag as cacheTag } from "next/cache";

async function getShopSettings(domain: string) {
  "use cache";
  cacheLife("dashboard-long");
  cacheTag(`shop-${domain}`);

  return prisma.appSettings.findFirst({ where: { shop: { domain } } });
}
```

This is important in multi-tenant apps. Without per-shop tags, invalidating one shop's cache would flush cached data for all shops.

## React Query Caching

Client-side data is cached by TanStack Query. The `TanstackProvider` configures:

- `retry: 2` — retry failed requests twice before surfacing an error
- `staleTime: 1000 * 60 * 5` — 5 minutes before data is considered stale
- `gcTime: 1000 * 60 * 10` — keep unused cache entries for 10 minutes

Individual `useGraphQL` calls can override `staleTime` per query.

## Server-Side Hydration

The root layout passes a `dehydratedState` prop to `Providers`. This lets you prefetch data on the server and hydrate the React Query cache on the client without a loading flash:

```tsx
// app/dashboard/page.tsx
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function DashboardPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({ queryKey: [...], queryFn: ... });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContent />
    </HydrationBoundary>
  );
}
```
