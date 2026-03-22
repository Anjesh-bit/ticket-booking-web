import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { BookingRequest, BookingResult } from "../booking.types";
import { bookingApi } from "../booking.api";

type State = {
  data: BookingResult | null;
  loading: boolean;
  error: string | null;
};

export const useBooking = () => {
  const [state, setState] = useState<State>({ data: null, loading: false, error: null });

  const book = async (payload: Omit<BookingRequest, "idempotency_key">) => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await bookingApi.create({
        ...payload,
        idempotency_key: uuidv4(),
      });
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Booking failed";
      setState({ data: null, loading: false, error: message });
    }
  };

  return { ...state, book };
};
