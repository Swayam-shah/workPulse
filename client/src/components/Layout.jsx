import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getTeams } from "../services/teamService";
import api from "../api/axios";
import MeetNotification from "./MeetNotification";
import ChatPanel from "./ChatPanel";

/* ── nav icon SVGs ─────────────────────────────────────────────────────── */
const NAV_ICONS = {
  "/dashboard": (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  "/tasks": (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  ),
  "/teams": (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  "/users": (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 10-16 0" />
    </svg>
  ),
  "/reviews": (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  "/approvals": (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

const PAGE_LABELS = {
  "/dashboard": "Dashboard",
  "/tasks":     "Tasks",
  "/teams":     "Teams",
  "/users":     "Users",
  "/reviews":   "Employees",
  "/approvals": "Approvals",
};

export default function Layout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin   = user?.role === "admin";

  const [teams, setTeams]               = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [chatOpen, setChatOpen]         = useState(false);
  const [unreadMsg, setUnreadMsg]       = useState(0);

  const openMeetModalRef = useRef(null); // MeetNotification exposes its open fn here

  /* ── fetch teams ── */
  useEffect(() => {
    let cancelled = false;
    const fetchTeams = async () => {
      try {
        const data = await getTeams();
        if (!cancelled) setTeams(Array.isArray(data) ? data : []);
      } catch { /* silent */ }
    };
    fetchTeams();
    const id = setInterval(fetchTeams, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  /* ── fetch pending count (admin only, every 30s) ── */
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const fetchPending = async () => {
      try {
        const res = await api.get("/users/pending");
        if (!cancelled) setPendingCount(Array.isArray(res.data) ? res.data.length : 0);
      } catch { /* silent */ }
    };
    fetchPending();
    const id = setInterval(fetchPending, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isAdmin]);

  /* ── fetch total unread messages ── */
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get("/messages/contacts");
        if (Array.isArray(res.data)) {
          setUnreadMsg(res.data.reduce((s, c) => s + (c.unreadCount || 0), 0));
        }
      } catch {}
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 15_000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    navigate("/");
  };

  const pageLabel = PAGE_LABELS[location.pathname] || "";

  const navLink = (to, label) => {
    const active = location.pathname === to;
    const icon   = NAV_ICONS[to];
    return (
      <Link key={to} to={to} className={`nav-link ${active ? "nav-link--active" : ""}`}>
        <span className="nav-link-icon">{icon}</span>
        {label}
      </Link>
    );
  };

  const approvalsLink = () => {
    const active = location.pathname === "/approvals";
    return (
      <Link
        key="/approvals"
        to="/approvals"
        className={`nav-link ${active ? "nav-link--active" : ""}`}
        style={{ justifyContent: "space-between" }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span className="nav-link-icon">{NAV_ICONS["/approvals"]}</span>
          Approvals
        </span>
        {pendingCount > 0 && (
          <span className="pending-badge">{pendingCount}</span>
        )}
      </Link>
    );
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#050b18", color: "#cbd5e1", fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── Meet notification banner + modal ── */}
      <MeetNotification openModalRef={openMeetModalRef} />

      {/* ── Chat panel ── */}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* ── Sidebar ── */}
      <div className="sidebar">
        <div className="sidebar-glow" />

        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18l4-8 4 5 3-4 4 7" />
            </svg>
          </div>
          WorkPulse
        </div>

        <nav className="sidebar-nav">
          {navLink("/dashboard", "Dashboard")}
          {navLink("/tasks", "Tasks")}
          {navLink("/teams", "Teams")}
          {isAdmin && (
            <>
              {navLink("/users", "Users")}
              {navLink("/reviews", "Employees")}
              {approvalsLink()}
            </>
          )}
        </nav>

        {/* User card */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</p>
            <p style={{ fontSize: "0.7rem", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</p>
            <p style={{ fontSize: "0.68rem", color: isAdmin ? "#fb923c" : "#34d399", marginTop: 2, fontWeight: 600, textTransform: "capitalize" }}>{user?.role}</p>
          </div>
        </div>

        {/* Teams list */}
        {teams.length > 0 && (
          <div className="sidebar-teams">
            <p style={{ fontSize: "0.65rem", color: "#1e293b", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>
              My Teams
            </p>
            {teams.map(t => (
              <div key={t._id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 0" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#f97316", flexShrink: 0, opacity: 0.6 }} />
                <span style={{ fontSize: "0.73rem", color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <p style={{ fontSize: "0.78rem", color: "#1e293b" }}>WorkPulse</p>
            {pageLabel && (
              <>
                <span style={{ color: "#1e293b", fontSize: "0.78rem" }}>/</span>
                <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#e2e8f0" }}>{pageLabel}</p>
              </>
            )}
          </div>

          {/* Topbar right: Meet + Chat + User + Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

            {/* ── Google Meet button (admin) or Meet indicator (members) ── */}
            {isAdmin ? (
              <button
                id="start-meeting-btn"
                onClick={() => openMeetModalRef.current?.()}
                title="Start a Google Meet for the team"
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))",
                  border: "1px solid rgba(16,185,129,0.3)",
                  color: "#10b981", fontWeight: 600, fontSize: "0.78rem",
                  padding: "7px 14px", borderRadius: 9, cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.2s, transform 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.25)"; e.currentTarget.style.transform = "scale(1.03)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))"; e.currentTarget.style.transform = "scale(1)"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                Meet
              </button>
            ) : null}

            {/* ── Chat button ── */}
            <button
              id="open-chat-btn"
              onClick={() => setChatOpen(true)}
              title="Team Messages"
              style={{
                position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 34, height: 34, borderRadius: 9,
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "#818cf8", cursor: "pointer",
                transition: "background 0.2s, transform 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.22)"; e.currentTarget.style.transform = "scale(1.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.12)"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {unreadMsg > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: "#818cf8", color: "#fff",
                  fontSize: "0.58rem", fontWeight: 800,
                  padding: "1px 5px", borderRadius: 999,
                  lineHeight: 1.5, minWidth: 16, textAlign: "center",
                }}>
                  {unreadMsg > 9 ? "9+" : unreadMsg}
                </span>
              )}
            </button>

            {/* User info */}
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e2e8f0" }}>{user?.name}</p>
              <p style={{ fontSize: "0.7rem", color: "#1e293b" }}>{user?.email}</p>
            </div>

            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>

        {/* Gradient accent line under topbar */}
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.4), transparent)", flexShrink: 0 }} />

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          {children}
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .sidebar {
          width: 230px; flex-shrink: 0;
          background: rgba(8,15,30,0.92);
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex; flex-direction: column;
          padding: 24px 14px 20px;
          position: relative; overflow: hidden;
        }
        .sidebar-glow {
          position: absolute; top: -60px; left: -40px;
          width: 200px; height: 200px; border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,0.1), transparent 70%);
          pointer-events: none;
        }
        .sidebar-brand {
          display: flex; align-items: center; gap: 9px;
          font-size: 1rem; font-weight: 800; color: #f97316;
          letter-spacing: -0.3px; margin-bottom: 28px;
        }
        .sidebar-brand-icon {
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.3);
          display: flex; align-items: center; justify-content: center;
        }
        .sidebar-nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }

        .nav-link {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border-radius: 9px;
          font-size: 0.82rem; font-weight: 500; color: #374151;
          text-decoration: none;
          transition: background 0.15s, color 0.15s, transform 0.15s;
        }
        .nav-link:hover { background: rgba(255,255,255,0.045); color: #94a3b8; transform: translateX(2px); }
        .nav-link--active { background: rgba(249,115,22,0.12); color: #fb923c !important; font-weight: 600; }
        .nav-link-icon { display: flex; align-items: center; flex-shrink: 0; opacity: 0.85; }

        .pending-badge {
          background: #fbbf24; color: #1c1308;
          font-size: 0.63rem; font-weight: 800;
          padding: 1px 6px; border-radius: 999px; line-height: 1.5;
        }

        .sidebar-user {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 10px 12px; margin-top: 16px;
        }
        .sidebar-avatar {
          width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(249,115,22,0.28), rgba(249,115,22,0.08));
          border: 1px solid rgba(249,115,22,0.22);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem; font-weight: 700; color: #fb923c;
        }
        .sidebar-teams {
          margin-top: 12px; padding: 10px 12px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 10px;
        }

        .topbar {
          background: rgba(5,11,24,0.97);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 11px 32px;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .logout-btn {
          background: rgba(239,68,68,0.09); border: 1px solid rgba(239,68,68,0.22);
          color: #f87171; font-size: 0.77rem; font-weight: 600; font-family: inherit;
          padding: 7px 16px; border-radius: 8px; cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .logout-btn:hover { background: rgba(239,68,68,0.18); transform: scale(1.03); }
      `}</style>
    </div>
  );
}