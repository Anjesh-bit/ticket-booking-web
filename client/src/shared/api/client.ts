import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.error?.message ?? "Something went wrong";
    return Promise.reject(new Error(message));
  },
);
