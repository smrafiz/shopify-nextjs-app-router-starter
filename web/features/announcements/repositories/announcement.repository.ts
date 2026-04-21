import prisma from "@/shared/repositories/prisma-connect";
import { CreateAnnouncementInput, UpdateAnnouncementInput } from "../types";

export async function findShopIdByDomain(domain: string): Promise<string | null> {
  const shop = await prisma.shop.findUnique({
    where: { domain },
    select: { id: true },
  });
  return shop?.id ?? null;
}

export async function findAllByShop(shopId: string) {
  return prisma.announcement.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
  });
}

export async function findById(id: string) {
  return prisma.announcement.findUnique({ where: { id } });
}

export async function createAnnouncement(
  shopId: string,
  data: CreateAnnouncementInput
) {
  return prisma.announcement.create({
    data: {
      shopId,
      title: data.title,
      message: data.message,
      type: data.type,
      bgColor: data.bgColor,
      textColor: data.textColor,
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
    },
  });
}

export async function updateAnnouncement(
  id: string,
  data: UpdateAnnouncementInput
) {
  return prisma.announcement.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.message !== undefined && { message: data.message }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.bgColor !== undefined && { bgColor: data.bgColor }),
      ...(data.textColor !== undefined && { textColor: data.textColor }),
      ...(data.startsAt !== undefined && { startsAt: data.startsAt }),
      ...(data.endsAt !== undefined && { endsAt: data.endsAt }),
    },
  });
}

export async function deleteAnnouncement(id: string) {
  return prisma.announcement.delete({ where: { id } });
}
