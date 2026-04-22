export const AnnouncementType = {
  INFO: "INFO",
  WARNING: "WARNING",
  PROMO: "PROMO",
  URGENT: "URGENT",
} as const;

const mockPrisma = {
  announcement: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  shop: {
    findFirst: jest.fn(),
    upsert: jest.fn(),
  },
  session: {
    findFirst: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
};

export default mockPrisma;
