import "@testing-library/jest-dom";
import { resetPrismaMock } from "../mocks/prisma/prisma.mock";
import { shopifyMock } from "../mocks/shopify/shopify-graphql.mock";

jest.mock("zustand", () => {
    const createStore = () => ({
        getState: () => ({}),
        setState: jest.fn(),
        subscribe: jest.fn(),
    });
    return {
        __esModule: true,
        default: createStore,
        create: createStore,
    };
});

jest.mock("@/shared/repositories/prisma-connect", () => ({
    prisma: {},
}));

jest.mock("isomorphic-dompurify", () => ({
    sanitize: (dirty: string) => dirty,
}));

jest.mock("zod", () => {
    const chainable = (): any => ({
        optional: () => chainable(),
        regex: () => chainable(),
        default: () => chainable(),
        min: () => chainable(),
        max: () => chainable(),
        email: () => chainable(),
        url: () => chainable(),
        nullable: () => chainable(),
        array: () => chainable(),
        parse: (v: unknown) => v,
        safeParse: (v: unknown) => ({ success: true, data: v }),
    });
    const z = {
        string: () => chainable(),
        number: () => chainable(),
        boolean: () => chainable(),
        object: () => chainable(),
        enum: () => chainable(),
        nativeEnum: () => chainable(),
        array: () => chainable(),
        union: () => chainable(),
        literal: () => chainable(),
        optional: () => chainable(),
        nullable: () => chainable(),
        any: () => chainable(),
    };
    return { __esModule: true, default: z, ...z };
});

beforeEach(() => {
    resetPrismaMock();
    shopifyMock.reset();
});

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.SHOPIFY_API_KEY = "test-api-key";
process.env.SHOPIFY_API_SECRET = "test-api-secret";
process.env.HOST = "http://localhost:3000";
process.env.SCOPES = "read_products,write_products";
process.env.ENCRYPTION_KEY = "a".repeat(64);
