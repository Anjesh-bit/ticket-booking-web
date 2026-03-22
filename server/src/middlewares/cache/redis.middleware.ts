import type { NextFunction, Request, Response } from "express";

import { redisClient } from "#cache/redis/client.js";
import CacheAsideStrategy from "#cache/strategies/cacheAside.js";
import logger from "#lib/helpers/winston.helpers.js";
import { type CacheOptions } from "#types/redis.types";

const scanKeys = async (pattern: string): Promise<string[]> => {
  const found: string[] = [];
  let cursor = "0";

  do {
    const result = await redisClient.scan(cursor, pattern, 100);
    cursor = result.cursor;
    found.push(...result.keys);
  } while (cursor !== "0");

  return found;
};

const cache = (options: CacheOptions = {}) => {
  const {
    condition = () => true,
    keyGenerator = (req: Request) => `${req.method}:${req.originalUrl}`,
    skipCache = () => false,
    ttl = 3600,
  } = options;

  const cacheStrategy = new CacheAsideStrategy({ ttl });

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!condition(req) || skipCache(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      const raw = await redisClient.get(cacheKey);
      if (raw !== null) {
        logger.debug(`Cache hit: ${cacheKey}`);
        return res.json(JSON.parse(raw));
      }
      logger.debug(`Cache miss: ${cacheKey}`);
    } catch (error) {
      logger.error("Cache read error, bypassing cache:", error);

      return next();
    }

    const originalJson = res.json.bind(res);

    res.json = (data: unknown) => {
      cacheStrategy.set(cacheKey, data, ttl).catch((error) => {
        logger.error(`Cache write error for ${cacheKey}:`, error);
      });
      return originalJson(data);
    };

    next();
  };
};

const invalidate = (keyPattern: string) => {
  return (_req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = (data: unknown) => {
      scanKeys(keyPattern)
        .then((keys) => {
          if (keys.length === 0) return;
          return Promise.all(keys.map((key) => redisClient.del(key))).then(() => {
            logger.debug(`Invalidated ${keys.length} keys matching: ${keyPattern}`);
          });
        })
        .catch((error) => {
          logger.error("Cache invalidation error:", error);
        });

      return originalJson(data);
    };

    next();
  };
};

const conditionalCache = (
  condition: (req: Request, res: Response) => boolean,
  options: CacheOptions = {},
) => {
  const cachedMiddleware = cache(options);

  return (req: Request, res: Response, next: NextFunction) => {
    if (condition(req, res)) {
      return cachedMiddleware(req, res, next);
    }
    next();
  };
};

export { cache, conditionalCache, invalidate };
