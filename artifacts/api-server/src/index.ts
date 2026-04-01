import app from "./app";
import { logger } from "./lib/logger";
import { loadSavedToken, connectBot } from "./lib/botService";

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

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  const savedToken = loadSavedToken();
  if (savedToken) {
    logger.info("Saved token found, auto-connecting bot...");
    const result = await connectBot(savedToken);
    if (result.success) {
      logger.info({ username: result.username }, "Bot auto-connected from saved token");
    } else {
      logger.warn({ error: result.error }, "Auto-connect failed, clearing saved token");
    }
  }
});
