import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken } from "@/shared/utils";
import { handleSessionToken } from "@/lib/shopify";
import { SHOPIFY_API_VERSION } from "@/shared/constants";

interface PlanConfig {
  name: string;
  amount: number;
  currencyCode: string;
  interval: "EVERY_30_DAYS" | "ANNUAL";
  trialDays?: number;
}

const PLAN_CONFIGS: Record<string, PlanConfig> = {
  basic: {
    name: "Basic Plan",
    amount: 9.99,
    currencyCode: "USD",
    interval: "EVERY_30_DAYS",
    trialDays: 7,
  },
  pro: {
    name: "Pro Plan",
    amount: 29.99,
    currencyCode: "USD",
    interval: "EVERY_30_DAYS",
    trialDays: 14,
  },
};

const CREATE_SUBSCRIPTION_MUTATION = `
  mutation AppSubscriptionCreate(
    $name: String!
    $returnUrl: URL!
    $test: Boolean
    $trialDays: Int
    $lineItems: [AppSubscriptionLineItemInput!]!
  ) {
    appSubscriptionCreate(
      name: $name
      returnUrl: $returnUrl
      test: $test
      trialDays: $trialDays
      lineItems: $lineItems
    ) {
      appSubscription {
        id
        name
        status
        trialDays
      }
      confirmationUrl
      userErrors {
        field
        message
      }
    }
  }
`;

async function shopifyGraphQL<T>(
  shop: string,
  accessToken: string,
  query: string,
  variables: Record<string, unknown>
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

export async function POST(request: NextRequest) {
  const sessionToken = extractBearerToken(request.headers.get("authorization"));
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let shop: string;
  let accessToken: string;

  try {
    const { shop: resolvedShop, session } = await handleSessionToken(sessionToken);
    if (!session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    shop = resolvedShop;
    accessToken = session.accessToken;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { planName?: string };
  try {
    body = (await request.json()) as { planName?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { planName } = body;
  if (!planName) {
    return NextResponse.json({ error: "Missing planName" }, { status: 400 });
  }

  const plan = PLAN_CONFIGS[planName.toLowerCase()];
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
  }

  try {
    const host = process.env.HOST?.replace(/https?:\/\//, "") ?? "";
    const returnUrl = `https://${host}/api/billing/confirm?shop=${shop}&planName=${encodeURIComponent(planName)}`;
    const isTest = process.env.NODE_ENV !== "production";

    const result = await shopifyGraphQL<{
      appSubscriptionCreate: {
        appSubscription: { id: string; name: string; status: string; trialDays: number } | null;
        confirmationUrl: string | null;
        userErrors: { field: string[]; message: string }[];
      };
    }>(shop, accessToken, CREATE_SUBSCRIPTION_MUTATION, {
      name: plan.name,
      returnUrl,
      test: isTest,
      trialDays: plan.trialDays ?? null,
      lineItems: [
        {
          plan: {
            appRecurringPricingDetails: {
              price: { amount: plan.amount, currencyCode: plan.currencyCode },
              interval: plan.interval,
            },
          },
        },
      ],
    });

    if (result.errors?.length) {
      console.error("[Billing] GraphQL errors:", result.errors);
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    const payload = result.data?.appSubscriptionCreate;
    if (!payload) {
      return NextResponse.json({ error: "No response from Shopify" }, { status: 500 });
    }

    if (payload.userErrors.length > 0) {
      const msg = payload.userErrors[0]?.message ?? "Shopify billing error";
      return NextResponse.json({ error: msg }, { status: 422 });
    }

    if (!payload.confirmationUrl) {
      return NextResponse.json({ error: "No confirmation URL returned" }, { status: 500 });
    }

    return NextResponse.json({ confirmationUrl: payload.confirmationUrl });
  } catch (error) {
    console.error("[Billing] Error creating subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
