/**
 * Mock Prisma Client for testing.
 * Uses jest-mock-extended to deep-mock PrismaClient.
 *
 * Note: PrismaClient types come from the generated client.
 * Run `bun run migrate` (prisma migrate dev) to generate before testing.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { mockDeep, mockReset } = require("jest-mock-extended");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prismaMock: any = mockDeep();

/**
 * Resets all Prisma mock implementations.
 * Called in beforeEach to ensure clean test state.
 */
export function resetPrismaMock(): void {
    mockReset(prismaMock);
}

jest.mock("@/shared/repositories/prisma-connect", () => ({
    __esModule: true,
    default: prismaMock,
    prisma: prismaMock,
}));
