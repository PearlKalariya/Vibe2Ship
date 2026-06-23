import { useEffect, useState } from "react";
import { getState, setState, subscribe, update } from "./store";
import type { AppState, Priority } from "./types";
import { runAgentLoop } from "./agent/agentLoop";
import {
  Bolt,
  Tool,
  Calendar,
  Mail,
  Bell,
  Check,
  ListTodo,
  Send,
  Refresh,
  Sparkle,
  Clock,
  Paperclip,
} from "./components/icons";

// Read an image File into base64 (without the data: URL prefix) for Gemini inlineData.
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const SAMPLES = [
  "I have a job interview at Acme on Thursday, a 20-page report due Friday 5pm, and rent due tomorrow. Help.",
  "Final exam Monday, gym at 6pm today, and I keep forgetting to call the dentist.",
  "Launch our product on Friday — landing page, demo video, and a press email still pending.",
];

// Human-friendly label per tool name shown in the agent trace.
const TOOL_LABEL: Record<string, string> = {
  decompose_goal: "Breaking goal into tasks",
  reprioritize_day: "Reprioritising by deadline risk",
  schedule_block: "Scheduling a focus block",
  draft_communication: "Drafting a message",
  research_web: "Researching",
  set_proactive_nudge: "Setting a proactive nudge",
  mark_task_done: "Marking task done",
};

function relTime(iso?: string): string {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - Date.now();
  const past = ms < 0;
  const m = Math.abs(ms) / 60000;
  let s: string;
  if (m < 60) s = `${Math.round(m)}m`;
  else if (m < 1440) s = `${Math.round(m / 60)}h`;
  else s = `${Math.round(m / 1440)}d`;
  return past ? `${s} ago` : `in ${s}`;
}

