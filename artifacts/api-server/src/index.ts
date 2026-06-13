import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import { syncResultsFromApi, getNextPollDelay } from "./lib/sync-results";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Smart polling: sync based on match schedules, not a fixed interval
  // Only polls around match end times, respecting the 100 req/day free limit
  if (!process.env["FOOTBALL_DATA_KEY"]) {
    logger.warn("FOOTBALL_DATA_KEY not set — match auto-sync disabled");
  } else {
    async function scheduleSync() {
      try {
        const result = await syncResultsFromApi();
        logger.info({ updated: result.updated, errors: result.errors }, "Sync cycle complete");
      } catch (err) {
        logger.error({ err }, "Auto-sync failed");
      }

      try {
        const delay = await getNextPollDelay();
        logger.info({ nextPollSec: Math.round(delay / 1000) }, "Next sync scheduled");
        setTimeout(scheduleSync, delay);
      } catch (err) {
        logger.error({ err }, "Failed to calculate next poll, falling back to 30 min");
        setTimeout(scheduleSync, 30 * 60 * 1000);
      }
    }

    // Initial sync shortly after startup
    setTimeout(scheduleSync, 10_000);
  }
});
