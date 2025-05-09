import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://127.0.0.1:8888",
        changeOrigin: true,
        secure: false,
      },
      "/auth": {
        target: "https://127.0.0.1:8888",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
