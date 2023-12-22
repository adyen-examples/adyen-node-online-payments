import { defineConfig } from "vite";
import "dotenv/config";
import preact from "@preact/preset-vite";

/**
 * Proxy API calls from client to backend
 */

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  define: {
    // VITE *only* automatically exposes your environment variables using "VITE_"-prefix via import.meta.env.
    // We expose the ADYEN_CLIENT_KEY environment variable manually here:
    "import.meta.env.ADYEN_CLIENT_KEY": JSON.stringify(process.env.ADYEN_CLIENT_KEY),
  },
  server: {
    host: true,
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000", // Assume that the backend is running on port 3000.
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
