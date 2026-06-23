import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// AI Studio injects the key as process.env.API_KEY; local dev uses VITE_GEMINI_API_KEY.
// We bridge both so the same code runs in AI Studio and locally.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || env.API_KEY || "";
  return {
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(apiKey),
    },
  };
});
