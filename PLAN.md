# Clutch — Build Plan (Vibe2Ship)

**Problem Statement 1 — The Last-Minute Life Saver.**
Autonomous AI chief-of-staff that plans AND executes tasks before deadlines slip.

Deadline: **29 Jun 2026, 2:00 PM** (BlockseBlock, irreversible final submit).

## Why we win
60% of score = Problem-Solving (20) + Agentic Depth (20) + Innovation (20).
Most teams ship a Gemini chatbot and lose the 20% Agentic Depth. We ship a real
Perceive→Plan→Prioritize→Act→Reflect loop with function calling, stacked on
6–7 Google technologies for the 15%.

## Rubric → where we score
| Criteria | % | Our move |
|---|---|---|
| Problem Solving & Impact | 20 | Real pain, before/after demo |
| Agentic Depth | 20 | Multi-step agent loop, 7 tools, autonomous re-plan |
| Innovation & Creativity | 20 | Paste a syllabus/email image → auto-timeline (Gemini vision) |
| Usage of Google Tech | 15 | Gemini + Search grounding + Calendar + Firebase + Speech + AI Studio |
| Product Experience & Design | 10 | Clean dual-pane: agent trace + live plan |
| Technical Implementation | 10 | Clean TS, real tool exec, works live |
| Completeness & Usability | 5 | No dead buttons, mock fallbacks |

## Google tech stack
1. Google AI Studio — build + deploy (mandatory)
2. Gemini 2.5 Flash/Pro — function calling = the agent
3. Gemini multimodal vision — deadline extraction from images (wow)
4. Google Search grounding — research_web tool
5. Google Calendar API — schedule_block writes real events
6. Firebase (Firestore + Google Sign-In) — persistence + auth
7. Web Speech API — voice capture

## 6-day schedule
- [x] **Day 1 (23 Jun)** — scaffold, agent loop, 7 tool schemas, system prompt, dual-pane UI. ← DONE
- [ ] **Day 2 (24 Jun)** — Mentor session 4-6pm. Real Google Calendar write (OAuth) + mock fallback. Harden loop.
- [ ] **Day 3 (25 Jun)** — Gemini vision deadline extraction; real Search grounding in research_web; Firestore + Google Sign-In.
- [ ] **Day 4 (26 Jun)** — proactive nudge + live re-plan engine; voice input; dashboard polish.
- [ ] **Day 5 (27 Jun)** — UI/UX polish, streak gamification, error handling, edge cases.
- [ ] **Day 6 (28 Jun)** — deploy to AI Studio, write Google Doc, record 2-min demo, test public link incognito.
- [ ] **29 Jun <2pm** — final submit on BlockseBlock. Buffer.

## Submission (3 mandatory)
- [ ] Public deployed link (AI Studio) — stays live through judging
- [ ] GitHub repo — code + README
- [ ] Google Doc — Problem Statement / Solution Overview / Key Features / Technologies / Google Technologies

## Architecture
AI Studio Build app → React + Vite + `@google/genai`.
`runAgentLoop()` drives Gemini function-calling; `tools.ts` executors mutate the
store so the live demo never breaks on external OAuth. Real APIs primary, mock fallback wired.

```
src/agent/agentLoop.ts   loop: generateContent → execute tools → feed back
src/agent/tools.ts       7 function declarations + executors
src/agent/systemPrompt.ts agent operating instructions
src/agent/gemini.ts      @google/genai client (gemini-2.5-flash)
src/store.ts             in-memory state (Firestore swap Day 3)
src/App.tsx              dual-pane UI: agent trace + live plan
```
