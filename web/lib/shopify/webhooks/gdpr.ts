import shopify from "../config/initialize-context";
import { DeliveryMethod } from "@shopify/shopify-api";

export function setupGDPRWebHooks(callbackUrl: string): void {
  shopify.webhooks.addHandlers({
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl,
      callback: async (_topic, shop, body) => {
        console.log(`[GDPR] customers/data_request from ${shop}:`, body);
      },
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl,
      callback: async (_topic, shop, body) => {
        console.log(`[GDPR] customers/redact from ${shop}:`, body);
      },
    },
    SHOP_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl,
      callback: async (_topic, shop) => {
        console.log(`[GDPR] shop/redact from ${shop}`);
      },
    },
  });
}
