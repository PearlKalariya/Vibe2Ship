import { useEffect, useState } from "react";
import { getState, subscribe } from "./store";
import type { AppState } from "./types";
import { runAgentLoop } from "./agent/agentLoop";

const SAMPLE =
  "I have a job interview at Acme on Thursday, a 20-page report due Friday 5pm, and rent due tomorrow. Help.";

export function App() {
  const [state, setLocal] = useState<AppState>(getState());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribe(setLocal), []);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setInput("");
    setBusy(true);
    try {
      await runAgentLoop(text);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <h1>⚡ Clutch</h1>
        <p>Never miss again. Your agent handles the last mile.</p>
      </header>

      <div className="grid">
        {/* Left: agent conversation + trace */}
        <section className="panel">
          <h2>Agent</h2>
          <div className="trace">
            {state.trace.length === 0 && (
              <div className="empty">
                Drop your chaos in. Try:
                <button className="link" onClick={() => send(SAMPLE)}>
                  “{SAMPLE}”
                </button>
              </div>
            )}
            {state.trace.map((t, i) => (
              <div key={i} className={`msg ${t.role}`}>
                {t.role === "tool" ? (
                  <code>🔧 {t.tool}</code>
                ) : (
                  <span>{t.text}</span>
                )}
              </div>
            ))}
            {busy && <div className="msg system">thinking…</div>}
          </div>
          <div className="composer">
            <input
              value={input}
              placeholder="What do you need to get done?"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
            />
            <button onClick={() => send(input)} disabled={busy}>
              Send
            </button>
          </div>
        </section>

        {/* Right: what the agent actually did */}
        <section className="panel">
          <h2>Plan</h2>

          <h3>Tasks</h3>
          {state.tasks.length === 0 && <p className="muted">none yet</p>}
          {state.tasks.map((t) => (
            <div key={t.id} className={`row prio-${t.priority}`}>
              <span>{t.title}</span>
              <small>
                {t.priority}
                {t.deadline ? ` · ${new Date(t.deadline).toLocaleString()}` : ""}
              </small>
            </div>
          ))}

          <h3>Calendar</h3>
          {state.events.length === 0 && <p className="muted">none yet</p>}
          {state.events.map((e) => (
            <div key={e.id} className="row">
              <span>{e.title}</span>
              <small>{new Date(e.start).toLocaleString()}</small>
            </div>
          ))}

          <h3>Drafts</h3>
          {state.drafts.length === 0 && <p className="muted">none yet</p>}
          {state.drafts.map((d) => (
            <div key={d.id} className="row col">
              <strong>
                {d.kind} → {d.to}
              </strong>
              {d.subject && <em>{d.subject}</em>}
              <p>{d.body}</p>
            </div>
          ))}

          <h3>Nudges</h3>
          {state.nudges.length === 0 && <p className="muted">none yet</p>}
          {state.nudges.map((n) => (
            <div key={n.id} className="row">
              <span>{n.message}</span>
              <small>L{n.level} · {new Date(n.fireAt).toLocaleString()}</small>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
