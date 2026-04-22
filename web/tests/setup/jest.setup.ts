import "@testing-library/jest-dom";

jest.mock("@/shared/repositories/prisma-connect", () => ({
  prisma: {},
}));

jest.mock("isomorphic-dompurify", () => ({
  sanitize: (dirty: string) => dirty,
}));

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.SHOPIFY_API_KEY = "test-api-key";
process.env.SHOPIFY_API_SECRET = "test-api-secret";
process.env.HOST = "http://localhost:3000";
process.env.SCOPES = "read_products";
process.env.ENCRYPTION_KEY = "a".repeat(64);
