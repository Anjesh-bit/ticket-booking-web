import http from "http";

import app from "#app.js";
import { redisClient } from "#cache/redis/client";
import { ENV } from "#config/env.config.js";
import { connectDb, disconnectDb } from "#connections/pg";
import { redisConnection } from "#connections/redis";
import logger from "#lib/helpers/winston.helpers.js";

async function gracefulShutdown(server?: http.Server): Promise<void> {
  logger.info("Shutting down gracefully...");

  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    logger.info("HTTP server closed");
  }

  try {
    await disconnectDb();
    logger.info("Database connections closed");
  } catch (error: unknown) {
    logger.error("Error closing DB during shutdown", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
  }

  process.exit(0);
}

async function startServer(): Promise<void> {
  try {
    await connectDb();
    await redisConnection.connect();
    redisClient.initialize();
    const httpServer = http.createServer(app);

    httpServer.on("error", (error: NodeJS.ErrnoException) => {
      logger.error("HTTP server error", {
        message: error.message,
        code: error.code,
      });
      void gracefulShutdown(httpServer);
    });

    httpServer.listen(ENV.PORT, (): void => {
      logger.info(`Server running on port ${ENV.PORT}`);
    });

    process.on("SIGINT", () => void gracefulShutdown(httpServer));
    process.on("SIGTERM", () => void gracefulShutdown(httpServer));

    process.on("unhandledRejection", (reason: unknown) => {
      logger.error("Unhandled Rejection", {
        message: (reason as Error)?.message ?? String(reason),
        stack: (reason as Error)?.stack,
      });
      void gracefulShutdown(httpServer);
    });

    process.on("uncaughtException", (error: unknown) => {
      logger.error("Uncaught Exception", {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      void gracefulShutdown(httpServer);
    });
  } catch (error: unknown) {
    logger.error("Failed to start server", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  }
}

void startServer();
