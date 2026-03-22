import type { Request } from "express";

export type CacheOptions = {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
  skipCache?: (req: Request) => boolean;
};
