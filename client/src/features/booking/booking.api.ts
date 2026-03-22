import { apiClient } from "@shared/api/client";
import type { ApiResponse } from "@shared/types/api.types";
import type { Booking, BookingRequest, BookingResult } from "./booking.types";

export const bookingApi = {
  create: async (payload: BookingRequest): Promise<BookingResult> => {
    const { data } = await apiClient.post<ApiResponse<BookingResult>>("/api/bookings", payload);
    return data.data;
  },

  getById: async (id: string): Promise<Booking> => {
    const { data } = await apiClient.get<ApiResponse<Booking>>(`/api/bookings/${id}`);
    return data.data;
  },
};
