/**
 * App Setup Service
 *
 * Handles one-time setup tasks during app installation (OAuth callback).
 * Extend this file to add install-time Shopify API operations such as
 * creating metafield definitions, automatic discounts, or webhooks that
 * cannot be registered through the standard webhook handler.
 */


interface SetupResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Runs all app setup tasks on installation.
 * Called during app authentication / OAuth callback.
 *
 * Add product-specific setup tasks here (metafields, discounts, etc.)
 * as your app grows.
 *
 * @param accessToken - Shopify access token.
 * @param shop - Shop domain.
 * @returns Result indicating overall success and any warnings.
 */
export async function runAppSetup(
  accessToken: string,
  shop: string,
): Promise<SetupResult> {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop)) {
    return {
      success: false,
      message: "App setup failed",
      error: `Invalid shop domain: ${shop}`,
    };
  }

  try {
    // Add install-time setup tasks here.
    // Example: create metafield definitions, automatic discounts, etc.
    // Each task should be idempotent (safe to run more than once).

    return {
      success: true,
      message: "App setup completed",
    };
  } catch (error) {
    console.error("[Setup] App setup failed:", error);
    return {
      success: false,
      message: "App setup failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
