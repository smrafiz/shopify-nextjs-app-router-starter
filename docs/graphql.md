# GraphQL

## Codegen

Types are generated from the Shopify Admin API schema (version `2025-10`). The codegen config is at `web/codegen.ts`:

```ts
const config: CodegenConfig = {
  schema: `https://shopify.dev/admin-graphql-direct-proxy/${SHOPIFY_API_VERSION}`,
  documents: ["./lib/graphql/schema/**/*.graphql"],
  generates: {
    "./lib/graphql/generated/": {
      preset: "client",
    },
    "./shared/types/generated/admin.generated.d.ts": {
      preset,
      presetConfig: { apiType: ApiType.Admin },
    },
  },
};
```

Run it:

```bash
cd web && pnpm graphql-codegen
```

The `pnpm build` script runs codegen automatically via `prebuild`. Generated files are committed — you only need to re-run when you add or modify `.graphql` files.

## Writing Operations

Place `.graphql` files in `web/lib/graphql/schema/`. Codegen picks them up automatically on next run.

```graphql
# web/lib/graphql/schema/products.graphql
query GetProducts($first: Int!) {
  products(first: $first) {
    nodes {
      id
      title
      handle
      featuredImage {
        url
        altText
      }
    }
  }
}
```

After running codegen, import the typed document:

```ts
import { GetProductsDocument } from "@/lib/graphql/generated/graphql";
```

## useGraphQL Hook

`useGraphQL` wraps `useQuery` from TanStack Query. It fetches an App Bridge id token automatically, prints the document to a query string, and calls the server action.

```tsx
import { useGraphQL } from "@/shared/hooks/data/use-graphql";
import { GetProductsDocument } from "@/lib/graphql/generated/graphql";

function ProductList() {
  const { data, loading, error } = useGraphQL(
    GetProductsDocument,
    { first: 10 },
    { staleTime: 1000 * 60 * 5 }
  );

  if (loading) return <Spinner />;
  if (error) return <p>Failed to load products</p>;

  return data?.products.nodes.map(p => <p key={p.id}>{p.title}</p>);
}
```

The React Query cache key is derived from the operation name plus variables. Two calls with the same operation name and variables will share the cache.

**Options:**

| Option | Default | Description |
|---|---|---|
| `enabled` | `true` | Disable the query conditionally |
| `staleTime` | 5 minutes | How long cached data is considered fresh |
| `refetchOnMount` | `"always"` | Refetch when the component mounts |
| `refetchOnWindowFocus` | `false` | Don't refetch on tab switch |

## useGraphQLMutation Hook

```tsx
import { useGraphQLMutation } from "@/shared/hooks/data/use-graphql";
import { UpdateProductDocument, GetProductsDocument } from "@/lib/graphql/generated/graphql";

function EditProduct() {
  const mutation = useGraphQLMutation(UpdateProductDocument, {
    invalidate: [{ document: GetProductsDocument }],
    onSuccess: () => console.log("saved"),
    onError: (err) => console.error(err),
  });

  return (
    <button onClick={() => mutation.mutate({ id: "gid://...", title: "New title" })}>
      Save
    </button>
  );
}
```

The `invalidate` option takes a list of query documents to invalidate on success. It resolves cache keys the same way `useGraphQL` does.

## Error Handling

Both hooks throw if the response contains a `errors` array. The error message concatenates all error messages from the array. GraphQL field-level errors (partial data with errors) are treated as failures.

## API Version

The current API version is `ApiVersion.January26` (2025-10), set in `web/shared/constants/index.ts`. To upgrade, update the constant and re-run codegen.
