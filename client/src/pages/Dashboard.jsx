import { useEffect, useState } from "react";
import { getStats } from "../services/dashboardService";
import { getCompany } from "../services/companyService";
import Layout from "../components/Layout";

/* ── tiny toast helper ─────────────────────────────────────────────────── */
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };
  return { toast, show };
}

/* ── status colour map ──────────────────────────────────────────────────── */
const STATUS = {
  todo:       { label: "To-Do",       color: "#94a3b8", glow: "rgba(148,163,184,0.18)", bg: "rgba(148,163,184,0.07)", border: "rgba(148,163,184,0.18)" },
  inProgress: { label: "In Progress", color: "#fbbf24", glow: "rgba(251,191,36,0.22)",  bg: "rgba(251,191,36,0.07)",  border: "rgba(251,191,36,0.2)"  },
  completed:  { label: "Completed",   color: "#34d399", glow: "rgba(52,211,153,0.22)",  bg: "rgba(52,211,153,0.07)",  border: "rgba(52,211,153,0.2)"  },
  failed:     { label: "Failed",      color: "#f87171", glow: "rgba(248,113,113,0.22)", bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.2)"  },
};

/* ── pie builder ────────────────────────────────────────────────────────── */
function buildPie(team) {
  const total = team.totalTasks || 0;
  if (!total) return "conic-gradient(#1e293b 0 100%)";
  const todo      = ((team.todoTasks || 0) / total) * 100;
  const progress  = ((team.inProgressTasks || 0) / total) * 100;
  const done      = ((team.completedTasks || 0) / total) * 100;
  const fail      = ((team.failedTasks || 0) / total) * 100;
  const c1 = todo;
  const c2 = c1 + progress;
  const c3 = c2 + done;
  const c4 = c3 + fail;
  return `conic-gradient(${STATUS.todo.color} 0% ${c1}%, ${STATUS.inProgress.color} ${c1}% ${c2}%, ${STATUS.completed.color} ${c2}% ${c3}%, ${STATUS.failed.color} ${c3}% ${c4}%)`;
}

/* ── TaskPill ───────────────────────────────────────────────────────────── */
function TaskPill({ title, color }) {
  return (
    <li style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)"
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: color, flexShrink: 0,
        boxShadow: `0 0 6px ${color}`
      }} />
      <span style={{ fontSize: "0.78rem", color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {title}
      </span>
    </li>
  );
}

