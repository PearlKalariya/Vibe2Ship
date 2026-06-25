import { update } from "./store";
import type { Task } from "./types";

// ---- Google Calendar integration (no OAuth, never breaks) -----------------
// Builds a prefilled Google Calendar "create event" link. Clicking it adds the
// event to the user's real Google Calendar.
function gcalStamp(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export function gcalUrl(
  title: string,
  startISO: string,
  endISO: string,
  details = "Scheduled by Clutch"
): string {
  const dates = `${gcalStamp(startISO)}/${gcalStamp(endISO)}`;
  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${dates}` +
    `&details=${encodeURIComponent(details)}`
  );
}

// ---- Habit streaks --------------------------------------------------------
export function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

// Log a check-in for today. Consecutive days grow the streak; a gap resets it.
export function checkinHabit(id: string): void {
  update((st) => ({
    habits: st.habits.map((h) => {
      if (h.id !== id) return h;
      const today = dayKey();
      if (h.lastDone === today) return h; // already checked in today
      const streak = h.lastDone === yesterdayKey() ? h.streak + 1 : 1;
      return { ...h, streak, lastDone: today, history: [...h.history, today] };
    }),
  }));
}

export function doneToday(lastDone?: string): boolean {
  return lastDone === dayKey();
}

// ---- Predictive miss-risk ------------------------------------------------
// Estimate how likely the user is to MISS a task: how much of the remaining
// time the work needs, weighted by priority. Pure client-side foresight.
export function missRisk(t: Task): number | null {
  if (t.done || !t.deadline) return null;
  const hoursLeft = (new Date(t.deadline).getTime() - Date.now()) / 3.6e6;
  if (hoursLeft <= 0) return 99;
  const needHours = (t.estMinutes ?? 45) / 60;
  const weight =
    ({ critical: 1.3, high: 1.15, medium: 1, low: 0.85 } as Record<string, number>)[
      t.priority
    ] ?? 1;
  const ratio = (needHours / hoursLeft) * weight;
  return Math.max(1, Math.round(Math.min(ratio * 100, 99)));
}
