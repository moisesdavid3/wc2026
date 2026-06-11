import { db, matchesTable, predictionsTable, teamsTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import { calculatePoints } from "./scoring";
import { logger } from "./logger";

const API_BASE = "https://v3.football.api-sports.io";
const LEAGUE_ID = 1;
const SEASON = 2026;

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

type SyncResult = {
  updated: number;
  errors: number;
  skipped: number;
};

type ApiTeam = {
  team: {
    id: number;
    name: string;
    code: string;
  };
};

type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    status: { short: string };
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

let teamCodeCache: Map<number, string> | null = null;

function getApiKey(): string {
  const key = process.env["API_FOOTBALL_KEY"];
  if (!key) throw new Error("API_FOOTBALL_KEY environment variable is required");
  return key;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "x-apisports-key": getApiKey() },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API-Football responded with ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.response as T;
}

async function buildTeamCodeMap(): Promise<Map<number, string>> {
  if (teamCodeCache) return teamCodeCache;

  const teams = await apiFetch<ApiTeam[]>(`/teams?league=${LEAGUE_ID}&season=${SEASON}`);
  const map = new Map<number, string>();

  for (const entry of teams) {
    const code = entry.team.code?.trim();
    if (code && code.length > 0) {
      map.set(entry.team.id, code);
    }
  }

  teamCodeCache = map;
  logger.info({ teamCount: map.size }, "Team code map built");
  return map;
}

function isFinished(status: string): boolean {
  return FINISHED_STATUSES.has(status);
}

export async function syncResultsFromApi(): Promise<SyncResult> {
  const result: SyncResult = { updated: 0, errors: 0, skipped: 0 };

  try {
    const [teamCodeMap, fixtures] = await Promise.all([
      buildTeamCodeMap(),
      apiFetch<ApiFixture[]>(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}`),
    ]);

    logger.info({ totalFixtures: fixtures.length }, "Fetched fixtures from API-Football");

    const teamByCode = new Map<string, typeof teamsTable.$inferSelect>();
    const dbTeams = await db.select().from(teamsTable);
    for (const t of dbTeams) {
      teamByCode.set(t.code, t);
    }

    for (const fixture of fixtures) {
      const status = fixture.fixture.status.short;
      if (!isFinished(status)) continue;

      const homeScore = fixture.goals.home;
      const awayScore = fixture.goals.away;
      if (homeScore === null || awayScore === null) continue;

      const homeCode = teamCodeMap.get(fixture.teams.home.id);
      const awayCode = teamCodeMap.get(fixture.teams.away.id);
      if (!homeCode || !awayCode) {
        result.skipped++;
        continue;
      }

      const homeTeam = teamByCode.get(homeCode);
      const awayTeam = teamByCode.get(awayCode);
      if (!homeTeam || !awayTeam) {
        result.skipped++;
        continue;
      }

      try {
        const [match] = await db
          .select()
          .from(matchesTable)
          .where(
            and(
              eq(matchesTable.homeTeamId, homeTeam.id),
              eq(matchesTable.awayTeamId, awayTeam.id),
            ),
          )
          .limit(1);

        if (!match) {
          logger.warn(
            { homeTeam: homeTeam.name, awayTeam: awayTeam.name },
            "Match not found in database",
          );
          result.skipped++;
          continue;
        }

        if (match.status === "finished") {
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
          .where(eq(matchesTable.id, match.id));

        const preds = await db
          .select()
          .from(predictionsTable)
          .where(eq(predictionsTable.matchId, match.id));

        for (const pred of preds) {
          const points = calculatePoints(pred.homeScore, pred.awayScore, homeScore, awayScore);
          await db
            .update(predictionsTable)
            .set({ points })
            .where(eq(predictionsTable.id, pred.id));
        }

        logger.info(
          {
            matchNumber: match.matchNumber,
            homeTeam: homeTeam.name,
            awayTeam: awayTeam.name,
            homeScore,
            awayScore,
            predictionsRecalculated: preds.length,
          },
          "Match result synced from API-Football",
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
    logger.error({ err }, "Error fetching from API-Football");
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

  const now = Date.now();
  let nextDelay = FALLBACK_DELAY_MS;

  for (const match of unfinished) {
    if (!match.matchDate) continue;
    const matchStart = match.matchDate.getTime();
    const matchEnd = matchStart + MATCH_DURATION_MS;

    if (now < matchStart) {
      const delay = matchEnd - now + 10 * 60 * 1000;
      if (delay < nextDelay) nextDelay = delay;
    } else if (now < matchEnd) {
      const delay = matchEnd - now + 5 * 60 * 1000;
      if (delay < nextDelay) nextDelay = delay;
    } else {
      if (10 * 60 * 1000 < nextDelay) nextDelay = 10 * 60 * 1000;
    }
  }

  return Math.max(nextDelay, MIN_DELAY_MS);
}
