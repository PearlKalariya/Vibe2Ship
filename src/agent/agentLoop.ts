import type { Content, Part } from "@google/genai";
import { ai, MODEL, FALLBACK_MODEL } from "./gemini";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { functionDeclarations, toolExecutors } from "./tools";
import { update } from "../store";
import type { TraceEntry } from "../types";

const MAX_TURNS = 8; // safety cap on the agent loop

function trace(entry: TraceEntry) {
  update((st) => ({ trace: [...st.trace, entry] }));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Gemini returns 503 (overloaded) / 429 (rate limit) under demand spikes — common
// on a shared key during a hackathon demo. Retry with exponential backoff so a
// transient spike never kills a live judging run.
async function generateWithRetry(
  req: Parameters<typeof ai.models.generateContent>[0],
  retries = 3
) {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await ai.models.generateContent(req);
    } catch (e) {
      lastErr = e;
      const msg = String(e);
      const transient = /\b(503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded)\b/i.test(
        msg
      );
      if (!transient) throw e;
      if (attempt === retries) break; // exhausted -> try fallback model below
      const wait = 800 * 2 ** attempt + Math.random() * 400; // 0.8s,1.6s,3.2s +jitter
      trace({
        role: "system",
        text: `model busy, retrying in ${(wait / 1000).toFixed(1)}s… (${attempt + 1}/${retries})`,
      });
      await sleep(wait);
    }
  }
  // Primary stayed overloaded — last-ditch swap to the less-contended model.
  if (req.model !== FALLBACK_MODEL) {
    trace({ role: "system", text: `switching to ${FALLBACK_MODEL}…` });
    try {
      return await ai.models.generateContent({ ...req, model: FALLBACK_MODEL });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/**
 * Run one user request through the full Perceive→Plan→Act→Reflect loop.
 * `imageBase64` is optional inline image data (Gemini multimodal, Day 3 wow feature).
 * Returns the agent's final natural-language summary.
 */
export async function runAgentLoop(
  userText: string,
  imageBase64?: { data: string; mimeType: string }
): Promise<string> {
  trace({ role: "user", text: userText });

  const today = new Date().toISOString();
  const userParts: Part[] = [{ text: `Today is ${today}.\n\n${userText}` }];
  if (imageBase64) {
    userParts.push({
      inlineData: { data: imageBase64.data, mimeType: imageBase64.mimeType },
    });
  }

  const contents: Content[] = [{ role: "user", parts: userParts }];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await generateWithRetry({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations }],
      },
    });

    const calls = response.functionCalls ?? [];

    // No tool calls left -> the agent is done; return its summary.
    if (calls.length === 0) {
      const text = response.text ?? "(no response)";
      trace({ role: "agent", text });
      return text;
    }

    // Record the model's tool-calling turn so we can send it back in history.
    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) contents.push(modelContent);

    // Execute every requested tool, collect functionResponses for next turn.
    const responseParts: Part[] = [];
    for (const call of calls) {
      const name = call.name ?? "";
      const args = call.args ?? {};
      trace({ role: "tool", text: name, tool: name, data: args });

      let result: Record<string, unknown>;
      try {
        const exec = toolExecutors[name];
        result = exec
          ? await exec(args)
          : { error: `unknown tool: ${name}` };
      } catch (e) {
        result = { error: String(e) };
      }

      responseParts.push({
        functionResponse: { name, response: result },
      });
    }

    contents.push({ role: "user", parts: responseParts });
  }

  const msg = "Agent hit max turns. Partial plan applied.";
  trace({ role: "system", text: msg });
  return msg;
}
