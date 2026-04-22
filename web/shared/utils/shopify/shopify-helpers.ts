import { isValidShopDomain } from "../domain.utils";

export function parseGid(gid: string): string {
  const parts = gid.split("/");
  return parts[parts.length - 1];
}

export function buildGid(type: string, id: string): string {
  return `gid://shopify/${type}/${id}`;
}

export function formatShopifyPrice(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}

export function getShopDomainFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const shop = parsed.searchParams.get("shop");
    if (shop && isValidShopDomain(shop)) {
      return shop;
    }
    return null;
  } catch {
    return null;
  }
}
