import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Only used when VITE_API_URL is left blank and you're running a local
    // clone of center-kitchen-backend (default port 5000). With VITE_API_URL
    // set to the deployed backend, requests go straight there instead.
    proxy: {
      "/api": "http://localhost:5000",
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      },
    },
  },
});
