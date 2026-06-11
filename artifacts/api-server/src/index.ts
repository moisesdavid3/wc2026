import app from "./app";
import { logger } from "./lib/logger";
import { syncResultsFromApi } from "./lib/sync-results";

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

  // Auto-sync match results from worldcup26.ir every 5 minutes
  const SYNC_INTERVAL_MS = 5 * 60 * 1000;
  logger.info({ intervalMs: SYNC_INTERVAL_MS }, "Starting match results sync interval");
  setInterval(() => {
    syncResultsFromApi().catch((err) => logger.error({ err }, "Auto-sync failed"));
  }, SYNC_INTERVAL_MS);

  // Also run an initial sync shortly after startup
  setTimeout(() => {
    syncResultsFromApi().catch((err) => logger.error({ err }, "Initial sync failed"));
  }, 10_000);
});