const PRIO_RANK: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function App() {
  const [state, setLocal] = useState<AppState>(getState());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribe(setLocal), []);

  async function send(
    text: string,
    image?: { data: string; mimeType: string }
  ) {
    if ((!text.trim() && !image) || busy) return;
    setInput("");
    setBusy(true);
    try {
      await runAgentLoop(text, image);
    } catch (e) {
      console.error(e);
      update((st) => ({
        trace: [...st.trace, { role: "system", text: `${String(e)}` }],
      }));
    } finally {
      setBusy(false);
    }
  }

  async function attach(file?: File) {
    if (!file || busy) return;
    const data = await fileToBase64(file);
    const text =
      input.trim() ||
      "Here is a screenshot of my deadlines/commitments. Extract every date and task, then build my plan.";
    await send(text, { data, mimeType: file.type });
  }

  function reset() {
    setState({ tasks: [], events: [], drafts: [], nudges: [], trace: [] });
  }

  const open = state.tasks.filter((t) => !t.done);
  const atRisk = open.filter(
    (t) => t.deadline && new Date(t.deadline).getTime() - Date.now() < 36e5 * 24
  ).length;

  const started = state.trace.length > 0 || busy;
  const sortedTasks = [...state.tasks].sort(
    (a, b) =>
      Number(a.done) - Number(b.done) ||
      PRIO_RANK[a.priority] - PRIO_RANK[b.priority]
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">
            <Bolt size={20} />
          </span>
          <div>
            <h1>Clutch</h1>
            <p>Never miss again. Your agent handles the last mile.</p>
          </div>
        </div>
        {started && (
          <button className="ghost" onClick={reset} aria-label="Reset demo">
            <Refresh size={16} /> Reset
          </button>
        )}
      </header>

      {/* Live impact stats */}
      <div className="stats">
        <Stat icon={<ListTodo size={16} />} label="Open tasks" value={open.length} />
        <Stat icon={<Calendar size={16} />} label="Scheduled" value={state.events.length} />
        <Stat icon={<Mail size={16} />} label="Drafted" value={state.drafts.length} />
        <Stat icon={<Clock size={16} />} label="Due <24h" value={atRisk} tone={atRisk ? "warn" : undefined} />
      </div>

      <div className="grid">
        {/* Left: agent conversation + trace */}
        <section className="panel agent">
          <div className="panel-head">
            <Sparkle size={16} />
            <h2>Agent</h2>
          </div>

          <div className="trace" aria-live="polite">
            {!started && (
              <div className="empty">
                <p className="empty-title">Drop your chaos in.</p>
                <p className="muted">Type it, or attach a syllabus / email screenshot — Clutch extracts every deadline, schedules it, drafts what you must send, then nudges you to the finish.</p>
                <div className="chips">
                  {SAMPLES.map((s, i) => (
                    <button key={i} className="chip" onClick={() => send(s)}>
                      <Sparkle size={13} /> {s.length > 52 ? s.slice(0, 52) + "…" : s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {state.trace.map((t, i) => {
              if (t.role === "tool") {
                return (
                  <div key={i} className="tool-chip">
                    <span className="tool-ico"><Tool size={13} /></span>
                    <span>{TOOL_LABEL[t.tool ?? ""] ?? t.tool}</span>
                    <Check size={13} className="tool-done" />
                  </div>
                );
              }
              if (t.role === "system") {
                return <div key={i} className="msg system">{t.text}</div>;
              }
              return (
                <div key={i} className={`msg ${t.role}`}>
                  {t.text}
                </div>
              );
            })}

            {busy && (
              <div className="skeleton" aria-label="Agent thinking">
                <span /><span /><span />
              </div>
            )}
          </div>

          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor="ask" className="sr-only">What do you need to get done?</label>
            <label className="attach" aria-label="Attach a screenshot" title="Attach a screenshot of your deadlines">
              <Paperclip size={16} />
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={busy}
                onChange={(e) => {
                  attach(e.target.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            <input
              id="ask"
              value={input}
              placeholder="Type, or attach a syllabus / email screenshot…"
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={busy} aria-label="Send">
              <Send size={16} />
            </button>
          </form>
        </section>

        {/* Right: what the agent actually did */}
        <section className="panel">
          <div className="panel-head">
            <ListTodo size={16} />
            <h2>Plan</h2>
          </div>

          <Group icon={<ListTodo size={14} />} title="Tasks" count={state.tasks.length}>
            {sortedTasks.map((t) => (
              <div key={t.id} className={`card task prio-${t.priority}${t.done ? " done" : ""}`}>
                <span className={`tick${t.done ? " on" : ""}`}>{t.done && <Check size={12} />}</span>
                <div className="card-body">
                  <span className="task-title">{t.title}</span>
                  <div className="meta">
                    <span className={`pill p-${t.priority}`}>{t.priority}</span>
                    {t.deadline && <span className="due">{relTime(t.deadline)}</span>}
                    {t.estMinutes ? <span className="muted">· {t.estMinutes}m</span> : null}
                  </div>
                </div>
              </div>
            ))}
          </Group>

          <Group icon={<Calendar size={14} />} title="Calendar" count={state.events.length}>
            {state.events.map((e) => (
              <div key={e.id} className="card event">
                <span className="time-dot" />
                <div className="card-body">
                  <span className="task-title">{e.title}</span>
                  <span className="muted">
                    {new Date(e.start).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                    {" – "}
                    {new Date(e.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </Group>

          <Group icon={<Mail size={14} />} title="Drafts" count={state.drafts.length}>
            {state.drafts.map((d) => (
              <div key={d.id} className="card draft">
                <div className="draft-head">
                  <Mail size={14} />
                  <strong>{d.to}</strong>
                  <span className="kind">{d.kind}</span>
                  <button
                    className="copy"
                    onClick={() => navigator.clipboard?.writeText(d.body)}
                    aria-label="Copy draft"
                  >
                    Copy
                  </button>
                </div>
                {d.subject && <em className="subj">{d.subject}</em>}
                <p className="body">{d.body}</p>
              </div>
            ))}
          </Group>

          <Group icon={<Bell size={14} />} title="Nudges" count={state.nudges.length}>
            {state.nudges.map((n) => (
              <div key={n.id} className={`card nudge lvl-${Math.min(n.level, 3)}`}>
                <Bell size={14} />
                <div className="card-body">
                  <span className="task-title">{n.message}</span>
                  <span className="muted">{relTime(n.fireAt)}</span>
                </div>
              </div>
            ))}
          </Group>
        </section>
      </div>

      <footer className="foot">
        Built with Google AI Studio · Gemini 2.5 · function-calling agent loop
      </footer>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "warn";
}) {
  return (
    <div className={`stat${tone ? ` ${tone}` : ""}`}>
      <span className="stat-ico">{icon}</span>
      <span className="stat-val">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function Group({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="group">
      <div className="group-head">
        {icon}
        <h3>{title}</h3>
        <span className="badge">{count}</span>
      </div>
      {count === 0 ? <p className="muted empty-row">none yet</p> : children}
    </div>
  );
}
