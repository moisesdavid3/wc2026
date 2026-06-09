import { Router, type IRouter } from "express";
import { db, usersTable, predictionsTable, matchesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetMeResponse, GetMyStatsResponse, GetDashboardResponse } from "@workspace/api-zod";
import { requireAuth, getOrCreateUser } from "../lib/auth";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).clerkId as string;

  // Try to get name/email from Clerk auth metadata
  const auth = getAuth(req);
  const sessionClaims = auth?.sessionClaims as any;
  const name = sessionClaims?.firstName
    ? `${sessionClaims.firstName} ${sessionClaims.lastName ?? ""}`.trim()
    : (sessionClaims?.name ?? "User");
  const email = sessionClaims?.email ?? (sessionClaims?.emailAddresses?.[0]?.emailAddress ?? "");

  const user = await getOrCreateUser(clerkId, { name, email });
  const serialized = {
    ...user,
    createdAt: user.createdAt.toISOString(),
  };
  res.json(GetMeResponse.parse(serialized));
});

router.get("/users/me/stats", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).clerkId as string;
  const user = await getOrCreateUser(clerkId);

  const userPreds = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.userId, user.id));

  const scored = userPreds.filter((p) => p.points != null);
  const totalPoints = scored.reduce((s, p) => s + (p.points ?? 0), 0);
  const exactPredictions = scored.filter((p) => p.points === 5).length;
  const correctOutcomes = scored.filter((p) => (p.points ?? 0) >= 3).length;

  // Get rank
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

  const rank = ranked.findIndex((r) => r.userId === user.id) + 1;

  res.json(GetMyStatsResponse.parse({
    totalPoints,
    exactPredictions,
    correctOutcomes,
    totalPredictions: userPreds.length,
    rank: rank || 1,
  }));
});

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).clerkId as string;
  const user = await getOrCreateUser(clerkId);

  // My stats
  const userPreds = await db.select().from(predictionsTable).where(eq(predictionsTable.userId, user.id));
  const scored = userPreds.filter((p) => p.points != null);
  const totalPoints = scored.reduce((s, p) => s + (p.points ?? 0), 0);
  const exactPredictions = scored.filter((p) => p.points === 5).length;
  const correctOutcomes = scored.filter((p) => (p.points ?? 0) >= 3).length;

  // Rank
  const allUsers = await db.select().from(usersTable);
  const allPreds = await db.select().from(predictionsTable);
  const ranked = allUsers
    .map((u) => ({
      userId: u.id,
      totalPoints: allPreds.filter((p) => p.userId === u.id && p.points != null).reduce((s, p) => s + (p.points ?? 0), 0),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
  const rank = ranked.findIndex((r) => r.userId === user.id) + 1;

  const myStats = {
    totalPoints,
    exactPredictions,
    correctOutcomes,
    totalPredictions: userPreds.length,
    rank: rank || 1,
  };

  // Upcoming matches
  const now = new Date();
  const allMatches = await db.select().from(matchesTable);
  const upcoming = allMatches
    .filter((m) => m.status === "upcoming" && m.matchDate > now)
    .sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime())
    .slice(0, 5)
    .map((m) => ({ ...m, matchDate: m.matchDate.toISOString() }));

  // Leaderboard preview (top 5)
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

  // Tournament progress
  const finished = allMatches.filter((m) => m.status === "finished").length;
  const nextMatch = allMatches
    .filter((m) => m.status === "upcoming" && m.matchDate > now)
    .sort((a, b) => a.matchDate.getTime() - b.matchDate.getTime())[0];

  // Determine current round
  const rounds = ["Group Stage", "Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Third Place", "Final"];
  const liveOrUpcoming = allMatches.filter((m) => m.status !== "finished");
  const currentRound = liveOrUpcoming.length > 0 ? liveOrUpcoming[0].round : "Final";

  const tournamentProgress = {
    totalMatches: allMatches.length,
    finishedMatches: finished,
    currentRound,
    nextMatchDate: nextMatch?.matchDate?.toISOString() ?? null,
  };

  res.json(GetDashboardResponse.parse({
    myStats,
    upcomingMatches: upcoming,
    leaderboardPreview,
    tournamentProgress,
  }));
});

export default router;
