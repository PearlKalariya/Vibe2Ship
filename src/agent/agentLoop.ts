import type { Content, Part } from "@google/genai";
import { ai, MODEL } from "./gemini";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { functionDeclarations, toolExecutors } from "./tools";
import { update } from "../store";
import type { TraceEntry } from "../types";

const MAX_TURNS = 8; // safety cap on the agent loop

function trace(entry: TraceEntry) {
  update((st) => ({ trace: [...st.trace, entry] }));
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
    const response = await ai.models.generateContent({
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
