#!/usr/bin/env tsx
/**
 * One-time migration: encrypt any plaintext access tokens in the Session table.
 *
 * Run:  pnpx tsx scripts/encrypt-existing-tokens.ts
 * Dry:  pnpx tsx scripts/encrypt-existing-tokens.ts --dry-run
 *
 * Safe to run multiple times — already-encrypted tokens are skipped.
 */

// Change working directory to web/ so dotenv and relative imports resolve correctly
process.chdir(new URL("../web", import.meta.url).pathname);

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./prisma/generated/client/index.js";
import { isEncrypted, encryptToken } from "./lib/crypto/token-encryption.js";

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Make sure web/.env is present.");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const sessions = await prisma.session.findMany({
      where: { accessToken: { not: null } },
      select: { id: true, accessToken: true },
    });

    const candidates = sessions.filter(
      (s) => s.accessToken && !isEncrypted(s.accessToken)
    );

    console.log(
      `Found ${sessions.length} session(s) with a token. ${candidates.length} need encryption.`
    );

    if (isDryRun) {
      console.log("Dry-run mode — no changes written.");
      if (candidates.length > 0) {
        console.log("Would encrypt tokens for session IDs:");
        candidates.forEach((s) => console.log(`  ${s.id}`));
      }
      return;
    }

    if (candidates.length === 0) {
      console.log("Nothing to do.");
      return;
    }

    console.log(`Encrypting ${candidates.length} session(s)...`);

    let encrypted = 0;
    let failed = 0;

    for (const session of candidates) {
      try {
        const encryptedToken = encryptToken(session.accessToken!);
        await prisma.session.update({
          where: { id: session.id },
          data: { accessToken: encryptedToken },
        });
        encrypted++;
      } catch (err) {
        failed++;
        console.error(`  Failed to encrypt session ${session.id}:`, err);
      }
    }

    console.log(
      `Done. Encrypted ${encrypted} / ${candidates.length} token(s).${failed > 0 ? ` ${failed} failed (see errors above).` : ""}`
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
