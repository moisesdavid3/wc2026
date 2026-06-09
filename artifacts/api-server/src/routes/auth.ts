import { Router } from "express";
import { db, usersTable, magicTokensTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { sendMagicCode } from "../lib/email.js";
import crypto from "crypto";

const router = Router();

function isValidEmail(e: unknown): e is string {
  return typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function generateCode(): string {
  return String(Math.floor(100000 + crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
}

// POST /auth/request — send a 6-digit OTP to email
router.post("/auth/request", async (req, res): Promise<void> => {
  const { email } = req.body ?? {};
  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Valid email required" });
    return;
  }
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Invalidate any previous unused tokens for this email
  await db
    .update(magicTokensTable)
    .set({ used: true })
    .where(and(eq(magicTokensTable.email, email), eq(magicTokensTable.used, false)));

  await db.insert(magicTokensTable).values({ email, token: code, expiresAt });

  const appUrl = process.env.APP_URL ?? "http://localhost:24323";
  await sendMagicCode(email, code, appUrl);

  res.json({ message: "Code sent" });
});

// POST /auth/verify — verify OTP, return or create user
router.post("/auth/verify", async (req, res): Promise<void> => {
  const { email, code } = req.body ?? {};
  if (!isValidEmail(email) || typeof code !== "string" || !/^\d{6}$/.test(code)) {
    res.status(400).json({ error: "Email and 6-digit code required" });
    return;
  }
  const now = new Date();

  const [tokenRow] = await db
    .select()
    .from(magicTokensTable)
    .where(
      and(
        eq(magicTokensTable.email, email),
        eq(magicTokensTable.token, code),
        eq(magicTokensTable.used, false),
        gt(magicTokensTable.expiresAt, now),
      ),
    );

  if (!tokenRow) {
    res.status(401).json({ error: "Invalid or expired code" });
    return;
  }

  // Mark token used
  await db.update(magicTokensTable).set({ used: true }).where(eq(magicTokensTable.id, tokenRow.id));

  // Find or create user by email
  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    const name = email.split("@")[0];
    [user] = await db.insert(usersTable).values({ name, email }).returning();
  }

  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

export default router;
