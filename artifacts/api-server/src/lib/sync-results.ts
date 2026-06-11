import { db, matchesTable, predictionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { calculatePoints } from "./scoring";
import { logger } from "./logger";

const API_BASE = "https://worldcup26.ir";

type ApiGame = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_name_en: string;
  away_team_name_en: string;
};

type SyncResult = {
  updated: number;
  errors: number;
  skipped: number;
};

function parseScore(val: string): number | null {
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

export async function syncResultsFromApi(): Promise<SyncResult> {
  const result: SyncResult = { updated: 0, errors: 0, skipped: 0 };

  try {
    const res = await fetch(`${API_BASE}/get/games`);
    if (!res.ok) {
      throw new Error(`API responded with ${res.status}`);
    }

    const data = (await res.json()) as { games: ApiGame[] };
    const games = data.games;

    logger.info({ totalGames: games.length }, "Fetched games from API");

    for (const game of games) {
      const matchNumber = parseInt(game.id, 10);
      if (isNaN(matchNumber)) {
        result.skipped++;
        continue;
      }

      const isFinished = game.finished === "TRUE" || game.time_elapsed === "finished";
      if (!isFinished) {
        continue;
      }

      const homeScore = parseScore(game.home_score);
      const awayScore = parseScore(game.away_score);

      if (homeScore === null || awayScore === null) {
        continue;
      }

      try {
        const [match] = await db
          .select()
          .from(matchesTable)
          .where(eq(matchesTable.matchNumber, matchNumber))
          .limit(1);

        if (!match) {
          logger.warn({ matchNumber }, "Match not found in database");
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
          { matchNumber, homeScore, awayScore, predictionsRecalculated: preds.length },
          "Match result synced",
        );
        result.updated++;
      } catch (err) {
        logger.error({ err, matchNumber }, "Error syncing match");
        result.errors++;
      }
    }
  } catch (err) {
    logger.error({ err }, "Error fetching API");
    result.errors++;
  }

  return result;
}
