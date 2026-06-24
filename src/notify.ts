import type { Nudge, Task } from "./types";

// Browser notifications: remind the user 1 day and 30 min before each deadline,
// and fire the agent's proactive nudges at their scheduled time.
// Timers live while the tab is open (enough for the demo); a Service Worker would
// extend this to background push as a future step.

const DAY = 864e5;
const HALF_HOUR = 18e5;

// Keys already scheduled, so re-running scheduleAll is idempotent.
const scheduled = new Map<string, ReturnType<typeof setTimeout>>();

// In-app toast layer — always visible on screen, independent of OS notification
// settings (which judges' machines often block). This is the reliable demo path.
export interface Toast {
  id: string;
  title: string;
  body: string;
  level: number;
}
type ToastListener = (t: Toast) => void;
const toastListeners = new Set<ToastListener>();

export function onToast(cb: ToastListener): () => void {
  toastListeners.add(cb);
  return () => toastListeners.delete(cb);
}

function emitToast(title: string, body: string, level = 1) {
  const t: Toast = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    body,
    level,
  };
  toastListeners.forEach((l) => l(t));
}

export function notifySupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permission(): NotificationPermission {
  return notifySupported() ? Notification.permission : "denied";
}

export async function enableNotifications(): Promise<NotificationPermission> {
  if (!notifySupported()) return "denied";
  const p =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  // Confirm regardless — in-app toasts work even if the OS blocks notifications.
  fire("Reminders on", "I'll ping you 1 day and 30 min before every deadline.");
  return p;
}

function fire(title: string, body: string, level = 1) {
  // Always show the in-app toast (reliable). Also try the OS notification (bonus).
  emitToast(title, body, level);
  if (permission() === "granted") {
    try {
      new Notification(title, {
        body,
        icon:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%23ffd23f'/%3E%3Cpath d='M13 4 6 13h5l-1 7 7-9h-5l1-7Z' fill='%231b1606'/%3E%3C/svg%3E",
      });
    } catch {
      /* ignore */
    }
  }
}

function arm(key: string, fireInMs: number, title: string, body: string, level = 1) {
  if (scheduled.has(key)) return;
  // Skip windows missed by more than a minute.
  if (fireInMs < -60_000) return;
  const delay = Math.max(fireInMs, 0);
  const id = setTimeout(() => {
    fire(title, body, level);
    scheduled.delete(key);
  }, delay);
  scheduled.set(key, id);
}

export function scheduleReminders(tasks: Task[], nudges: Nudge[]): void {
  const now = Date.now();

  for (const t of tasks) {
    if (t.done || !t.deadline) continue;
    const due = new Date(t.deadline).getTime();
    arm(`${t.id}:1d`, due - DAY - now, "Due tomorrow", `${t.title} — start now so you're not last-minute.`);
    arm(`${t.id}:30m`, due - HALF_HOUR - now, "Due in 30 min", `${t.title} — wrap it up.`);
  }

  for (const n of nudges) {
    const at = new Date(n.fireAt).getTime();
    const title = n.level >= 3 ? "Urgent" : n.level === 2 ? "Heads up" : "Reminder";
    arm(`${n.id}:nudge`, at - now, title, n.message, n.level);
  }
}

// Demo helper: fire a sample reminder a few seconds out so judges see it live
// even when real deadlines are days away.
export function demoReminder(): void {
  setTimeout(
    () => fire("Due in 30 min", "Finish the report draft — you're almost there.", 2),
    3000
  );
}
