import shopify from "../config/initialize-context";
import { DeliveryMethod, Session } from "@shopify/shopify-api";
import { setupGDPRWebHooks } from "./gdpr";
import { handleAppUninstalled } from "./handlers";

let webhooksInitialized = false;

export function addHandlers(): void {
  if (webhooksInitialized) return;

  setupGDPRWebHooks("/api/webhooks");

  shopify.webhooks.addHandlers({
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/api/webhooks",
      callback: async (_topic, shop, body) => {
        await handleAppUninstalled(shop, body);
      },
    },
  });

  webhooksInitialized = true;
}

export async function registerWebhooks(session: Session): Promise<void> {
  addHandlers();

  if (!session.accessToken) throw new Error(`No access token for ${session.shop}`);
  if (!session.shop) throw new Error("No shop in session");

  const responses = await shopify.webhooks.register({ session });

  const failed = Object.entries(responses)
    .filter(([, results]) => results.some((r) => !r.success))
    .map(([topic]) => topic);

  if (failed.length > 0) {
    console.warn("[Webhooks] Failed topics:", failed.join(", "));
  }
}
