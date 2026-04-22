"use client";

import { useQuery } from "@tanstack/react-query";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getCurrentPlanAction } from "@/shared/actions";
import { planKeys } from "./query-keys";

export function useCurrentPlan() {
  const shopify = useAppBridge();

  return useQuery({
    queryKey: planKeys.current(),
    queryFn: async () => {
      const token = await shopify.idToken();
      const result = await getCurrentPlanAction(token);
      if (result.status === "error") throw new Error(result.message);
      return result.data;
    },
  });
}
