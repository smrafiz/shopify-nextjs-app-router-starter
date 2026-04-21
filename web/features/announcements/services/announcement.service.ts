import {
  findShopIdByDomain,
  findAllByShop,
  findById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../repositories";
import { CreateAnnouncementInput, UpdateAnnouncementInput } from "../types";
import { ActionResponse } from "@/shared/types";

export async function getAnnouncementsForShop(
  domain: string
): Promise<ActionResponse<Awaited<ReturnType<typeof findAllByShop>>>> {
  const shopId = await findShopIdByDomain(domain);
  if (!shopId) return { status: "error", message: "Shop not found" };
  const data = await findAllByShop(shopId);
  return { status: "success", data };
}

export async function createAnnouncementForShop(
  domain: string,
  input: CreateAnnouncementInput
): Promise<ActionResponse<Awaited<ReturnType<typeof createAnnouncement>>>> {
  const shopId = await findShopIdByDomain(domain);
  if (!shopId) return { status: "error", message: "Shop not found" };
  const data = await createAnnouncement(shopId, input);
  return { status: "success", data };
}

export async function updateAnnouncementById(
  id: string,
  domain: string,
  input: UpdateAnnouncementInput
): Promise<ActionResponse<Awaited<ReturnType<typeof updateAnnouncement>>>> {
  const existing = await findById(id);
  if (!existing) return { status: "error", message: "Announcement not found" };

  const shopId = await findShopIdByDomain(domain);
  if (!shopId || existing.shopId !== shopId) {
    return { status: "error", message: "Unauthorized" };
  }

  const data = await updateAnnouncement(id, input);
  return { status: "success", data };
}

export async function deleteAnnouncementById(
  id: string,
  domain: string
): Promise<ActionResponse<null>> {
  const existing = await findById(id);
  if (!existing) return { status: "error", message: "Announcement not found" };

  const shopId = await findShopIdByDomain(domain);
  if (!shopId || existing.shopId !== shopId) {
    return { status: "error", message: "Unauthorized" };
  }

  await deleteAnnouncement(id);
  return { status: "success", data: null };
}
