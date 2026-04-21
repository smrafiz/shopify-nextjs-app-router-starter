import prisma from "./prisma-connect";

export async function upsertShop(domain: string): Promise<void> {
  await prisma.shop.upsert({
    where: { domain },
    update: {},
    create: { domain },
  });
}

export async function getShopSetupStatus(
  domain: string
): Promise<{ setupComplete: boolean; webhooksRegistered: boolean }> {
  const shop = await prisma.shop.findUnique({
    where: { domain },
    select: { setupComplete: true, webhooksRegistered: true },
  });
  return shop ?? { setupComplete: false, webhooksRegistered: false };
}

export async function claimSetupLock(domain: string): Promise<boolean> {
  const now = new Date();
  const lockExpiry = new Date(now.getTime() - 5 * 60 * 1000);

  const result = await prisma.shop.updateMany({
    where: {
      domain,
      OR: [
        { lastSetupCheck: null },
        { lastSetupCheck: { lt: lockExpiry } },
      ],
    },
    data: { lastSetupCheck: now },
  });
  return result.count > 0;
}

export async function releaseSetupLock(domain: string): Promise<void> {
  await prisma.shop.update({
    where: { domain },
    data: { lastSetupCheck: null },
  });
}

export async function markSetupComplete(domain: string): Promise<void> {
  await prisma.shop.update({
    where: { domain },
    data: { setupComplete: true },
  });
}

export async function markWebhooksRegistered(domain: string): Promise<void> {
  await prisma.shop.update({
    where: { domain },
    data: { webhooksRegistered: true },
  });
}
