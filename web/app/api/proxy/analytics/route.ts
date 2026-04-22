import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter, RATE_LIMIT_RESPONSE } from "@/lib/rate-limit";
import { verifyProxyHmac } from "@/lib/shopify/proxy";

const checkRateLimit = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 100,
});

const VALID_EVENTS = ["view", "cart", "purchase"] as const;
type EventType = (typeof VALID_EVENTS)[number];

interface AnalyticsBody {
  event: EventType;
  itemId: string;
  sessionId?: string;
  customerId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    if (!verifyProxyHmac(searchParams)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shop = searchParams.get("shop") ?? "";
    if (!shop) {
      return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
    }

    if (!checkRateLimit(shop)) {
      return RATE_LIMIT_RESPONSE;
    }

    let body: AnalyticsBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid or empty request body" },
        { status: 400 }
      );
    }

    const { event, itemId, sessionId, customerId } = body;

    if (!event || !VALID_EVENTS.includes(event)) {
      return NextResponse.json(
        { error: `Invalid event type. Must be one of: ${VALID_EVENTS.join(", ")}` },
        { status: 400 }
      );
    }

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    // Validate itemId looks like a Shopify GID or numeric ID
    const ITEM_ID_PATTERN = /^(gid:\/\/shopify\/\w+\/\d+|\d+)$/;
    if (!ITEM_ID_PATTERN.test(itemId)) {
      return NextResponse.json({ error: "Invalid item ID format" }, { status: 400 });
    }

    // TODO: connect to a real analytics table (e.g. a TrackingEvent model in Prisma)
    // For now, log the event for observability.
    console.log("[Analytics Proxy]", {
      shop,
      event,
      itemId,
      sessionId: sessionId ?? null,
      customerId: customerId ?? null,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Error &&
      (error as any).digest === "NEXT_PRERENDER_INTERRUPTED"
    ) {
      throw error;
    }
    console.error("[Analytics Proxy] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to track event" },
      { status: 500 }
    );
  }
}
