export type ApiResponse<T> = {
  success: boolean;
  data: T;
};

export type ApiError = {
  message: string;
  status: number;
};
