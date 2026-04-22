"use server";

import { handleSessionToken } from "@/lib/shopify";
import { executeGraphQLQuery } from "@/lib";
import type { ActionResponse } from "@/shared/types";
import { SHOPIFY_API_VERSION } from "@/shared/constants";

interface CurrentSubscription {
  plan: string;
  status: string;
  trialDaysRemaining: number | null;
}

const APP_SUBSCRIPTION_QUERY = `
  query CurrentAppSubscription {
    currentAppInstallation {
      activeSubscriptions {
        name
        status
        trialDays
        createdAt
        currentPeriodEnd
        test
      }
    }
  }
`;

interface AppSubscriptionQueryResult {
  currentAppInstallation: {
    activeSubscriptions: Array<{
      name: string;
      status: string;
      trialDays: number;
      createdAt: string;
      currentPeriodEnd: string | null;
      test: boolean;
    }>;
  };
}

/**
 * Get the shop's current subscription via Shopify Admin GraphQL.
 * Returns plan name, status, and trial days remaining (if applicable).
 */
export async function getCurrentPlanAction(
  sessionToken: string
): Promise<ActionResponse<CurrentSubscription>> {
  try {
    const { shop, session } = await handleSessionToken(sessionToken, false, false);

    if (!session.accessToken) {
      return { status: "error", message: "No access token in session" };
    }

    const result = await executeGraphQLQuery<AppSubscriptionQueryResult>({
      query: APP_SUBSCRIPTION_QUERY,
      sessionToken,
      shop,
      accessToken: session.accessToken,
    });

    if (result.errors?.length) {
      return {
        status: "error",
        message: result.errors.map((e) => e.message).join(", "),
      };
    }

    const subscriptions =
      result.data?.currentAppInstallation?.activeSubscriptions ?? [];

    if (subscriptions.length === 0) {
      return {
        status: "success",
        data: { plan: "free", status: "ACTIVE", trialDaysRemaining: null },
      };
    }

    const sub = subscriptions[0];
    let trialDaysRemaining: number | null = null;

    if (sub.trialDays > 0 && sub.currentPeriodEnd) {
      const msRemaining = new Date(sub.currentPeriodEnd).getTime() - Date.now();
      trialDaysRemaining = Math.max(
        0,
        Math.ceil(msRemaining / (1000 * 60 * 60 * 24))
      );
    }

    return {
      status: "success",
      data: {
        plan: sub.name,
        status: sub.status,
        trialDaysRemaining,
      },
    };
  } catch (error) {
    console.error("[getCurrentPlanAction] Error:", error);
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to fetch plan data",
    };
  }
}
