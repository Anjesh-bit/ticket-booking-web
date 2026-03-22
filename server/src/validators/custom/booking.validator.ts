import { bookingSchema } from "#validators/schema/booking.schema.js";
import type { BookingSchema } from "#validators/schema/booking.schema.js";

export const validateBooking = (data: unknown): BookingSchema => {
  return bookingSchema.parse(data);
};

export { bookingSchema };
export type { BookingSchema };
