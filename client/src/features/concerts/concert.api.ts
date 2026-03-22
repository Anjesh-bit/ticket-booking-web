import { apiClient } from "@shared/api/client";
import type { ApiResponse } from "@shared/types/api.types";
import type { Concert, TicketTier } from "./concert.types";

export const concertApi = {
  getAll: async (): Promise<Concert[]> => {
    const { data } = await apiClient.get<ApiResponse<Concert[]>>("/api/concerts");
    return data.data;
  },

  getById: async (id: string): Promise<Concert> => {
    const { data } = await apiClient.get<ApiResponse<Concert>>(`/api/concerts/${id}`);
    return data.data;
  },

  getAvailability: async (id: string): Promise<TicketTier[]> => {
    const { data } = await apiClient.get<ApiResponse<TicketTier[]>>(
      `/api/concerts/${id}/availability`,
    );
    return data.data;
  },
};
