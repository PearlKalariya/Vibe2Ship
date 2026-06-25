export type Priority = "critical" | "high" | "medium" | "low";

export interface Task {
  id: string;
  title: string;
  deadline?: string; // ISO string
  estMinutes?: number;
  priority: Priority;
  dependsOn?: string[]; // task ids
  done: boolean;
  notes?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  taskId?: string;
}

export interface Draft {
  id: string;
  kind: "email" | "message";
  to: string;
  subject?: string;
  body: string;
}

export interface Nudge {
  id: string;
  taskId: string;
  fireAt: string; // ISO
  message: string;
  level: number; // escalation level
}

export interface Habit {
  id: string;
  title: string;
  cadence: "daily" | "weekly";
  streak: number;
  lastDone?: string; // YYYY-MM-DD of last check-in
  history: string[]; // YYYY-MM-DD check-in dates
}

// One turn in the visible conversation / agent trace.
export interface TraceEntry {
  role: "user" | "agent" | "tool" | "system";
  text: string;
  tool?: string;
  data?: unknown;
}

export interface AppState {
  tasks: Task[];
  events: CalendarEvent[];
  drafts: Draft[];
  nudges: Nudge[];
  habits: Habit[];
  trace: TraceEntry[];
}
