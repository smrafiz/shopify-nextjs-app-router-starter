import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { findOfflineSessionByShop } from "@/shared/repositories";
import { SHOPIFY_API_VERSION } from "@/shared/constants";

const SHOP_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;

function validateShopifyHmac(searchParams: URLSearchParams): boolean {
  const hmac = searchParams.get("hmac");
  if (!hmac) return false;

  const params = new URLSearchParams(searchParams);
  params.delete("hmac");

  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const expectedHmac = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET!)
    .update(sortedParams)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac));
}

const GET_ACTIVE_SUBSCRIPTIONS_QUERY = `
  query GetActiveSubscriptions {
    currentAppInstallation {
      activeSubscriptions {
        id
        name
        status
        currentPeriodEnd
        trialDays
        test
      }
    }
  }
`;

async function shopifyGraphQL<T>(
  shop: string,
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<{ data?: T; errors?: { message: string }[] }> {
  const endpoint = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Shopify API returned ${res.status}`);
  }

  return res.json() as Promise<{ data?: T; errors?: { message: string }[] }>;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const baseUrl = process.env.HOST || "http://localhost:3000";

  if (!validateShopifyHmac(searchParams)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const shopParam = searchParams.get("shop") ?? "";
  if (!SHOP_PATTERN.test(shopParam)) {
    return NextResponse.redirect(new URL("/billing?error=invalid_shop", baseUrl));
  }

  const chargeIdParam = searchParams.get("charge_id") ?? "";
  if (!/^\d+$/.test(chargeIdParam)) {
    return NextResponse.redirect(new URL("/billing?error=invalid_charge", baseUrl));
  }

  const shop = shopParam;
  const chargeId = chargeIdParam;

  let accessToken: string | undefined;

  try {
    const session = await findOfflineSessionByShop(shop);
    accessToken = session?.accessToken;
  } catch {
    // Session lookup failed — fall through to error redirect
  }

  if (!accessToken) {
    return NextResponse.redirect(new URL("/billing?error=unauthorized", request.url));
  }

  try {
    const result = await shopifyGraphQL<{
      currentAppInstallation: {
        activeSubscriptions: {
          id: string;
          name: string;
          status: string;
          currentPeriodEnd: string | null;
          trialDays: number;
          test: boolean;
        }[];
      };
    }>(shop, accessToken, GET_ACTIVE_SUBSCRIPTIONS_QUERY);

    if (result.errors?.length) {
      console.error("[Billing] Confirm GraphQL errors:", result.errors);
      return NextResponse.redirect(new URL("/billing?error=shopify_error", request.url));
    }

    const subscriptions =
      result.data?.currentAppInstallation?.activeSubscriptions ?? [];

    // Shopify sends a numeric charge_id; GraphQL IDs are GID format.
    const normalizedChargeId = chargeId.startsWith("gid://")
      ? chargeId
      : `gid://shopify/AppSubscription/${chargeId}`;

    const matched = subscriptions.find((s) => s.id === normalizedChargeId);

    if (!matched) {
      return NextResponse.redirect(
        new URL("/billing?error=subscription_not_found", request.url)
      );
    }

    if (matched.status.toUpperCase() !== "ACTIVE") {
      return NextResponse.redirect(
        new URL(
          `/billing?error=subscription_not_active&status=${matched.status.toLowerCase()}`,
          request.url
        )
      );
    }

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("[Billing] Error confirming subscription:", error);
    return NextResponse.redirect(new URL("/billing?error=internal_error", request.url));
  }
}
