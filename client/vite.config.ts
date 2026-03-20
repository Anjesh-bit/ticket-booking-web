import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@features": path.resolve(__dirname, "src/features"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@config": path.resolve(__dirname, "src/config"),
      "@assets": path.resolve(__dirname, "src/assets"),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    hmr: true,
  },
});
