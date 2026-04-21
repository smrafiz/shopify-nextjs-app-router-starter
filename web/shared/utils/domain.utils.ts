export function normalizeShopDomain(dest: string): string {
  return dest.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop);
}
