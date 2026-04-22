import { NextRequest, NextResponse } from "next/server";
import { handleSessionToken } from "@/lib/shopify";
import { extractBearerToken, isSessionExpired } from "@/shared/utils";

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get("authorization"));

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Missing or invalid authorization header" },
        { status: 401 },
      );
    }

    const { shop, session } = await handleSessionToken(token);

    if (!session?.accessToken) {
      return NextResponse.json(
        { valid: false, error: "Invalid session" },
        { status: 401 },
      );
    }

    if (isSessionExpired(session.expires)) {
      return NextResponse.json(
        { valid: false, error: "Session expired" },
        { status: 401 },
      );
    }

    return NextResponse.json({ valid: true, shop });
  } catch (error) {
    console.error("[Session] Validation error:", error instanceof Error ? error.message : String(error));

    if (error instanceof Error) {
      if (error.message.includes("JWT")) {
        return NextResponse.json(
          { valid: false, error: "Invalid session token" },
          { status: 401 },
        );
      }
      if (error.message.includes("expired")) {
        return NextResponse.json(
          { valid: false, error: "Session expired" },
          { status: 401 },
        );
      }
    }

    return NextResponse.json(
      { valid: false, error: "Session validation failed" },
      { status: 500 },
    );
  }
}
