"use server";

import { handleSessionToken } from "@/lib/shopify";

/**
 * Validate a session token and return shop info.
 * Throws if the token is invalid or session cannot be established.
 */
export async function validateSessionAction(
  sessionToken: string
): Promise<{ valid: true; shop: string }> {
  const { shop } = await handleSessionToken(sessionToken, false, false);
  return { valid: true, shop };
}

/**
 * Store the session (and access token) in the database.
 */
export async function storeToken(sessionToken: string): Promise<void> {
  await handleSessionToken(sessionToken, false, true, true);
}

/**
 * Refresh the session by performing a full token exchange and storing the result.
 */
export async function refreshSessionAction(
  sessionToken: string
): Promise<{ shop: string }> {
  const { shop } = await handleSessionToken(sessionToken, false, true, true);
  return { shop };
}
