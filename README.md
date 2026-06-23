# ⚡ Clutch — Never miss again

Autonomous AI chief-of-staff. Not a reminder app — an agent that **plans and executes**
the last mile so deadlines never slip. Built for Vibe2Ship (Problem Statement 1: The
Last-Minute Life Saver).

## What makes it agentic
A real **Perceive → Plan → Prioritize → Act → Reflect** loop on Gemini function calling:

- **decompose_goal** — break a brain-dump into ordered subtasks
- **reprioritize_day** — rank by deadline risk × importance
- **schedule_block** — put focused work on the calendar
- **draft_communication** — write the email/message you must send
- **research_web** — grounded lookups (Google Search)
- **set_proactive_nudge** — re-engage before something is at risk

The agent chains multiple tools per turn and re-plans on its own when a task slips.

## Google technologies
Google AI Studio · Gemini 2.5 (function calling) · Gemini vision · Google Search
grounding · Google Calendar API · Firebase · Web Speech API.

## Run locally
```bash
npm install
cp .env.example .env   # add your key from https://aistudio.google.com/apikey
npm run dev
```

## Deploy
Built in **Google AI Studio**; deploy via AI Studio
(https://ai.google.dev/gemini-api/docs/aistudio-deploying).

See [PLAN.md](PLAN.md) for the full build plan and schedule.
# Vibe2Ship
