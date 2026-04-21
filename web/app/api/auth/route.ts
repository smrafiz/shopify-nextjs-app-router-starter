import { NextRequest, NextResponse } from "next/server";
import { isValidShopDomain } from "@/shared/utils";

const CLIENT_ID = process.env.SHOPIFY_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");
  const returnTo = searchParams.get("returnTo") || "/";

  if (!CLIENT_ID) {
    return NextResponse.json({ error: "Authentication unavailable" }, { status: 500 });
  }

  if (!shop || !isValidShopDomain(shop)) {
    return NextResponse.json({ error: "Invalid or missing shop domain" }, { status: 400 });
  }

  const sanitizedReturnTo = /^\/[a-zA-Z0-9/_-]*$/.test(returnTo) ? returnTo : "/";
  const embeddedUrl = `https://${shop}/admin/apps/${CLIENT_ID}${sanitizedReturnTo}`;
  return NextResponse.redirect(embeddedUrl);
}
