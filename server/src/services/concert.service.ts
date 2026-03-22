import { query } from "#connections/pg.js";
import type { ConcertWithTiers, TicketTier } from "#types/booking.types.js";

export const concertService = {
  findAll: async (): Promise<ConcertWithTiers[]> => {
    const { rows } = await query<ConcertWithTiers>(`
      SELECT
        c.id, c.name, c.venue, c.date, c.created_at,
        json_agg(
          json_build_object(
            'id',              t.id,
            'tier',            t.tier,
            'price',           t.price,
            'total_seats',     t.total_seats,
            'available_seats', t.available_seats
          ) ORDER BY t.price DESC
        ) AS tiers
      FROM concerts c
      JOIN ticket_tiers t ON t.concert_id = c.id
      GROUP BY c.id
      ORDER BY c.date ASC
    `);
    return rows;
  },

  findById: async (id: string): Promise<ConcertWithTiers | null> => {
    const { rows } = await query<ConcertWithTiers>(
      `
      SELECT
        c.id, c.name, c.venue, c.date, c.created_at,
        json_agg(
          json_build_object(
            'id',              t.id,
            'tier',            t.tier,
            'price',           t.price,
            'total_seats',     t.total_seats,
            'available_seats', t.available_seats
          ) ORDER BY t.price DESC
        ) AS tiers
      FROM concerts c
      JOIN ticket_tiers t ON t.concert_id = c.id
      WHERE c.id = $1
      GROUP BY c.id
    `,
      [id],
    );
    return rows[0] ?? null;
  },
};
