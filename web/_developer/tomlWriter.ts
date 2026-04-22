import fs from "fs";
import "dotenv/config";
import path from "path";
import toml from "@iarna/toml";
import setupCheck from "./setupCheck";
import type { AppConfig } from "./types/toml";
import { SHOPIFY_API_VERSION } from "../shared/constants";

const config: AppConfig = {} as AppConfig;

try {
  setupCheck();

  let appUrl = process.env.SHOPIFY_APP_URL || "https://example.com";
  if (appUrl.endsWith("/")) appUrl = appUrl.slice(0, -1);

  // Global app config
  config.name = process.env.APP_NAME!;
  config.handle = process.env.APP_HANDLE!;
  config.client_id = process.env.SHOPIFY_API_KEY!;
  config.application_url = appUrl;
  config.embedded = true;
  config.extension_directories = ["extension/extensions/*"];

  // App Proxy
  config.app_proxy = {
    url: `${appUrl}/api/proxy`,
    subpath: "announcements",
    prefix: "apps",
  };

  // Build
  config.build = {
    include_config_on_deploy: true,
    automatically_update_urls_on_dev:
      process.env.AUTO_UPDATE_URL === "true",
    dev_store_url: process.env.DEV_STORE_URL ?? "",
  };

  // Webhooks
  config.webhooks = {
    api_version: SHOPIFY_API_VERSION,
    subscriptions: [
      {
        topics: ["app/uninstalled"],
        uri: "/api/webhooks",
      },
      {
        compliance_topics: [
          "customers/data_request",
          "customers/redact",
          "shop/redact",
        ],
        uri: "/api/webhooks",
      },
    ],
  };

  // Access
  if (
    process.env.DIRECT_API_MODE &&
    process.env.EMBEDDED_APP_DIRECT_API_ACCESS
  ) {
    config.access = {
      admin: {
        direct_api_mode: process.env.DIRECT_API_MODE as "online" | "offline",
        embedded_app_direct_api_access:
          process.env.EMBEDDED_APP_DIRECT_API_ACCESS === "true",
      },
    };
  }

  // Access scopes
  config.access_scopes = {
    scopes: process.env.SCOPES!,
    optional_scopes:
      process.env.SHOPIFY_API_OPTIONAL_SCOPES?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) || [],
    use_legacy_install_flow: false,
  };

  // Auth
  config.auth = { redirect_urls: [] };

  // POS
  config.pos = { embedded: process.env.POS_EMBEDDED === "true" };

  // Write TOML
  const addHeader = (str: string) =>
    `# Avoid writing to toml directly. Use your .env file instead\n\n${str}`;

  const globalTomlPath = path.join(process.cwd(), "..", "shopify.app.toml");

  fs.writeFileSync(globalTomlPath, addHeader(toml.stringify(config as any)));
  console.log("✅ Written shopify.app.toml");
} catch (e: any) {
  console.error("❌ An error occurred while writing TOML files");
  console.error(e.message || e);
}
