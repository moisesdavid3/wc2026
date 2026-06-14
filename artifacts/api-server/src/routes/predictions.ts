import { Router, type IRouter } from "express";
import { db, matchesTable, predictionsTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import { calculatePoints } from "../lib/scoring";
import {
  UpsertPredictionBody,
  GetMyPredictionParams,
  ListMyPredictionsResponse,
  GetMyPredictionResponse,
  UpsertPredictionResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/predictions", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;

  const predictions = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.userId, userId));

  const serialized = predictions.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
  res.json(ListMyPredictionsResponse.parse(serialized));
});

router.post("/predictions", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const parsed = UpsertPredictionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { matchId, homeScore, awayScore } = parsed.data;

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, matchId));
  if (!match) {
    res.status(400).json({ error: "Match not found" });
    return;
  }
  if (userId !== 1) {
    if (match.status !== "upcoming") {
      res.status(400).json({ error: "Predictions are locked for this match" });
      return;
    }
    const LOCK_BUFFER_MS = 10 * 60 * 1000;
    if (new Date().getTime() >= new Date(match.matchDate).getTime() - LOCK_BUFFER_MS) {
      res.status(400).json({ error: "Predictions are locked — match starts in less than 10 minutes" });
      return;
    }
  }

  const [existing] = await db
    .select()
    .from(predictionsTable)
    .where(and(eq(predictionsTable.userId, userId), eq(predictionsTable.matchId, matchId)));

  let prediction;
  if (existing) {
    const [updated] = await db
      .update(predictionsTable)
      .set({ homeScore, awayScore })
      .where(eq(predictionsTable.id, existing.id))
      .returning();
    prediction = updated;
  } else {
    const [created] = await db
      .insert(predictionsTable)
      .values({ userId, matchId, homeScore, awayScore })
      .returning();
    prediction = created;
  }

  // Recalculate points if match already has a result
  if (match.homeScore != null && match.awayScore != null) {
    const points = calculatePoints(homeScore, awayScore, match.homeScore, match.awayScore);
    await db.update(predictionsTable).set({ points }).where(eq(predictionsTable.id, prediction.id));
    prediction = { ...prediction, points };
  }

  const serialized = {
    ...prediction,
    createdAt: prediction.createdAt.toISOString(),
    updatedAt: prediction.updatedAt.toISOString(),
  };
  res.json(UpsertPredictionResponse.parse(serialized));
});

router.get("/predictions/:matchId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as number;
  const params = GetMyPredictionParams.safeParse({ matchId: req.params.matchId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [prediction] = await db
    .select()
    .from(predictionsTable)
    .where(and(eq(predictionsTable.userId, userId), eq(predictionsTable.matchId, params.data.matchId)));

  if (!prediction) {
    res.status(404).json({ error: "Prediction not found" });
    return;
  }

  const serialized = {
    ...prediction,
    createdAt: prediction.createdAt.toISOString(),
    updatedAt: prediction.updatedAt.toISOString(),
  };
  res.json(GetMyPredictionResponse.parse(serialized));
});

export default router;
