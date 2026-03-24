import { redisConnection } from "#connections/redis.js";
import logger from "#lib/helpers/winston.helpers.js";

class RedisClient {
  private client: ReturnType<typeof redisConnection.getClient> | null;
  private readonly defaultTTL: number;

  constructor() {
    this.client = null;
    this.defaultTTL = 3600;
  }

  private getClient() {
    if (!this.client) throw new Error("Redis client not initialized");
    return this.client;
  }

  initialize(): void {
    this.client = redisConnection.getClient();
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.getClient().get(key);
    } catch (error) {
      logger.error("Redis GET error:", error);
      return null;
    }
  }

  async set(
    key: string,
    value: string,
    flag: "EX" | "PX",
    ttl: number = this.defaultTTL,
  ): Promise<boolean> {
    try {
      if (flag === "EX") {
        await this.getClient().setEx(key, ttl, value);
      } else {
        await this.getClient().pSetEx(key, ttl, value);
      }
      return true;
    } catch (error) {
      logger.error("Redis SET error:", error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.getClient().del(key);
      return true;
    } catch (error) {
      logger.error("Redis DEL error:", error);
      return false;
    }
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    try {
      return await this.getClient().mGet(keys);
    } catch (error) {
      logger.error("Redis MGET error:", error);
      return keys.map(() => null);
    }
  }

  async scan(
    cursor: string,
    match: string,
    count: number = 100,
  ): Promise<{ cursor: string; keys: string[] }> {
    try {
      const result = await this.getClient().scan(cursor, {
        MATCH: match,
        COUNT: count,
      });
      return {
        cursor: result.cursor.toString(),
        keys: result.keys.map((k) => k.toString()),
      };
    } catch (error) {
      logger.error("Redis SCAN error:", error);
      return { cursor: "0", keys: [] };
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const count = await this.getClient().exists(key);
      return count === 1;
    } catch (error) {
      logger.error("Redis EXISTS error:", error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      await this.getClient().expire(key, ttl);
      return true;
    } catch (error) {
      logger.error("Redis EXPIRE error:", error);
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.getClient().incr(key);
    } catch (error) {
      logger.error("Redis INCR error:", error);
      return 0;
    }
  }

  async flushdb(): Promise<boolean> {
    try {
      await this.getClient().flushDb();
      return true;
    } catch (error) {
      logger.error("Redis FLUSHDB error:", error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.getClient().keys(pattern);
    } catch (error) {
      logger.error("Redis KEYS error:", error);
      return [];
    }
  }
}

export const redisClient = new RedisClient();
