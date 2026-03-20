import http from "http";

import app from "#app.js";
import { ENV } from "#config/env.config.js";
import { connectDb, disconnectDb } from "#connections/pg";
import logger from "#lib/helpers/winston.helpers.js";

async function gracefulShutdown(): Promise<void> {
  logger.info("⏳ Shutting down gracefully...");
  try {
    await disconnectDb();
    logger.info("Database connections closed");
  } catch (error: unknown) {
    logger.error("Error during shutdown:", error);
  }
  process.exit(0);
}

async function startServer(): Promise<void> {
  try {
    await connectDb();

    const httpServer = http.createServer(app);

    httpServer.listen(ENV.PORT, (): void => {
      logger.info(`Server running on port ${ENV.PORT}`);
    });
  } catch (error: unknown) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  void gracefulShutdown();
});
process.on("SIGTERM", () => {
  void gracefulShutdown();
});

process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>): void => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  void gracefulShutdown();
});

process.on("uncaughtException", (error: unknown): void => {
  logger.error("Uncaught Exception:", error);
  void gracefulShutdown();
});

void startServer();
