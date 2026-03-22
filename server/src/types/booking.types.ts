export type TierType = "VIP" | "FRONT_ROW" | "GA";
export type PaymentStatus = "pending" | "success" | "failed";

export type Concert = {
  [key: string]: unknown;
  id: string;
  name: string;
  venue: string;
  date: string;
  created_at: string;
};

export type TicketTier = {
  [key: string]: unknown;
  id: string;
  concert_id: string;
  tier: TierType;
  price: string;
  total_seats: number;
  available_seats: number;
};

export type Booking = {
  [key: string]: unknown;
  id: string;
  tier_id: string;
  quantity: number;
  total_price: string;
  idempotency_key: string;
  payment_status: PaymentStatus;
  user_identifier: string;
  created_at: string;
};

export interface ConcertWithTiers extends Concert {
  tiers: TicketTier[];
}

export type BookingRequest = {
  tier_id: string;
  quantity: number;
  idempotency_key: string;
  user_identifier?: string;
};

export type BookingResult = {
  booking: Booking;
  payment_status: PaymentStatus;
};
