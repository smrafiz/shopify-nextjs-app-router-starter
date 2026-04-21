import { getAnnouncementsForShop, createAnnouncementForShop } from "@/features/announcements/services/announcement.service";

jest.mock("@/features/announcements/repositories/announcement.repository", () => ({
  findShopIdByDomain: jest.fn(),
  findAllByShop: jest.fn(),
  createAnnouncement: jest.fn(),
  findById: jest.fn(),
  updateAnnouncement: jest.fn(),
  deleteAnnouncement: jest.fn(),
}));

import {
  findShopIdByDomain,
  findAllByShop,
  createAnnouncement,
} from "@/features/announcements/repositories/announcement.repository";

const mockFindShopId = findShopIdByDomain as jest.MockedFunction<typeof findShopIdByDomain>;
const mockFindAll = findAllByShop as jest.MockedFunction<typeof findAllByShop>;
const mockCreate = createAnnouncement as jest.MockedFunction<typeof createAnnouncement>;

describe("announcement.service", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("getAnnouncementsForShop", () => {
    it("returns error when shop not found", async () => {
      mockFindShopId.mockResolvedValue(null);
      const result = await getAnnouncementsForShop("unknown.myshopify.com");
      expect(result.status).toBe("error");
    });

    it("returns announcements for valid shop", async () => {
      const fakeAnnouncements = [
        {
          id: "ann_1",
          shopId: "shop_1",
          title: "Summer Sale",
          message: "20% off everything",
          type: "PROMO" as const,
          isActive: true,
          bgColor: "#1a1a1a",
          textColor: "#ffffff",
          startsAt: null,
          endsAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockFindShopId.mockResolvedValue("shop_1");
      mockFindAll.mockResolvedValue(fakeAnnouncements);
      const result = await getAnnouncementsForShop("test.myshopify.com");
      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].title).toBe("Summer Sale");
      }
    });
  });

  describe("createAnnouncementForShop", () => {
    it("returns error when shop not found", async () => {
      mockFindShopId.mockResolvedValue(null);
      const result = await createAnnouncementForShop("unknown.myshopify.com", {
        title: "Test",
        message: "Test message",
        type: "INFO",
        bgColor: "#000000",
        textColor: "#ffffff",
      });
      expect(result.status).toBe("error");
    });

    it("creates announcement for valid shop", async () => {
      const created = {
        id: "ann_new",
        shopId: "shop_1",
        title: "Flash Sale",
        message: "One day only!",
        type: "URGENT" as const,
        isActive: false,
        bgColor: "#dc2626",
        textColor: "#ffffff",
        startsAt: null,
        endsAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockFindShopId.mockResolvedValue("shop_1");
      mockCreate.mockResolvedValue(created);
      const result = await createAnnouncementForShop("test.myshopify.com", {
        title: "Flash Sale",
        message: "One day only!",
        type: "URGENT",
        bgColor: "#dc2626",
        textColor: "#ffffff",
      });
      expect(result.status).toBe("success");
      if (result.status === "success") {
        expect(result.data.title).toBe("Flash Sale");
      }
    });
  });
});
