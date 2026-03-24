export type TierType = "VIP" | "FRONT_ROW" | "GA";

export type TicketTier = {
  id: string;
  concert_id: string;
  tier: TierType;
  price: string;
  total_seats: number;
  available_seats: number;
};

export type Concert = {
  id: string;
  name: string;
  venue: string;
  date: string;
  created_at: string;
  tier_count: number;
  tiers?: TicketTier[];
};
