import type { AppState } from "./types";

// Minimal in-memory store with subscribe. Day 3 swaps persistence for Firestore;
// the agent's tool executors mutate THIS so the demo never depends on external OAuth.
let state: AppState = {
  tasks: [],
  events: [],
  drafts: [],
  nudges: [],
  habits: [],
  trace: [],
};

type Listener = (s: AppState) => void;
const listeners = new Set<Listener>();

export function getState(): AppState {
  return state;
}

export function setState(patch: Partial<AppState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l(state));
}

export function update(fn: (s: AppState) => Partial<AppState>): void {
  setState(fn(state));
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
