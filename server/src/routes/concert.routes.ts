import { Router } from "express";

import { getConcertById, getConcerts } from "#controllers/concert.controller.js";
import { cache } from "#middlewares/cache/redis.middleware.js";
import { asyncHandler } from "#middlewares/error/errorHandler.middleware.js";

const router = Router();

router.get("/", cache({ ttl: 300 }), asyncHandler(getConcerts));

router.get(
  "/:id",
  cache({ ttl: 300, keyGenerator: (req) => `concert:${req.params.id}` }),
  asyncHandler(getConcertById),
);

export default router;