/* ── StatusCard ─────────────────────────────────────────────────────────── */
function StatusCard({ statusKey, tasks }) {
  const s = STATUS[statusKey];
  const icons = {
    todo:       "📋",
    inProgress: "⚡",
    completed:  "✅",
    failed:     "🚫",
  };
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 14, padding: "14px 16px",
      boxShadow: `0 0 24px ${s.glow}`,
      transition: "transform 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: "0.9rem" }}>{icons[statusKey]}</span>
          <p style={{ fontSize: "0.78rem", fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {s.label}
          </p>
        </div>
        <span style={{
          background: s.color, color: "#0a0f1e",
          fontSize: "0.68rem", fontWeight: 800, padding: "2px 8px",
          borderRadius: 999,
        }}>
          {tasks.length}
        </span>
      </div>
      {tasks.length === 0 ? (
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No tasks</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 140, overflowY: "auto" }}>
          {tasks.map((title, i) => (
            <TaskPill key={i} title={title} color={s.color} />
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── TeamCard ───────────────────────────────────────────────────────────── */
function TeamCard({ team }) {
  const pieGrad = buildPie(team);
  return (
    <div style={{
      background: "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18,
      padding: "20px 22px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      display: "flex", flexDirection: "column", gap: 16
    }}>
      {/* Team header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
            {team.teamName}
          </h2>
          <p style={{ fontSize: "0.72rem", color: "#475569", marginTop: 3 }}>
            {team.totalTasks} task{team.totalTasks !== 1 ? "s" : ""} total
          </p>
        </div>
        {/* Pie */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: pieGrad,
            boxShadow: team.totalTasks
              ? "0 0 18px rgba(249,115,22,0.25), 0 0 36px rgba(249,115,22,0.08)"
              : "none",
          }} />
          <div style={{
            position: "absolute", inset: "10px",
            borderRadius: "50%", background: "rgba(8,15,30,0.92)"
          }} />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.7rem", fontWeight: 800, color: "#e2e8f0"
          }}>
            {team.totalTasks}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
        {[
          { key: "todo",      val: team.todoTasks },
          { key: "inProgress",val: team.inProgressTasks },
          { key: "completed", val: team.completedTasks },
          { key: "failed",    val: team.failedTasks },
        ].map(({ key, val }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS[key].color, flexShrink: 0 }} />
            <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{STATUS[key].label}:</span>
            <span style={{ fontSize: "0.72rem", color: "#e2e8f0", fontWeight: 700 }}>{val ?? 0}</span>
          </div>
        ))}
      </div>

      {/* Status cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <StatusCard statusKey="todo"       tasks={team.tasks?.todo || []} />
        <StatusCard statusKey="inProgress" tasks={team.tasks?.inProgress || []} />
        <StatusCard statusKey="completed"  tasks={team.tasks?.completed || []} />
        <StatusCard statusKey="failed"     tasks={team.tasks?.failed || []} />
      </div>
    </div>
  );
}

/* ── Dashboard ──────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [stats, setStats]     = useState(null);
  const [company, setCompany] = useState(null);
  const { toast, show }       = useToast();

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [statsData, companyData] = await Promise.all([getStats(), getCompany()]);
        if (!cancelled) { setStats(statsData); setCompany(companyData); }
      } catch (err) {
        console.error("Failed to load dashboard", err);
      }
    };
    fetchData();
    const intervalId = setInterval(fetchData, 30_000);
    return () => { cancelled = true; clearInterval(intervalId); };
  }, []);

  if (!stats) {
    return (
      <Layout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            border: "3px solid rgba(249,115,22,0.15)",
            borderTop: "3px solid #f97316",
            animation: "spin 0.9s linear infinite"
          }} />
          <p style={{ color: "#475569", fontSize: "0.85rem" }}>Loading dashboard…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    );
  }

  const teams = stats.teams || [];

  return (
    <Layout>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .dash-team-card { animation: fadeUp 0.4s ease both; }
        .dash-team-card:nth-child(2) { animation-delay: 0.07s; }
        .dash-team-card:nth-child(3) { animation-delay: 0.14s; }
        .dash-team-card:nth-child(4) { animation-delay: 0.21s; }
        .toast-popup {
          position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
          background: rgba(15,23,42,0.95); border: 1px solid rgba(52,211,153,0.4);
          color: #34d399; padding: 10px 22px; border-radius: 999px;
          font-size: 0.82rem; font-weight: 600; letter-spacing: 0.02em;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(52,211,153,0.15);
          z-index: 9999; backdrop-filter: blur(12px);
          animation: fadeUp 0.3s ease;
        }
      `}</style>

      {/* Toast */}
      {toast && <div className="toast-popup">✓ {toast}</div>}

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontSize: "1.9rem", fontWeight: 800, margin: 0,
          background: "linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
        }}>
          Dashboard
        </h1>
        <p style={{ fontSize: "0.78rem", color: "#334155", marginTop: 4 }}>
          Live overview · refreshes every 30 s
        </p>
      </div>

      {/* Company Code card */}
      {company && (
        <div style={{
          background: "rgba(15,23,42,0.6)", backdropFilter: "blur(14px)",
          border: "1px solid rgba(249,115,22,0.2)", borderRadius: 16,
          padding: "16px 20px", marginBottom: 28,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 0 32px rgba(249,115,22,0.08), 0 8px 24px rgba(0,0,0,0.3)"
        }}>
          <div>
            <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 4 }}>
              Company Invite Code
            </p>
            <p style={{ fontFamily: "'JetBrains Mono','Fira Mono','Courier New',monospace", fontSize: "1.4rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "0.12em" }}>
              {company.code}
            </p>
            <p style={{ fontSize: "0.7rem", color: "#334155", marginTop: 3 }}>
              Share this code with new employees to join your workspace
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(company.code);
              show("Code copied to clipboard");
            }}
            style={{
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              border: "none", color: "#fff", fontWeight: 700,
              fontSize: "0.78rem", padding: "9px 20px", borderRadius: 10,
              cursor: "pointer", letterSpacing: "0.04em",
              boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
              transition: "opacity 0.15s, transform 0.15s",
              flexShrink: 0
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.04)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1";    e.currentTarget.style.transform = "scale(1)"; }}
          >
            Copy Code
          </button>
        </div>
      )}

      {/* Teams overview strip */}
      {teams.length > 1 && (
        <div style={{
          background: "rgba(15,23,42,0.5)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16,
          padding: "16px 18px", marginBottom: 28,
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)"
        }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
            Teams at a Glance
          </p>
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 4 }}>
            {teams.map((team) => (
              <div key={`strip-${team.teamId}`} style={{
                minWidth: 160, background: "rgba(8,15,30,0.7)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, padding: "12px 14px", flexShrink: 0, display: "flex", alignItems: "center", gap: 12
              }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: buildPie(team) }} />
                  <div style={{ position: "absolute", inset: "6px", borderRadius: "50%", background: "rgba(8,15,30,0.9)" }} />
                  <div style={{
                    position: "absolute", inset: 0, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: "0.62rem", fontWeight: 800, color: "#e2e8f0"
                  }}>
                    {team.totalTasks}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 88 }}>
                    {team.teamName}
                  </p>
                  <p style={{ fontSize: "0.68rem", color: "#334155", marginTop: 2 }}>
                    {team.completedTasks ?? 0} done · {team.failedTasks ?? 0} failed
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team detail cards */}
      {teams.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          height: 260, background: "rgba(15,23,42,0.4)", borderRadius: 18,
          border: "1px dashed rgba(255,255,255,0.08)", gap: 12
        }}>
          <span style={{ fontSize: "2rem" }}>🏗️</span>
          <p style={{ color: "#334155", fontSize: "0.9rem", fontWeight: 600 }}>No teams yet</p>
          <p style={{ color: "#1e293b", fontSize: "0.78rem" }}>Create a team to start tracking tasks here.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: 20 }}>
          {teams.map((team, i) => (
            <div key={team.teamId} className="dash-team-card" style={{ animationDelay: `${i * 0.07}s` }}>
              <TeamCard team={team} />
            </div>
          ))}
        </div>
      )}

    </Layout>
  );
}