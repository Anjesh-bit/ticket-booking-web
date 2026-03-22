import type { Response, NextFunction } from "express";

import { bookingService } from "#services/booking.service.js";
import type { BookingRequest } from "#types/booking.types.js";
import type { AuthenticatedRequest } from "#types/error.types.js";

export const createBooking = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await bookingService.create(req.body as BookingRequest);
    const status = result.payment_status === "success" ? 201 : 402;
    res.status(status).json({ success: result.payment_status === "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const booking = await bookingService.findById(id);
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};
