
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS concerts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  venue       TEXT        NOT NULL,
  date        TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_tiers (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  concert_id      UUID           NOT NULL REFERENCES concerts(id) ON DELETE CASCADE,
  tier            TEXT           NOT NULL CHECK (tier IN ('VIP', 'FRONT_ROW', 'GA')),
  price           NUMERIC(10, 2) NOT NULL,
  total_seats     INT            NOT NULL CHECK (total_seats > 0),
  available_seats INT            NOT NULL CHECK (available_seats >= 0),
  UNIQUE (concert_id, tier)
);

CREATE TABLE IF NOT EXISTS bookings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id          UUID        NOT NULL REFERENCES ticket_tiers(id),
  quantity         INT         NOT NULL CHECK (quantity > 0),
  total_price      NUMERIC(10, 2) NOT NULL,
  idempotency_key  TEXT        UNIQUE NOT NULL,
  payment_status   TEXT        NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
  user_identifier  TEXT        NOT NULL DEFAULT 'anonymous',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_ticket_tiers_concert_id ON ticket_tiers(concert_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tier_id ON bookings(tier_id);
CREATE INDEX IF NOT EXISTS idx_bookings_idempotency_key ON bookings(idempotency_key);



INSERT INTO concerts (id, name, venue, date) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Arctic Monkeys Live',   'Madison Square Garden', '2025-08-15 20:00:00+00'),
  ('a0000000-0000-0000-0000-000000000002', 'Taylor Swift Eras Tour','Wembley Stadium',        '2025-09-20 19:00:00+00'),
  ('a0000000-0000-0000-0000-000000000003', 'Coldplay Music of the Spheres', 'O2 Arena',       '2025-10-05 20:30:00+00')
ON CONFLICT DO NOTHING;

INSERT INTO ticket_tiers (concert_id, tier, price, total_seats, available_seats) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'VIP',       100.00, 50,  50),
  ('a0000000-0000-0000-0000-000000000001', 'FRONT_ROW',  50.00, 100, 100),
  ('a0000000-0000-0000-0000-000000000001', 'GA',         10.00, 500, 500),

  ('a0000000-0000-0000-0000-000000000002', 'VIP',       100.00, 50,  50),
  ('a0000000-0000-0000-0000-000000000002', 'FRONT_ROW',  50.00, 100, 100),
  ('a0000000-0000-0000-0000-000000000002', 'GA',         10.00, 500, 500),

  ('a0000000-0000-0000-0000-000000000003', 'VIP',       100.00, 50,  50),
  ('a0000000-0000-0000-0000-000000000003', 'FRONT_ROW',  50.00, 100, 100),
  ('a0000000-0000-0000-0000-000000000003', 'GA',         10.00, 500, 500)
ON CONFLICT DO NOTHING;