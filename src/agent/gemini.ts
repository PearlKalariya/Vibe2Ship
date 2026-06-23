import { GoogleGenAI } from "@google/genai";

// process.env.API_KEY is replaced at build time by vite.config.ts (define).
const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.warn(
    "[Clutch] No API key. Set VITE_GEMINI_API_KEY in .env (local) — AI Studio injects API_KEY on deploy."
  );
}

export const ai = new GoogleGenAI({ apiKey: apiKey ?? "" });

// Flash = fast loop turns. Swap to gemini-2.5-pro for heavy planning if needed.
export const MODEL = "gemini-2.5-flash";

// Less-contended fallback if the primary is overloaded (503) during a demo.
export const FALLBACK_MODEL = "gemini-2.5-flash-lite";
