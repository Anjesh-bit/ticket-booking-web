import { Router } from "express";

import { getAvailability, getConcertById, getConcerts } from "#controllers/concert.controller.js";
import { cache } from "#middlewares/cache/redis.middleware.js";
import { asyncHandler } from "#middlewares/error/errorHandler.middleware.js";

const router = Router();

router.get("/", cache({ ttl: 300 }), asyncHandler(getConcerts));

router.get(
  "/:id",
  cache({ ttl: 300, keyGenerator: (req) => `concert:${req.params.id}` }),
  asyncHandler(getConcertById),
);

router.get(
  "/:id/availability",
  cache({ ttl: 10, keyGenerator: (req) => `availability:${req.params.id}` }),
  asyncHandler(getAvailability),
);

export default router;
