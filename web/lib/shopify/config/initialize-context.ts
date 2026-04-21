import "@shopify/shopify-api/adapters/web-api";
import { SHOPIFY_API_VERSION } from "@/shared/constants";
import { shopifyApi, LogSeverity } from "@shopify/shopify-api";

const REQUIRED_ENV = ["SHOPIFY_API_KEY", "SHOPIFY_API_SECRET"] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SCOPES?.split(",") || ["read_products"],
  hostName: process.env.HOST?.replace(/https?:\/\//, "") || "",
  hostScheme: "https",
  isEmbeddedApp: true,
  apiVersion: SHOPIFY_API_VERSION,
  logger: {
    level:
      process.env.NODE_ENV === "development"
        ? LogSeverity.Debug
        : LogSeverity.Error,
  },
});

export default shopify;
