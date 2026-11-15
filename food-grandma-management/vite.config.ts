import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/management/",
  server: {
    port: 5180,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:8081",
    },
  },
});
