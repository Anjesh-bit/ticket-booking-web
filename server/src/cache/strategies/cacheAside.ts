import { redisClient } from "#cache/redis/client.js";
import logger from "#lib/helpers/winston.helpers.js";

const serialize = <T>(data: T): string => {
  return JSON.stringify(data);
};

const deserialize = <T>(raw: string): T => {
  return JSON.parse(raw) as T;
};

type CacheAsideOptions = {
  prefix?: string;
  ttl?: number;
};

class CacheAsideStrategy {
  private readonly defaultTTL: number;
  private readonly keyPrefix: string;

  constructor(options: CacheAsideOptions = {}) {
    this.defaultTTL = options.ttl ?? 3600;
    this.keyPrefix = options.prefix ?? "";
  }

  buildKey(key: string): string {
    return this.keyPrefix ? `${this.keyPrefix}:${key}` : key;
  }

  async delete(key: string): Promise<boolean> {
    const cacheKey = this.buildKey(key);
    try {
      await redisClient.del(cacheKey);
      logger.debug(`Cache invalidated: ${cacheKey}`);
      return true;
    } catch (error) {
      logger.error("Cache delete error:", error);
      return false;
    }
  }

  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL,
  ): Promise<T | null> {
    const cacheKey = this.buildKey(key);

    try {
      const raw = await redisClient.get(cacheKey);
      if (raw !== null) {
        logger.debug(`Cache hit: ${cacheKey}`);
        return deserialize<T>(raw);
      }
    } catch (error) {
      logger.error("Cache read error, falling through to source:", error);
    }

    logger.debug(`Cache miss: ${cacheKey}`);
    const data = await fetchFn();

    if (data !== null && data !== undefined) {
      redisClient
        .set(cacheKey, serialize(data), "EX", ttl)
        .catch((err) => logger.error("Cache write-back error:", err));
    }

    return data;
  }

  async mget<T>(
    keys: string[],
    fetchFn: (missedKeys: string[]) => Promise<Record<string, T>>,
    ttl: number = this.defaultTTL,
  ): Promise<Record<string, T>> {
    const cacheKeys = keys.map((k) => this.buildKey(k));
    const results: Record<string, T> = {};
    const missedKeys: string[] = [];

    try {
      const rawValues: (string | null)[] = await redisClient.mget(...cacheKeys);

      keys.forEach((originalKey, i) => {
        const raw = rawValues[i];
        if (raw !== null && raw !== undefined) {
          results[originalKey] = deserialize<T>(raw);
        } else {
          missedKeys.push(originalKey);
        }
      });
    } catch (error) {
      logger.error("Cache mget error, fetching all from source:", error);
      return fetchFn(keys);
    }

    if (missedKeys.length === 0) return results;

    const fetched = await fetchFn(missedKeys);

    const writes = Object.entries(fetched).map(([key, data]) => {
      results[key] = data;
      return redisClient
        .set(this.buildKey(key), serialize(data), "EX", ttl)
        .catch((err) => logger.error(`Cache write-back error for ${key}:`, err));
    });

    await Promise.all(writes);
    return results;
  }

  async set<T>(key: string, data: T, ttl: number = this.defaultTTL): Promise<boolean> {
    const cacheKey = this.buildKey(key);
    try {
      await redisClient.set(cacheKey, serialize(data), "EX", ttl);
      logger.debug(`Cache set: ${cacheKey}`);
      return true;
    } catch (error) {
      logger.error("Cache set error:", error);
      return false;
    }
  }

  async update<T>(key: string, updateFn: (current: T | null) => Promise<T>): Promise<T> {
    const cacheKey = this.buildKey(key);

    try {
      const raw = await redisClient.get(cacheKey);
      const current: T | null = raw !== null ? deserialize<T>(raw) : null;
      const updated = await updateFn(current);

      await redisClient.del(cacheKey);
      logger.debug(`Cache invalidated after update: ${cacheKey}`);

      return updated;
    } catch (error) {
      logger.error("Cache update error:", error);
      throw error;
    }
  }
}

export default CacheAsideStrategy;
