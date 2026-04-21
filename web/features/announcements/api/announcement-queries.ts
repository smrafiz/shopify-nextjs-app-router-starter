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
