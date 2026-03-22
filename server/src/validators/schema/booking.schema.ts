import { z } from "zod";

export const bookingSchema = z.object({
  tier_id: z.string().uuid("tier_id must be a valid UUID"),
  quantity: z
    .number()
    .int()
    .min(1, "quantity must be at least 1")
    .max(10, "max 10 tickets per booking"),
  idempotency_key: z.string().min(1, "idempotency_key is required"),
  user_identifier: z.string().optional(),
});

export type BookingSchema = z.infer<typeof bookingSchema>;
