export const PLANS = {
  FREE: "free",
  BASIC: "basic",
  PRO: "pro",
} as const;

export type PlanName = (typeof PLANS)[keyof typeof PLANS];

export const PLAN_LIMITS = {
  [PLANS.FREE]: { maxItems: 5, features: ["basic"] },
  [PLANS.BASIC]: { maxItems: 50, features: ["basic", "analytics"] },
  [PLANS.PRO]: { maxItems: Infinity, features: ["basic", "analytics", "advanced"] },
} as const;
