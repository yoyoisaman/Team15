import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // needed for the Docker Container port mapping to work
    strictPort: true,
    port: 5174,
    proxy: {
      '/login': 'http://localhost:8000', // 將 /login 請求代理到 Django
      '/static': 'http://localhost:8000',
    },
  }
});
