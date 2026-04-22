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
 * Cron endpoint to prevent serverless/DB cold starts.
 * Runs a lightweight DB ping and returns 200.
 *
 * Protected by CRON_SECRET bearer token.
 * Schedule: Every 5–10 minutes.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 16) {
    console.error("[Cron/keep-alive] CRON_SECRET is missing or too short");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await prisma.shop.count();
    const timestamp = Date.now();
    console.info(`[Cron/keep-alive] DB ping ok — ${count} shop(s) at ${timestamp}`);
    return NextResponse.json({ status: "ok", timestamp });
  } catch (error) {
    console.error("[Cron/keep-alive] DB ping failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
