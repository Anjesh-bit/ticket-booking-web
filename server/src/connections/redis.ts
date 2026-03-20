import type { RedisClientType } from "redis";
import redis from "redis";

import { REDIS_CONFIG } from "#config/redis.config.js";
import logger from "#lib/helpers/winston.helpers.js";

class RedisConnection {
  client: null | RedisClientType;
  isConnected: boolean;
  publisher: null | RedisClientType;
  subscriber: null | RedisClientType;

  constructor() {
    this.client = null;
    this.subscriber = null;
    this.publisher = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient(REDIS_CONFIG);

      this.publisher = redis.createClient(REDIS_CONFIG);

      this.subscriber = redis.createClient(REDIS_CONFIG);

      this.setupEventHandlers();

      await Promise.all([
        this.client.connect(),
        this.publisher.connect(),
        this.subscriber.connect(),
      ]);

      this.isConnected = true;
      logger.info("Redis connected successfully");

      return this.client;
    } catch (error) {
      logger.error("Redis connection failed:", error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.quit();
      }
      if (this.publisher) {
        await this.publisher.quit();
      }
      if (this.subscriber) {
        await this.subscriber.quit();
      }

      this.isConnected = false;
      logger.info("Redis disconnected successfully");
    } catch (error) {
      logger.error("Redis disconnection error:", error);
    }
  }

  getClient() {
    if (!this.isConnected) {
      throw new Error("Redis client is not connected");
    }
    return this.client;
  }

  getPublisher() {
    if (!this.isConnected) {
      throw new Error("Redis publisher is not connected");
    }
    return this.publisher;
  }

  getSubscriber() {
    if (!this.isConnected) {
      throw new Error("Redis subscriber is not connected");
    }
    return this.subscriber;
  }

  async healthCheck() {
    try {
      if (!this.client) {
        return false;
      }
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error("Redis Health Check Error:", error);
      return false;
    }
  }

  setupEventHandlers() {
    if (this.client) {
      this.client.on("error", (err: Error) => {
        logger.error("Redis Client Error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        logger.info("Redis Client Connected");
      });

      this.client.on("reconnecting", () => {
        logger.warn("Redis Client Reconnecting");
      });

      this.client.on("ready", () => {
        logger.info("Redis Client Ready");
        this.isConnected = true;
      });
    }

    if (this.publisher) {
      this.publisher.on("error", (err: Error) => {
        logger.error("Redis Publisher Error:", err);
      });
    }

    if (this.subscriber) {
      this.subscriber.on("error", (err: Error) => {
        logger.error("Redis Subscriber Error:", err);
      });
    }
  }
}

export const redisConnection = new RedisConnection();
