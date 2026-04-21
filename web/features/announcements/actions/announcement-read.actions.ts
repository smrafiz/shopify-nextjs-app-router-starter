"use server";

import { handleSessionToken } from "@/lib/shopify";
import { getAnnouncementsForShop } from "../services";

export async function getAnnouncementsAction(sessionToken: string) {
  try {
    const { shop } = await handleSessionToken(sessionToken);
    return getAnnouncementsForShop(shop);
  } catch (err) {
    console.error("[Action] getAnnouncements failed:", err);
    return { status: "error" as const, message: "Failed to fetch announcements" };
  }
}
