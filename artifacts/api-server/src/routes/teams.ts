import { Router, type IRouter } from "express";
import { db, teamsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListTeamsResponse, GetTeamParams, GetTeamResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/teams", async (_req, res): Promise<void> => {
  const teams = await db.select().from(teamsTable).orderBy(teamsTable.name);
  res.json(ListTeamsResponse.parse(teams));
});

router.get("/teams/:id", async (req, res): Promise<void> => {
  const params = GetTeamParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, params.data.id));
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }
  res.json(GetTeamResponse.parse(team));
});

export default router;
