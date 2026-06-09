import { type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as any).clerkId = clerkId;
  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  (req as any).clerkId = clerkId;
  (req as any).dbUser = user;
  next();
};

export async function getOrCreateUser(clerkId: string, clerkUser?: { name?: string; email?: string; avatarUrl?: string }) {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (existing) return existing;
  const [created] = await db.insert(usersTable).values({
    clerkId,
    name: clerkUser?.name ?? "User",
    email: clerkUser?.email ?? "",
    avatarUrl: clerkUser?.avatarUrl ?? null,
    role: "user",
  }).returning();
  return created;
}
