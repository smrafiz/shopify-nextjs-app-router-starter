import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/shared/repositories/prisma-connect";

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
  } catch {
    return false;
  }
}

/**
 * Cron endpoint for data retention pruning.
 * Deletes WebhookDelivery records older than 7 days to prevent DB bloat.
 *
 * Protected by CRON_SECRET bearer token.
 * Schedule: Once per day.
 */
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 16) {
    console.error("[Cron/prune] CRON_SECRET is missing or too short");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { count: deleted } = await prisma.webhookDelivery.deleteMany({
      where: { processedAt: { lt: cutoff } },
    });
    const timestamp = Date.now();
    console.info(`[Cron/prune] Deleted ${deleted} WebhookDelivery record(s) older than 7 days`);
    return NextResponse.json({ deleted, timestamp });
  } catch (error) {
    console.error("[Cron/prune] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
