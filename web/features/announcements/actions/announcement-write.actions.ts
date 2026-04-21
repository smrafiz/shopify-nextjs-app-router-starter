"use server";

import { handleSessionToken } from "@/lib/shopify";
import {
  createAnnouncementForShop,
  updateAnnouncementById,
  deleteAnnouncementById,
} from "../services";
import { createAnnouncementSchema, updateAnnouncementSchema } from "../validation";
import { CreateAnnouncementInput, UpdateAnnouncementInput } from "../types";

export async function createAnnouncementAction(
  sessionToken: string,
  input: CreateAnnouncementInput
) {
  try {
    const parsed = createAnnouncementSchema.safeParse(input);
    if (!parsed.success) {
      return { status: "error" as const, message: "Validation failed", errors: parsed.error.flatten().fieldErrors };
    }
    const { shop } = await handleSessionToken(sessionToken);
    return createAnnouncementForShop(shop, parsed.data as CreateAnnouncementInput);
  } catch (err) {
    console.error("[Action] createAnnouncement failed:", err);
    return { status: "error" as const, message: "Failed to create announcement" };
  }
}

export async function updateAnnouncementAction(
  sessionToken: string,
  id: string,
  input: UpdateAnnouncementInput
) {
  try {
    const parsed = updateAnnouncementSchema.safeParse(input);
    if (!parsed.success) {
      return { status: "error" as const, message: "Validation failed", errors: parsed.error.flatten().fieldErrors };
    }
    const { shop } = await handleSessionToken(sessionToken);
    return updateAnnouncementById(id, shop, parsed.data as UpdateAnnouncementInput);
  } catch (err) {
    console.error("[Action] updateAnnouncement failed:", err);
    return { status: "error" as const, message: "Failed to update announcement" };
  }
}

export async function deleteAnnouncementAction(
  sessionToken: string,
  id: string
) {
  try {
    const { shop } = await handleSessionToken(sessionToken);
    return deleteAnnouncementById(id, shop);
  } catch (err) {
    console.error("[Action] deleteAnnouncement failed:", err);
    return { status: "error" as const, message: "Failed to delete announcement" };
  }
}
