import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter, RATE_LIMIT_RESPONSE } from "@/lib/rate-limit";
import { findOfflineSessionByShop } from "@/shared/repositories";
import { executeGraphQLQuery } from "@/lib/graphql/client/server-action";
import { verifyProxyHmac } from "@/lib/shopify/proxy";

const checkRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 100,
});

const PRODUCTS_QUERY = `
  query GetProducts($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        handle
        featuredImage {
          url
          altText
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 10) {
          nodes {
            id
            title
            price
            compareAtPrice
            availableForSale
          }
        }
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    if (!verifyProxyHmac(searchParams)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shop = searchParams.get("shop") ?? "";
    if (!shop) {
      return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
    }

    if (!checkRateLimit(shop)) {
      return RATE_LIMIT_RESPONSE;
    }

    const ids = searchParams.get("ids") ?? "";
    const limitParam = parseInt(searchParams.get("limit") ?? "10", 10);
    const limit = Math.min(Math.max(1, limitParam), 50);

    if (!ids) {
      return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 });
    }

    const session = await findOfflineSessionByShop(shop);
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Shop authentication required" }, { status: 401 });
    }

    // Validate each id is numeric or already a valid GID
    const NUMERIC_ID = /^\d+$/;
    const FULL_GID = /^gid:\/\/shopify\/Product\/\d+$/;

    const rawIds = ids
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, limit);

    const validatedIds = rawIds.filter(id => NUMERIC_ID.test(id) || FULL_GID.test(id));

    const productIds = validatedIds
      .map((id) => (id.includes("gid://") ? id : `gid://shopify/Product/${id}`));

    const result = await executeGraphQLQuery<{ nodes: any[] }>({
      query: PRODUCTS_QUERY,
      variables: { ids: productIds },
      shop,
      accessToken: session.accessToken,
    });

    if (result.errors?.length) {
      console.error("[Proxy Products] GraphQL error:", result.errors);
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    const products = (result.data?.nodes ?? [])
      .filter((node): node is NonNullable<typeof node> => node != null)
      .map((node) => {
        const firstVariant = node.variants?.nodes?.[0];
        return {
          id: node.id,
          title: node.title,
          handle: node.handle,
          featuredImage: node.featuredImage ?? null,
          priceRange: node.priceRange,
          variants: node.variants?.nodes ?? [],
          variantId: firstVariant?.id ?? null,
          price: firstVariant?.price ?? null,
          compareAtPrice: firstVariant?.compareAtPrice ?? null,
          availableForSale: firstVariant?.availableForSale ?? true,
        };
      });

    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error as any).digest === "NEXT_PRERENDER_INTERRUPTED"
    ) {
      throw error;
    }
    console.error("[Proxy Products] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
