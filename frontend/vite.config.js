import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    strictPort: true,
    port: 5174,
    proxy: {
      '/login': 'http://backend:8000', // 用 backend 取代 localhost，docker跑得起來
      '/static': 'http://backend:8000',
    },
  }
});