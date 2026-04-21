import { deleteSessionsByShop } from "@/shared/repositories";

export async function handleAppUninstalled(
  shop: string,
  _body: string
): Promise<void> {
  try {
    await deleteSessionsByShop(shop);
    console.log(`[Webhook] app/uninstalled: cleaned sessions for ${shop}`);
  } catch (err) {
    console.error(`[Webhook] app/uninstalled failed for ${shop}:`, err);
    throw err;
  }
}
