import { db, matchesTable, predictionsTable, teamsTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";

const API_BASE = "https://api.football-data.org/v4";
const COMPETITION_CODE = "WC";
const FINISHED_STATUS = "FINISHED";

type FdMatch = {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: { id: number; name: string; tla: string };
  awayTeam: { id: number; name: string; tla: string };
  score: {
    winner: string | null;
    duration: string;
    fullTime: { home: number | null; away: number | null };
  };
};

type FdMatchesResponse = {
  count: number;
  matches: FdMatch[];
};

function calculatePoints(predictedHome: number, predictedAway: number, actualHome: number, actualAway: number): number {
  if (predictedHome === actualHome && predictedAway === actualAway) return 5;
  const predictedOutcome = Math.sign(predictedHome - predictedAway);
  const actualOutcome = Math.sign(actualHome - actualAway);
  return predictedOutcome === actualOutcome ? 3 : 0;
}

function getApiKey(): string {
  const key = process.env["FOOTBALL_DATA_KEY"];
  if (!key) throw new Error("FOOTBALL_DATA_KEY environment variable is required");
  return key;
}

async function main() {
  if (!process.env["DATABASE_URL"]) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  console.log("Fetching matches from football-data.org...");

  const res = await fetch(`${API_BASE}/competitions/${COMPETITION_CODE}/matches`, {
    headers: { "X-Auth-Token": getApiKey() },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`football-data.org responded with ${res.status}: ${text}`);
  }

  const data = (await res.json()) as FdMatchesResponse;
  const finishedMatches = data.matches.filter((m) => m.status === FINISHED_STATUS && m.score.fullTime.home !== null && m.score.fullTime.away !== null);

  console.log(`Found ${finishedMatches.length} finished matches`);

  const teamByCode = new Map<string, typeof teamsTable.$inferSelect>();
  const dbTeams = await db.select().from(teamsTable);
  for (const t of dbTeams) {
    teamByCode.set(t.code, t);
  }

  let updated = 0;
  let errors = 0;
  let skipped = 0;

  for (const match of finishedMatches) {
    const homeScore = match.score.fullTime.home!;
    const awayScore = match.score.fullTime.away!;
    const homeCode = match.homeTeam.tla;
    const awayCode = match.awayTeam.tla;

    const homeTeam = teamByCode.get(homeCode);
    const awayTeam = teamByCode.get(awayCode);

    if (!homeTeam || !awayTeam) {
      console.warn(`  Skipped: team code not found — ${homeCode} vs ${awayCode}`);
      skipped++;
      continue;
    }

    try {
      const [dbMatch] = await db
        .select()
        .from(matchesTable)
        .where(and(eq(matchesTable.homeTeamId, homeTeam.id), eq(matchesTable.awayTeamId, awayTeam.id)))
        .limit(1);

      if (!dbMatch) {
        console.warn(`  Skipped: match not in DB — ${homeTeam.name} vs ${awayTeam.name}`);
        skipped++;
        continue;
      }

      if (dbMatch.status === "finished") {
        console.log(`  Skipped (already synced): ${homeTeam.name} ${homeScore}-${awayScore} ${awayTeam.name}`);
        skipped++;
        continue;
      }

      await db
        .update(matchesTable)
        .set({ homeScore, awayScore, status: "finished" })
        .where(eq(matchesTable.id, dbMatch.id));

      const preds = await db
        .select()
        .from(predictionsTable)
        .where(eq(predictionsTable.matchId, dbMatch.id));

      for (const pred of preds) {
        const points = calculatePoints(pred.homeScore, pred.awayScore, homeScore, awayScore);
        await db.update(predictionsTable).set({ points }).where(eq(predictionsTable.id, pred.id));
      }

      console.log(`  Synced: #${dbMatch.matchNumber} ${homeTeam.name} ${homeScore}-${awayScore} ${awayTeam.name} (${preds.length} predictions scored)`);
      updated++;
    } catch (err) {
      console.error(`  Error syncing ${homeTeam.name} vs ${awayTeam.name}:`, err);
      errors++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
