export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export function isSessionExpired(expires: Date | null | undefined): boolean {
  if (!expires) return false;
  return new Date() >= expires;
}
