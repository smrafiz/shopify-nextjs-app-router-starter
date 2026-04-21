import { NextRequest, NextResponse } from "next/server";
import prisma from "@/shared/repositories/prisma-connect";
import { isValidShopDomain } from "@/shared/utils";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(shop: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(shop);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(shop, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop") ?? "";

  if (!isValidShopDomain(shop)) {
    return NextResponse.json({ error: "Invalid shop" }, { status: 400 });
  }

  if (!checkRateLimit(shop)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const now = new Date();

  const shopRecord = await prisma.shop.findUnique({ where: { domain: shop } });
  if (!shopRecord) return NextResponse.json({ announcement: null });

  const announcement = await prisma.announcement.findFirst({
    where: {
      shopId: shopRecord.id,
      isActive: true,
      OR: [
        { startsAt: null },
        { startsAt: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endsAt: null },
            { endsAt: { gte: now } },
          ],
        },
      ],
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

  return NextResponse.json({ announcement }, { headers: { "Cache-Control": "no-store" } });
}
