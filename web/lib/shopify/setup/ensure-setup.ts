/**
 * Ensure Setup Service
 *
 * Lazily ensures app setup is complete when the app loads.
 * This is a safety net in case installation-time setup (runAppSetup) fails
 * or the shop reinstalls the app.
 *
 * Add feature-specific checks here that mirror the tasks in app-setup.ts.
 */

import { handleSessionToken } from "@/lib/shopify";
import { getShopSetupStatus } from "@/shared/repositories";

/**
 * Ensures all app setup is complete for the authenticated shop.
 * Call this on app load to guarantee everything is ready.
 *
 * @param sessionToken - Session token for authentication.
 * @returns Result with overall success and any errors encountered.
 */
export async function ensureAppSetup(
  sessionToken: string,
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    const {
      session: { shop },
    } = await handleSessionToken(sessionToken);

    const { setupComplete } = await getShopSetupStatus(shop);

    if (setupComplete) {
      return { success: true, errors: [] };
    }

    // Add feature-specific setup checks here.
    // Each check should be idempotent and mirror a task in runAppSetup.
    // Example:
    //   const metafieldResult = await ensureMetafieldDefinition(sessionToken);
    //   if (!metafieldResult.success && metafieldResult.error) {
    //     errors.push(`Metafield: ${metafieldResult.error}`);
    //   }
  } catch (error) {
    console.error("[EnsureSetup] Setup check failed:", error);
    errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return {
    success: errors.length === 0,
    errors,
  };
}
