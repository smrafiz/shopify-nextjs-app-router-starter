import { NextRequest, NextResponse } from "next/server";
import prisma from "@/shared/repositories/prisma-connect";
import { isValidShopDomain } from "@/shared/utils";
import { createRateLimiter, RATE_LIMIT_RESPONSE } from "@/lib/rate-limit";

const checkRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 100,
});

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop") ?? "";

  if (!isValidShopDomain(shop)) {
    return NextResponse.json({ error: "Invalid shop" }, { status: 400 });
  }

  if (!checkRateLimit(shop)) {
    return RATE_LIMIT_RESPONSE;
  }

  const now = new Date();

  const shopRecord = await prisma.shop.findUnique({ where: { domain: shop } });
  if (!shopRecord) return NextResponse.json({ announcement: null });

  const announcement = await prisma.announcement.findFirst({
    where: {
      shopId: shopRecord.id,
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      bgColor: true,
      textColor: true,
    },
  });

  return NextResponse.json(
    { announcement },
    { headers: { "Cache-Control": "no-store" } }
  );
}
