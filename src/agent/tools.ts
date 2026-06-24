import { Type, type FunctionDeclaration } from "@google/genai";
import { ai, MODEL } from "./gemini";
import { getState, uid, update } from "../store";
import type { Priority, Task } from "../types";

// ---------------------------------------------------------------------------
// Tool declarations — the agent's action surface. This is the "Agentic Depth".
// Each declaration is paired with an executor below in `toolExecutors`.
// ---------------------------------------------------------------------------

export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "decompose_goal",
    description:
      "Break a high-level goal or messy brain-dump into concrete, ordered subtasks with time estimates and deadlines. Call this first whenever the user describes things they need to get done.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        subtasks: {
          type: Type.ARRAY,
          description: "Ordered list of atomic subtasks.",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              deadline: {
                type: Type.STRING,
                description: "ISO 8601 datetime, or empty if none.",
              },
              estMinutes: { type: Type.NUMBER },
              priority: {
                type: Type.STRING,
                enum: ["critical", "high", "medium", "low"],
              },
            },
            required: ["title", "priority"],
          },
        },
      },
      required: ["subtasks"],
    },
  },
  {
    name: "schedule_block",
    description:
      "Reserve a focused time block on the calendar to work on a task. Use to turn a plan into a timeline the user will actually follow.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        start: { type: Type.STRING, description: "ISO 8601 datetime." },
        end: { type: Type.STRING, description: "ISO 8601 datetime." },
        taskTitle: {
          type: Type.STRING,
          description: "Title of the task this block is for, to link them.",
        },
      },
      required: ["title", "start", "end"],
    },
  },
  {
    name: "draft_communication",
    description:
      "Draft an email or message the user needs to send (e.g. asking for an extension, confirming a meeting, a payment reminder). Drafting is part of completing the task, not just reminding.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        kind: { type: Type.STRING, enum: ["email", "message"] },
        to: { type: Type.STRING },
        subject: { type: Type.STRING },
        body: { type: Type.STRING },
      },
      required: ["kind", "to", "body"],
    },
  },
  {
    name: "research_web",
    description:
      "Look up current information the user needs to act (interview prep on a company, how to do something, official deadlines). Returns a grounded summary.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING },
      },
      required: ["query"],
    },
  },
  {
    name: "reprioritize_day",
    description:
      "Recompute task priority from deadline risk and importance, and return the recommended order for right now. Call when a deadline changes, a task slips, or the user asks what to do next.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "mark_task_done",
    description:
      "Mark a task complete when the user reports finishing it. After this, reprioritize_day to re-plan the remaining work.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskTitle: { type: Type.STRING },
      },
      required: ["taskTitle"],
    },
  },
  {
    name: "set_proactive_nudge",
    description:
      "Schedule a proactive nudge so the agent re-engages the user before a deadline is at risk. Escalate level for more urgent nudges.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        taskTitle: { type: Type.STRING },
        fireAt: { type: Type.STRING, description: "ISO 8601 datetime." },
        message: { type: Type.STRING },
        level: { type: Type.NUMBER, description: "1=gentle, 3=urgent." },
      },
      required: ["taskTitle", "fireAt", "message"],
    },
  },
];

// ---------------------------------------------------------------------------
// Executors — run the tool, mutate app state, return a JSON-able result that is
// fed back to Gemini as the functionResponse for the next loop turn.
// ---------------------------------------------------------------------------

type ToolResult = Record<string, unknown>;
type Executor = (args: any) => Promise<ToolResult> | ToolResult;

function findTaskByTitle(title: string): Task | undefined {
  return getState().tasks.find(
    (t) => t.title.toLowerCase() === String(title).toLowerCase()
  );
}

// Deadline-risk score: less slack time + higher importance => higher score.
function riskScore(t: Task): number {
  const importance =
    ({ critical: 4, high: 3, medium: 2, low: 1 } as Record<Priority, number>)[
      t.priority
    ] ?? 2;
  if (!t.deadline) return importance;
  const hoursLeft =
    (new Date(t.deadline).getTime() - Date.now()) / 3_600_000;
  const slack = Math.max(hoursLeft, 0.1);
  return importance * (100 / slack);
}

export const toolExecutors: Record<string, Executor> = {
  decompose_goal: ({ subtasks }) => {
    const created: Task[] = (subtasks ?? []).map((s: any) => ({
      id: uid("task"),
      title: s.title,
      deadline: s.deadline || undefined,
      estMinutes: s.estMinutes || undefined,
      priority: (s.priority as Priority) || "medium",
      done: false,
    }));
    update((st) => ({ tasks: [...st.tasks, ...created] }));
    return { created: created.length, tasks: created };
  },

  schedule_block: ({ title, start, end, taskTitle }) => {
    const task = taskTitle ? findTaskByTitle(taskTitle) : undefined;
    const ev = { id: uid("ev"), title, start, end, taskId: task?.id };
    update((st) => ({ events: [...st.events, ev] }));
    return { scheduled: ev };
  },

  draft_communication: ({ kind, to, subject, body }) => {
    const draft = { id: uid("draft"), kind, to, subject, body };
    update((st) => ({ drafts: [...st.drafts, draft] }));
    return { drafted: draft };
  },

  // Real Google Search grounding: a separate Gemini call with the googleSearch tool,
  // kept out of the main function-calling loop (a request mixes one tool mode cleanly).
  research_web: async ({ query }) => {
    try {
      const r = await ai.models.generateContent({
        model: MODEL,
        contents: `Research this and give a tight, actionable summary (3-5 bullet points) for someone who needs to act now: ${query}`,
        config: { tools: [{ googleSearch: {} }] },
      });
      const meta: any = r.candidates?.[0]?.groundingMetadata;
      const sources: string[] = (meta?.groundingChunks ?? [])
        .map((c: any) => c?.web?.uri)
        .filter(Boolean)
        .slice(0, 3);
      return {
        query,
        summary: r.text ?? "(no result)",
        sources,
        grounded: true,
      };
    } catch (e) {
      return { query, summary: `research unavailable: ${String(e)}`, grounded: false };
    }
  },

  reprioritize_day: () => {
    const ranked = [...getState().tasks]
      .filter((t) => !t.done)
      .sort((a, b) => riskScore(b) - riskScore(a));
    return {
      order: ranked.map((t) => ({
        title: t.title,
        priority: t.priority,
        deadline: t.deadline ?? null,
        risk: Math.round(riskScore(t)),
      })),
    };
  },

  mark_task_done: ({ taskTitle }) => {
    const task = findTaskByTitle(taskTitle);
    if (!task) return { error: `no task titled "${taskTitle}"` };
    update((st) => ({
      tasks: st.tasks.map((t) =>
        t.id === task.id ? { ...t, done: true } : t
      ),
    }));
    return { done: task.title };
  },

  set_proactive_nudge: ({ taskTitle, fireAt, message, level }) => {
    const task = findTaskByTitle(taskTitle);
    const nudge = {
      id: uid("nudge"),
      taskId: task?.id ?? "",
      fireAt,
      message,
      level: level ?? 1,
    };
    update((st) => ({ nudges: [...st.nudges, nudge] }));
    return { nudge };
  },
};
