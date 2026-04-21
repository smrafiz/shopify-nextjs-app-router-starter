import { extractBearerToken, isSessionExpired, normalizeShopDomain } from "@/shared/utils";
import {
  findOfflineSessionByShop,
  storeSession,
  upsertShop,
  getShopSetupStatus,
  claimSetupLock,
  releaseSetupLock,
  markSetupComplete,
  markWebhooksRegistered,
} from "@/shared/repositories";
import shopify from "../config/initialize-context";
import { registerWebhooks } from "../webhooks/register";
import { RequestedTokenType, Session } from "@shopify/shopify-api";

export async function verifyRequest(
  req: Request,
  isOnline: boolean
): Promise<{ shop: string; session: Session }> {
  const sessionToken = extractBearerToken(req.headers.get("authorization"));
  if (!sessionToken) throw new Error("No bearer token present");
  return handleSessionToken(sessionToken, isOnline);
}

export async function tokenExchange({
  shop,
  sessionToken,
  online,
  store,
  forceRefresh,
}: {
  shop: string;
  sessionToken: string;
  online?: boolean;
  store?: boolean;
  forceRefresh?: boolean;
}): Promise<Session> {
  if (!online && !forceRefresh) {
    try {
      const existing = await findOfflineSessionByShop(shop);
      if (existing?.accessToken && !isSessionExpired(existing.expires)) {
        return existing;
      }
    } catch {
      // Session doesn't exist yet
    }
  }

  const { session } = await shopify.auth.tokenExchange({
    shop,
    sessionToken,
    requestedTokenType: online
      ? RequestedTokenType.OnlineAccessToken
      : RequestedTokenType.OfflineAccessToken,
  });

  if (store || forceRefresh) await storeSession(session);
  return session;
}

export async function handleSessionToken(
  sessionToken: string,
  online?: boolean,
  store?: boolean,
  forceRefresh?: boolean
): Promise<{ shop: string; session: Session }> {
  const payload = await shopify.session.decodeSessionToken(sessionToken);
  const shop = normalizeShopDomain(payload.dest);

  const session = await tokenExchange({
    shop,
    sessionToken,
    online,
    store: store !== false,
    forceRefresh,
  });

  if (store !== false) {
    try {
      const { setupComplete, webhooksRegistered } = await getShopSetupStatus(shop);
      if (setupComplete && webhooksRegistered) return { shop, session };

      await upsertShop(shop);

      if (session.accessToken && (await claimSetupLock(shop))) {
        let webhooksSucceeded = false;
        try {
          if (!webhooksRegistered) {
            await registerWebhooks(session);
            await markWebhooksRegistered(shop);
          }
          webhooksSucceeded = true;
        } catch (err) {
          console.error("[Auth] Webhook registration failed:", err);
        }

        if (webhooksSucceeded) {
          await markSetupComplete(shop);
        } else {
          await releaseSetupLock(shop);
        }
      }
    } catch (err) {
      console.error("[Auth] Shop setup failed:", err);
    }
  }

  return { shop, session };
}
