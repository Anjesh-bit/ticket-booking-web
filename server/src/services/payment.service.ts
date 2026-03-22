import type { PaymentStatus } from "#types/booking.types.js";

export const simulatePayment = async (): Promise<PaymentStatus> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return Math.random() < 0.9 ? "success" : "failed";
};
