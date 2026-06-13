import { Router, type IRouter } from "express";
import { db, usersTable, predictionsTable, matchesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetMeResponse, GetMyStatsResponse, GetDashboardResponse, CreateUserBody, CreateUserResponse } from "@workspace/api-zod";
import { requireAuth, getUserById } from "../lib/auth";

const router: IRouter = Router();

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({ name: parsed.data.name, email: parsed.data.email ?? "" })
    .returning();

  res.json(CreateUserResponse.parse({ ...user, createdAt: user.createdAt.toISOString() }));
});

router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const user = await getUserById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(GetMeResponse.parse({ ...user, createdAt: user.createdAt.toISOString() }));
});

router.get("/users/me/stats", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;

  const userPreds = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.userId, userId));

  const scored = userPreds.filter((p) => p.points != null);
  const totalPoints = scored.reduce((s, p) => s + (p.points ?? 0), 0);
  const exactPredictions = scored.filter((p) => p.points === 5).length;
  const correctOutcomes = scored.filter((p) => (p.points ?? 0) >= 3).length;

  const allUsers = await db.select().from(usersTable);
  const allPreds = await db.select().from(predictionsTable);

  const ranked = allUsers
    .map((u) => {
      const preds = allPreds.filter((p) => p.userId === u.id && p.points != null);
      return {
        userId: u.id,
        totalPoints: preds.reduce((s, p) => s + (p.points ?? 0), 0),
        exactPredictions: preds.filter((p) => p.points === 5).length,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints || b.exactPredictions - a.exactPredictions);

  const rank = ranked.findIndex((r) => r.userId === userId) + 1;

  res.json(GetMyStatsResponse.parse({
    totalPoints,
    exactPredictions,
    correctOutcomes,
    totalPredictions: userPreds.length,
    rank: rank || 1,
  }));
});

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;

  const userPreds = await db.select().from(predictionsTable).where(eq(predictionsTable.userId, userId));
  const scored = userPreds.filter((p) => p.points != null);
  const totalPoints = scored.reduce((s, p) => s + (p.points ?? 0), 0);
  const exactPredictions = scored.filter((p) => p.points === 5).length;
  const correctOutcomes = scored.filter((p) => (p.points ?? 0) >= 3).length;

  const allUsers = await db.select().from(usersTable);
  const allPreds = await db.select().from(predictionsTable);
  const ranked = allUsers
    .map((u) => ({
      userId: u.id,
      totalPoints: allPreds.filter((p) => p.userId === u.id && p.points != null).reduce((s, p) => s + (p.points ?? 0), 0),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
  const rank = ranked.findIndex((r) => r.userId === userId) + 1;

  const myStats = {
    totalPoints,
    exactPredictions,
    correctOutcomes,
    totalPredictions: userPreds.length,
    rank: rank || 1,
  };

  const now = new Date();
  const allMatches = await db.select().from(matchesTable);
  const upcoming = allMatches
    .filter((m) => m.status === "upcoming" && m.matchDate > now)
    .sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime())
    .slice(0, 5)
    .map((m) => ({ ...m, matchDate: m.matchDate.toISOString() }));

  const leaderboardPreview = ranked.slice(0, 5).map((r, i) => {
    const u = allUsers.find((x) => x.id === r.userId);
    const preds = allPreds.filter((p) => p.userId === r.userId && p.points != null);
    return {
      rank: i + 1,
      userId: r.userId,
      name: u?.name ?? "Unknown",
      avatarUrl: u?.avatarUrl ?? null,
      totalPoints: r.totalPoints,
      exactPredictions: preds.filter((p) => p.points === 5).length,
      correctOutcomes: preds.filter((p) => (p.points ?? 0) >= 3).length,
      totalPredictions: preds.length,
    };
  });

  const finished = allMatches.filter((m) => m.status === "finished").length;
  const nextMatch = allMatches
    .filter((m) => m.status === "upcoming" && m.matchDate > now)
    .sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime())[0];

  const liveOrUpcoming = allMatches.filter((m) => m.status !== "finished");
  const currentRound = liveOrUpcoming.length > 0 ? liveOrUpcoming[0].round : "Final";

  const tournamentProgress = {
    totalMatches: allMatches.length,
    finishedMatches: finished,
    currentRound,
    nextMatchDate: nextMatch?.matchDate?.toISOString() ?? null,
  };

  res.json(GetDashboardResponse.parse({ myStats, upcomingMatches: upcoming, leaderboardPreview, tournamentProgress }));
});

export default router;
