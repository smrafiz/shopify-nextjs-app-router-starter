import prisma from "./prisma-connect";
import { Session as ShopifySession } from "@shopify/shopify-api";
import { encryptToken, decryptToken, isEncrypted } from "@/lib/crypto";

const apiKey = process.env.SHOPIFY_API_KEY || "";

/**
 * Persist a Shopify session to the database, encrypting the access token.
 */
export async function storeSession(session: ShopifySession) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(async (tx: any) => {
        await tx.session.upsert({
            where: { id: session.id },
            update: {
                shop: session.shop,
                accessToken: session.accessToken
                    ? encryptToken(session.accessToken)
                    : null,
                scope: session.scope,
                expires: session.expires,
                isOnline: session.isOnline,
                state: session.state,
                apiKey,
            },
            create: {
                id: session.id,
                shop: session.shop,
                accessToken: session.accessToken
                    ? encryptToken(session.accessToken)
                    : null,
                scope: session.scope,
                expires: session.expires,
                isOnline: session.isOnline,
                state: session.state,
                apiKey,
            },
        });

        if (session.onlineAccessInfo) {
            const onlineInfo = await tx.onlineAccessInfo.upsert({
                where: { sessionId: session.id },
                update: {
                    expiresIn: session.onlineAccessInfo.expires_in,
                    associatedUserScope:
                        session.onlineAccessInfo.associated_user_scope,
                },
                create: {
                    sessionId: session.id,
                    expiresIn: session.onlineAccessInfo.expires_in,
                    associatedUserScope:
                        session.onlineAccessInfo.associated_user_scope,
                },
            });

            const u = session.onlineAccessInfo.associated_user;
            await tx.associatedUser.upsert({
                where: { onlineAccessInfoId: onlineInfo.id },
                update: {
                    firstName: u.first_name,
                    lastName: u.last_name,
                    email: u.email,
                    emailVerified: u.email_verified,
                    accountOwner: u.account_owner,
                    locale: u.locale,
                    collaborator: u.collaborator,
                    userId: u.id,
                },
                create: {
                    onlineAccessInfoId: onlineInfo.id,
                    firstName: u.first_name,
                    lastName: u.last_name,
                    email: u.email,
                    emailVerified: u.email_verified,
                    accountOwner: u.account_owner,
                    locale: u.locale,
                    collaborator: u.collaborator,
                    userId: u.id,
                },
            });
        }
    });
}

export async function loadSession(id: string): Promise<ShopifySession> {
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) throw new NoSessionFoundError();
    return toShopifySession(session);
}

export async function deleteSession(id: string): Promise<void> {
    await prisma.session.delete({ where: { id } });
}

export async function deleteSessions(ids: string[]): Promise<void> {
    await prisma.session.deleteMany({ where: { id: { in: ids } } });
}

export async function findSessionsByShop(
    shop: string,
): Promise<ShopifySession[]> {
    const sessions = await prisma.session.findMany({
        where: { shop, apiKey },
        include: {
            onlineAccessInfo: { include: { associatedUser: true } },
        },
    });
    return sessions.map(toShopifySession);
}

/**
 * Find the offline (permanent) session for a shop.
 */
export async function findOfflineSessionByShop(
    shop: string,
): Promise<ShopifySession> {
    const session = await prisma.session.findFirst({
        where: { shop, apiKey, isOnline: false },
        orderBy: { createdAt: "desc" },
    });
    if (!session) throw new NoSessionFoundError();
    return toShopifySession(session);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toShopifySession(session: any): ShopifySession {
    let accessToken: string | undefined;

    if (session.accessToken) {
        if (isEncrypted(session.accessToken)) {
            accessToken = decryptToken(session.accessToken);
        } else {
            accessToken = session.accessToken;
            // Auto-encrypt on first read
            prisma.session
                .update({
                    where: { id: session.id },
                    data: { accessToken: encryptToken(session.accessToken) },
                })
                .catch((encryptErr: unknown) =>
                    console.error(
                        `[Session] Failed to encrypt token for ${session.id}:`,
                        encryptErr,
                    ),
                );
        }
    }

    return new ShopifySession({
        id: session.id,
        shop: session.shop,
        accessToken,
        scope: session.scope || undefined,
        state: session.state,
        isOnline: session.isOnline,
        expires: session.expires || undefined,
    });
}

export class NoSessionFoundError extends Error {
    constructor() {
        super("Session not found");
        this.name = "NoSessionFoundError";
        Object.setPrototypeOf(this, NoSessionFoundError.prototype);
    }
}
