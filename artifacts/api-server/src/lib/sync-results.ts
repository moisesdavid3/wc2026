import { db, matchesTable, predictionsTable, teamsTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import { calculatePoints } from "./scoring";
import { logger } from "./logger";

const API_BASE = "https://api.football-data.org/v4";
const COMPETITION_CODE = "WC";

const FINISHED_STATUS = "FINISHED";

type SyncResult = {
  updated: number;
  errors: number;
  skipped: number;
};

type FdMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  stage: string;
  group?: string;
  homeTeam: {
    id: number;
    name: string;
    tla: string;
  };
  awayTeam: {
    id: number;
    name: string;
    tla: string;
  };
  score: {
    winner: string | null;
    duration: string;
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
};

type FdMatchesResponse = {
  count: number;
  filters: Record<string, unknown>;
  competition: Record<string, unknown>;
  matches: FdMatch[];
};

function getApiKey(): string {
  const key = process.env["FOOTBALL_DATA_KEY"];
  if (!key) throw new Error("FOOTBALL_DATA_KEY environment variable is required");
  return key;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "X-Auth-Token": getApiKey() },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`football-data.org responded with ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function syncResultsFromApi(): Promise<SyncResult> {
  const result: SyncResult = { updated: 0, errors: 0, skipped: 0 };

  try {
    const data = await apiFetch<FdMatchesResponse>(`/competitions/${COMPETITION_CODE}/matches`);

    logger.info({ totalMatches: data.matches.length }, "Fetched matches from football-data.org");

    const teamByCode = new Map<string, typeof teamsTable.$inferSelect>();
    const dbTeams = await db.select().from(teamsTable);
    for (const t of dbTeams) {
      teamByCode.set(t.code, t);
    }

    for (const match of data.matches) {
      if (match.status !== FINISHED_STATUS) continue;

      const homeScore = match.score.fullTime.home;
      const awayScore = match.score.fullTime.away;
      if (homeScore === null || awayScore === null) continue;

      const homeCode = match.homeTeam.tla;
      const awayCode = match.awayTeam.tla;

      const homeTeam = teamByCode.get(homeCode);
      const awayTeam = teamByCode.get(awayCode);
      if (!homeTeam || !awayTeam) {
        logger.warn(
          { homeCode, awayCode },
          "Team code not found in database",
        );
        result.skipped++;
        continue;
      }

      try {
        const [dbMatch] = await db
          .select()
          .from(matchesTable)
          .where(
            and(
              eq(matchesTable.homeTeamId, homeTeam.id),
              eq(matchesTable.awayTeamId, awayTeam.id),
            ),
          )
          .limit(1);

        if (!dbMatch) {
          logger.warn(
            { homeTeam: homeTeam.name, awayTeam: awayTeam.name },
            "Match not found in database",
          );
          result.skipped++;
          continue;
        }

        if (dbMatch.status === "finished") {
          result.skipped++;
          continue;
        }

        await db
          .update(matchesTable)
          .set({
            homeScore,
            awayScore,
            status: "finished",
          })
          .where(eq(matchesTable.id, dbMatch.id));

        const preds = await db
          .select()
          .from(predictionsTable)
          .where(eq(predictionsTable.matchId, dbMatch.id));

        for (const pred of preds) {
          const points = calculatePoints(pred.homeScore, pred.awayScore, homeScore, awayScore);
          await db
            .update(predictionsTable)
            .set({ points })
            .where(eq(predictionsTable.id, pred.id));
        }

        logger.info(
          {
            matchNumber: dbMatch.matchNumber,
            homeTeam: homeTeam.name,
            awayTeam: awayTeam.name,
            homeScore,
            awayScore,
            predictionsRecalculated: preds.length,
          },
          "Match result synced from football-data.org",
        );
        result.updated++;
      } catch (err) {
        logger.error(
          { err, homeTeam: homeTeam.name, awayTeam: awayTeam.name },
          "Error syncing match",
        );
        result.errors++;
      }
    }
  } catch (err) {
    logger.error({ err }, "Error fetching from football-data.org");
    result.errors++;
  }

  return result;
}

const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;
const FALLBACK_DELAY_MS = 30 * 60 * 1000;
const MIN_DELAY_MS = 60 * 1000;

export async function getNextPollDelay(): Promise<number> {
  const unfinished = await db
    .select({ matchDate: matchesTable.matchDate })
    .from(matchesTable)
    .where(ne(matchesTable.status, "finished"));

  if (unfinished.length === 0) return FALLBACK_DELAY_MS;

  const now = Date.now();
  let nextDelay = Infinity;

  for (const match of unfinished) {
    if (!match.matchDate) continue;
    const matchEnd = match.matchDate.getTime() + MATCH_DURATION_MS;

    if (now >= matchEnd) {
      const delay = 10 * 60 * 1000;
      if (delay < nextDelay) nextDelay = delay;
    } else {
      const delay = matchEnd - now;
      if (delay < nextDelay) nextDelay = delay;
    }
  }

  return Math.max(nextDelay, MIN_DELAY_MS);
}
