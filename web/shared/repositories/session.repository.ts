import prisma from "./prisma-connect";
import { Session } from "@shopify/shopify-api";

export async function findOfflineSessionByShop(
  shop: string
): Promise<Session | null> {
  const record = await prisma.session.findFirst({
    where: { shop, isOnline: false },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return null;
  return record as unknown as Session;
}

export async function storeSession(session: Session): Promise<void> {
  const apiKey = process.env.SHOPIFY_API_KEY!;
  await prisma.$transaction([
    prisma.session.upsert({
      where: { id: session.id },
      update: {
        accessToken: session.accessToken,
        expires: session.expires,
        scope: session.scope,
        state: session.state ?? "",
        isOnline: session.isOnline,
        apiKey,
      },
      create: {
        id: session.id,
        shop: session.shop,
        accessToken: session.accessToken,
        expires: session.expires,
        isOnline: session.isOnline,
        scope: session.scope,
        state: session.state ?? "",
        apiKey,
      },
    }),
  ]);
}

export async function deleteSessionsByShop(shop: string): Promise<void> {
  await prisma.session.deleteMany({ where: { shop } });
}
