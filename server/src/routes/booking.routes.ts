import { Router } from "express";

import { createBooking, getBookingById } from "#controllers/booking.controller.js";
import { asyncHandler } from "#middlewares/error/errorHandler.middleware.js";
import { validate } from "#middlewares/validations/validations.middleware.js";
import { bookingSchema } from "#validators/schema/booking.schema";

const router = Router();

router.post("/", validate(bookingSchema), asyncHandler(createBooking));
router.get("/:id", asyncHandler(getBookingById));

export default router;
