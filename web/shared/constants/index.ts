import { ApiVersion } from "@shopify/shopify-api";

export const SHOPIFY_API_VERSION = ApiVersion.January26;

export const ROUTES = {
  DASHBOARD: "/",
  ANNOUNCEMENTS: "/announcements",
} as const;
