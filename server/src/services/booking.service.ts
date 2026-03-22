import CacheAsideStrategy from "#cache/strategies/cacheAside";
import { withTransaction } from "#connections/pg.js";
import { BadRequestError } from "#services/error.service";
import type { Booking, BookingRequest, BookingResult, TicketTier } from "#types/booking.types.js";

import { simulatePayment } from "./payment.service.js";

const cacheStrategy = new CacheAsideStrategy();

export const bookingService = {
  create: async (data: BookingRequest): Promise<BookingResult> => {
    return withTransaction(async (client) => {
      /* ── Idempotency check 
          If the same idempotency_key is submitted twice (e.g. network retry,
          double-click), we return the existing booking instead of creating
          a duplicate. The client generates a UUID per submission attempt.\
       */
      const { rows: existing } = await client.query<Booking>(
        `SELECT * FROM bookings WHERE idempotency_key = $1`,
        [data.idempotency_key],
      );

      if (existing[0]) return { booking: existing[0], payment_status: existing[0].payment_status };

      /*  
         ── Pessimistic row-level lock (SELECT FOR UPDATE)
          This is the core double-booking prevention mechanism.
      
          When two users attempt to book the same tier simultaneously:
          User A → acquires lock → checks seats → deducts → commits
          User B → waits for lock → re-reads updated seats → proceeds or rejects
      
          Without this lock, both users could read the same available_seats
          value before either commits, leading to overselling.
      
          The lock is held for the duration of this transaction and released
           automatically on COMMIT or ROLLBACK — no manual unlock needed.

      */
      const { rows: tiers } = await client.query<TicketTier>(
        `SELECT * FROM ticket_tiers WHERE id = $1 FOR UPDATE`,
        [data.tier_id],
      );

      const tier = tiers[0];
      if (!tier) throw new BadRequestError("Ticket tier not found");

      if (tier.available_seats < data.quantity) {
        throw new BadRequestError(`Only ${tier.available_seats} seats available for ${tier.tier}`);
      }

      /*
         ── Simulated payment 
         In production this would call Stripe/PayPal etc.
         Payment runs inside the transaction so if it fails we can
         rollback without deducting seats.
      */
      const paymentStatus = await simulatePayment();

      /* 
           ── Deduct seats only on successful payment
           Seats are only deducted if payment succeeds — failed payments
           still record a booking row but leave availability unchanged.
      */
      if (paymentStatus === "success") {
        await client.query(
          `UPDATE ticket_tiers
           SET available_seats = available_seats - $1
           WHERE id = $2`,
          [data.quantity, data.tier_id],
        );

        /*
            ── Invalidate availability cache
            After a successful booking, the cached availability for this
            concert is stale. Delete it so the next request fetches fresh
            data from Postgres instead of returning incorrect seat counts.
            At 50K concurrent users short TTL is actually safer because invalidating cache on 
            every booking causes cache stampede (everyone rushes to refill the cache at once).
        */
        await cacheStrategy.delete(`concert:${tier.concert_id}`);
      }

      const totalPrice = Number(tier.price) * data.quantity;

      const { rows: bookings } = await client.query<Booking>(
        `INSERT INTO bookings
           (tier_id, quantity, total_price, idempotency_key, payment_status, user_identifier)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          data.tier_id,
          data.quantity,
          totalPrice,
          data.idempotency_key,
          paymentStatus,
          data.user_identifier ?? "anonymous",
        ],
      );

      return { booking: bookings[0], payment_status: paymentStatus };
    });
  },

  findById: async (id: string): Promise<Booking | null> => {
    const { rows } = await withTransaction(async (client) => {
      return client.query<Booking>(`SELECT * FROM bookings WHERE id = $1`, [id]);
    });
    return rows[0] ?? null;
  },
};
