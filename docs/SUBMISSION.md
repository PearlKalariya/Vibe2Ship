# Clutch — Project Submission

**Vibe2Ship Hackathon · Problem Statement 1: The Last-Minute Life Saver**

> Paste this into a Google Doc → Share → "Anyone with the link: Viewer" → submit that link on BlockseBlock. Fill the two links at the top before submitting.

- **Deployed App (Google AI Studio):** `<PASTE PUBLIC LINK>`
- **GitHub Repository:** https://github.com/PearlKalariya/Vibe2Ship
- **Team / Builder:** Pearl Kalariya

---

## Problem Statement Selected

**Problem Statement 1 — The Last-Minute Life Saver.**

Students, professionals, and entrepreneurs constantly miss deadlines, assignments, meetings, bill payments, and interviews. Existing productivity tools rely on **passive reminders** that are easy to ignore and do nothing to actually get the task done.

---

## Solution Overview

**Clutch** is an autonomous AI chief-of-staff that doesn't just remind you — it **plans and executes the last mile** so deadlines never slip.

Instead of a chatbot that answers questions, Clutch runs a real agentic loop on Google's Gemini: it **perceives** your situation, **plans** a breakdown, **prioritizes** by deadline risk, **acts** using tools (schedules focus blocks, drafts the emails you must send, researches what you need to know, sets proactive nudges), and **reflects** — re-planning automatically when a task slips.

You can hand Clutch your chaos three ways: **type it**, **speak it** (voice), or **paste a screenshot** of a syllabus, assignment sheet, or email — and Clutch reads the image, extracts every deadline, and turns it into a live, scheduled plan in one step.

---

## Key Features

- **Autonomous agent loop (Perceive → Plan → Prioritize → Act → Reflect)** — chains multiple tool calls per turn to fully handle a request, not a single reply.
- **7 agent tools via Gemini function calling:** decompose a goal into subtasks, reprioritize by deadline-risk, schedule focus blocks, draft emails/messages, web research, set proactive nudges, mark tasks done.
- **Screenshot-to-plan (multimodal):** attach a syllabus/email/calendar image → Gemini vision extracts every date and task → auto-builds the timeline.
- **Deadline-risk prioritization:** ranks tasks by slack-time × importance, so the most at-risk work surfaces first.
- **Plan My Day (one-click autonomy):** the agent reads every open task and your calendar, then builds a conflict-free, time-blocked schedule and tells you exactly what to start now.
- **Predictive miss-risk:** each task shows a live "% chance of missing" score from effort-needed vs time-left — foresight, not just reminders.
- **Drafts the work, not just reminders:** writes the actual email/message (e.g. extension request, payment reminder) ready to send.
- **Grounded research:** pulls current facts (e.g. interview-company prep) via Google Search grounding and folds them into the plan.
- **Proactive nudges with escalation:** re-engages you *before* something is at risk, escalating urgency.
- **Real deadline notifications:** browser push reminders fire automatically 1 day and 30 minutes before every deadline (plus the agent's own nudges) — reminders that actually reach you, not just stored.
- **Goal & habit tracking:** track recurring goals (study daily, gym) with streak counters and one-tap check-ins.
- **Google Calendar integration:** every scheduled block has a one-click "Add to Google Calendar" link.
- **Personalized recommendations:** every plan ends with one tailored productivity tip for your situation.
- **Voice-enabled assistance:** dictate your tasks hands-free.
- **Live impact dashboard:** open tasks, scheduled blocks, drafts, and "due &lt; 24h" risk count update in real time.
- **Resilient by design:** automatic retry + model fallback so transient API spikes never break a live session.

---

## Technologies Used

- **Frontend:** React 19, TypeScript, Vite 6
- **AI SDK:** `@google/genai` (Google Gen AI SDK)
- **Agent architecture:** custom function-calling loop with tool executors and an in-memory state store (mock fallbacks so the experience never depends on external OAuth during a demo)
- **Browser APIs:** Web Speech API (voice), Web Notifications API (deadline reminders), FileReader (image upload → base64)
- **Build & Deploy:** Google AI Studio

---

## Google Technologies Utilized

1. **Google AI Studio** — used as the core tool to build and deploy the application.
2. **Gemini 2.5 (Flash / Flash-Lite)** — the reasoning engine driving the entire agent.
3. **Gemini Function Calling** — powers the 7-tool agentic action layer (the core of the autonomy).
4. **Gemini Multimodal Vision** — extracts deadlines and tasks directly from uploaded images.
5. **Google Search Grounding** — real-time grounded research feeding the agent's plan.
6. **Google Calendar** — one-click add-to-calendar links for every scheduled block.
7. **Web Speech API** — voice-enabled task capture.

*(Optional / roadmap: Google Calendar API two-way OAuth sync and Firebase/Firestore for persistence + Google Sign-In.)*

---

## Why This Wins (mapping to the evaluation matrix)

| Criteria | Weight | How Clutch delivers |
|---|---|---|
| Problem Solving & Impact | 20% | Targets the exact pain — moves from passive reminders to executing the task. |
| Agentic Depth | 20% | A genuine multi-step Perceive→Plan→Act→Reflect loop with 7 tools and autonomous re-planning, not a chatbot. |
| Innovation & Creativity | 20% | Screenshot-to-plan: paste a syllabus/email image and watch it become a scheduled, drafted plan. |
| Usage of Google Technologies | 15% | 6 Google technologies stacked (AI Studio, Gemini, function calling, vision, Search grounding, Web Speech). |
| Product Experience & Design | 10% | Clean dual-pane: live agent trace beside a real-time plan dashboard, with accessibility and motion polish. |
| Technical Implementation | 10% | Typed, modular agent loop; resilient with retry + model fallback; clean, working build. |
| Completeness & Usability | 5% | Three input modes (type / voice / image), reset-to-demo, no dead buttons, graceful fallbacks. |
