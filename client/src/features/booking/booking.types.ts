import type { TierType } from "@features/concerts";

export type PaymentStatus = "pending" | "success" | "failed";

export type BookingRequest = {
  tier_id: string;
  quantity: number;
  idempotency_key: string;
  user_identifier?: string;
};

export type Booking = {
  id: string;
  tier_id: string;
  quantity: number;
  total_price: string;
  idempotency_key: string;
  payment_status: PaymentStatus;
  user_identifier: string;
  created_at: string;
};

export type BookingResult = {
  booking: Booking;
  payment_status: PaymentStatus;
};

export type BookingFormValues = {
  tierId: string;
  tierType: TierType;
  price: string;
  quantity: number;
};
