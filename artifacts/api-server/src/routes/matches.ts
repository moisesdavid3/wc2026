import { Router, type IRouter } from "express";
import { db, matchesTable, teamsTable, predictionsTable, usersTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import {
  ListMatchesQueryParams,
  ListMatchesResponse,
  GetMatchParams,
  GetMatchResponse,
  ListUpcomingMatchesResponse,
  GetBracketResponse,
  ListGroupsResponse,
} from "@workspace/api-zod";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

async function enrichMatch(match: any) {
  const [homeTeam] = match.homeTeamId
    ? await db.select().from(teamsTable).where(eq(teamsTable.id, match.homeTeamId))
    : [null];
  const [awayTeam] = match.awayTeamId
    ? await db.select().from(teamsTable).where(eq(teamsTable.id, match.awayTeamId))
    : [null];
  return {
    ...match,
    matchDate: match.matchDate?.toISOString() ?? match.matchDate,
    homeTeam,
    awayTeam,
  };
}

router.get("/matches", async (req, res): Promise<void> => {
  const query = ListMatchesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { round, group, status } = query.data;

  let matches = await db.select().from(matchesTable).orderBy(asc(matchesTable.matchDate));

  if (round) matches = matches.filter((m) => m.round === round);
  if (group) matches = matches.filter((m) => m.group === group);
  if (status) matches = matches.filter((m) => m.status === status);

  const enriched = await Promise.all(matches.map(enrichMatch));
  res.json(ListMatchesResponse.parse(enriched));
});

router.get("/matches/upcoming", async (_req, res): Promise<void> => {
  const now = new Date();
  const matches = await db
    .select()
    .from(matchesTable)
    .orderBy(asc(matchesTable.matchDate));

  const upcoming = matches
    .filter((m) => m.status === "upcoming" && m.matchDate > now)
    .slice(0, 10);

  const enriched = await Promise.all(upcoming.map(enrichMatch));
  res.json(ListUpcomingMatchesResponse.parse(enriched));
});

router.get("/matches/:id", async (req, res): Promise<void> => {
  const params = GetMatchParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.id));
  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  const enriched = await enrichMatch(match);

  // Get user prediction if authenticated
  let myPrediction = null;
  const auth = getAuth(req);
  if (auth?.userId) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, auth.userId));
    if (user) {
      const [pred] = await db
        .select()
        .from(predictionsTable)
        .where(and(eq(predictionsTable.userId, user.id), eq(predictionsTable.matchId, params.data.id)));
      if (pred) {
        myPrediction = {
          ...pred,
          createdAt: pred.createdAt.toISOString(),
          updatedAt: pred.updatedAt.toISOString(),
        };
      }
    }
  }

  // Get prediction stats
  const preds = await db.select().from(predictionsTable).where(eq(predictionsTable.matchId, params.data.id));
  const total = preds.length;
  let homeWinCount = 0, drawCount = 0, awayWinCount = 0;
  for (const p of preds) {
    if (p.homeScore > p.awayScore) homeWinCount++;
    else if (p.homeScore === p.awayScore) drawCount++;
    else awayWinCount++;
  }

  const predictionStats = {
    totalPredictions: total,
    homeWinPct: total > 0 ? Math.round((homeWinCount / total) * 100) : 0,
    drawPct: total > 0 ? Math.round((drawCount / total) * 100) : 0,
    awayWinPct: total > 0 ? Math.round((awayWinCount / total) * 100) : 0,
  };

  const result = {
    ...enriched,
    myPrediction,
    predictionStats,
  };

  res.json(GetMatchResponse.parse(result));
});

router.get("/bracket", async (_req, res): Promise<void> => {
  const allMatches = await db.select().from(matchesTable).orderBy(asc(matchesTable.matchDate));
  const knockoutRounds = ["Round of 32", "Round of 16", "Quarterfinals", "Semifinals", "Third Place", "Final"];
  const byRound: Record<string, any[]> = {};

  for (const round of knockoutRounds) {
    const roundMatches = allMatches.filter((m) => m.round === round);
    if (roundMatches.length > 0) {
      byRound[round] = await Promise.all(roundMatches.map(enrichMatch));
    }
  }

  const bracket = Object.entries(byRound).map(([round, matches]) => ({ round, matches }));
  res.json(GetBracketResponse.parse(bracket));
});

router.get("/groups", async (_req, res): Promise<void> => {
  const teams = await db.select().from(teamsTable);
  const matches = await db.select().from(matchesTable);

  const groupNames = [...new Set(teams.map((t) => t.group).filter(Boolean) as string[])].sort();

  const result = groupNames.map((group) => {
    const groupTeams = teams.filter((t) => t.group === group);
    const groupMatches = matches.filter(
      (m) => m.group === group && m.status === "finished" && m.homeScore != null && m.awayScore != null
    );

    const standings = groupTeams.map((team) => {
      let played = 0, won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0;
      for (const m of groupMatches) {
        const isHome = m.homeTeamId === team.id;
        const isAway = m.awayTeamId === team.id;
        if (!isHome && !isAway) continue;
        played++;
        const tg = isHome ? m.homeScore! : m.awayScore!;
        const og = isHome ? m.awayScore! : m.homeScore!;
        goalsFor += tg;
        goalsAgainst += og;
        if (tg > og) won++;
        else if (tg === og) drawn++;
        else lost++;
      }
      return {
        teamId: team.id,
        team,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: won * 3 + drawn,
      };
    });

    standings.sort((a, b) =>
      b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor
    );

    return { group, standings };
  });

  res.json(ListGroupsResponse.parse(result));
});

export default router;
