import { apiClient } from "@shared/api/client";
import type { ApiResponse } from "@shared/types/api.types";
import type { Concert } from "./concert.types";

export const concertApi = {
  getAll: async (): Promise<Concert[]> => {
    const { data } = await apiClient.get<ApiResponse<Concert[]>>("/api/concerts");
    return data.data;
  },

  getById: async (id: string): Promise<Concert> => {
    const { data } = await apiClient.get<ApiResponse<Concert>>(`/api/concerts/${id}`);
    return data.data;
  },
};
