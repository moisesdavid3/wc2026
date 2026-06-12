import { Router, type IRouter } from "express";
import { db, matchesTable, usersTable, predictionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  SetMatchResultParams,
  SetMatchResultBody,
  SetMatchResultResponse,
  ListUsersResponse,
  UpdateUserRoleParams,
  UpdateUserRoleBody,
  UpdateUserRoleResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";
import { calculatePoints } from "../lib/scoring";
import { syncResultsFromApi } from "../lib/sync-results";

const router: IRouter = Router();

router.post("/admin/matches/:id/result", requireAdmin, async (req, res): Promise<void> => {
  const params = SetMatchResultParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SetMatchResultBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { homeScore, awayScore } = body.data;

  const [match] = await db
    .update(matchesTable)
    .set({ homeScore, awayScore, status: "finished" })
    .where(eq(matchesTable.id, params.data.id))
    .returning();

  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  // Recalculate points for all predictions on this match
  const preds = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.matchId, params.data.id));

  for (const pred of preds) {
    const points = calculatePoints(pred.homeScore, pred.awayScore, homeScore, awayScore);
    await db
      .update(predictionsTable)
      .set({ points })
      .where(eq(predictionsTable.id, pred.id));
  }

  const result = { ...match, matchDate: match.matchDate.toISOString() };
  res.json(SetMatchResultResponse.parse(result));
});

router.get("/admin/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));
  res.json(ListUsersResponse.parse(serialized));
});

router.patch("/admin/users/:id/role", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateUserRoleParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateUserRoleBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ role: body.data.role })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(UpdateUserRoleResponse.parse({ ...user, createdAt: user.createdAt.toISOString() }));
});

router.post("/admin/sync-results", requireAdmin, async (_req, res): Promise<void> => {
  const result = await syncResultsFromApi();
  res.json(result);
});

export default router;
