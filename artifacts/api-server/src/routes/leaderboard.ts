import { Router, type IRouter } from "express";
import { db, usersTable, predictionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetLeaderboardResponse, GetMyRankResponse } from "@workspace/api-zod";
import { requireAuth, getOrCreateUser } from "../lib/auth";

const router: IRouter = Router();

async function buildLeaderboard() {
  const users = await db.select().from(usersTable);
  const predictions = await db.select().from(predictionsTable);

  const stats = users.map((user) => {
    const userPreds = predictions.filter((p) => p.userId === user.id && p.points != null);
    const totalPoints = userPreds.reduce((s, p) => s + (p.points ?? 0), 0);
    const exactPredictions = userPreds.filter((p) => p.points === 5).length;
    const correctOutcomes = userPreds.filter((p) => (p.points ?? 0) >= 3).length;
    return {
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      totalPoints,
      exactPredictions,
      correctOutcomes,
      totalPredictions: userPreds.length,
    };
  });

  stats.sort((a, b) =>
    b.totalPoints - a.totalPoints ||
    b.exactPredictions - a.exactPredictions ||
    b.correctOutcomes - a.correctOutcomes
  );

  return stats.map((s, i) => ({ rank: i + 1, ...s }));
}

router.get("/leaderboard", async (_req, res): Promise<void> => {
  const board = await buildLeaderboard();
  res.json(GetLeaderboardResponse.parse(board));
});

router.get("/leaderboard/me", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).clerkId as string;
  const user = await getOrCreateUser(clerkId);
  const board = await buildLeaderboard();
  const entry = board.find((e) => e.userId === user.id);

  if (!entry) {
    res.json(GetMyRankResponse.parse({
      rank: board.length + 1,
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      totalPoints: 0,
      exactPredictions: 0,
      correctOutcomes: 0,
      totalPredictions: 0,
    }));
    return;
  }

  res.json(GetMyRankResponse.parse(entry));
});

export default router;
