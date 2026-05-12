import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import api from "../api/axios";

const SOCKET_URL = "http://localhost:5000";

/* Shared socket singleton for meet notifications */
let notifSocket = null;
function getNotifSocket() {
  if (!notifSocket) notifSocket = io(SOCKET_URL, { autoConnect: false });
  return notifSocket;
}

/* ── MeetNotification ─────────────────────────────────────────────────────── */
export default function MeetNotification({ openModalRef }) {
  const user      = JSON.parse(localStorage.getItem("user") || "{}");
  const userId    = user?._id || user?.id;
  const companyId = user?.companyId;
  const isAdmin   = user?.role === "admin";

  const [meeting, setMeeting]       = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [urlInput, setUrlInput]     = useState("");
  const [titleInput, setTitleInput] = useState("Team Meeting");
  const [starting, setStarting]     = useState(false);
  const [error, setError]           = useState("");

  /* Expose open handler to parent via ref */
  if (openModalRef) openModalRef.current = () => setShowModal(true);

  /* ── Fetch active meeting on mount ── */
  useEffect(() => {
    api.get("/meet/active")
      .then((res) => {
        if (res.data.meeting) { setMeeting(res.data.meeting); setShowBanner(true); }
      })
      .catch(() => {});
  }, []);

  /* ── Socket events ── */
  useEffect(() => {
    const socket = getNotifSocket();
    if (!socket.connected) {
      socket.connect();
      socket.emit("join", { userId, companyId });
    }
    const onStarted = (data) => { setMeeting(data); setShowBanner(true); };
    const onEnded   = ()     => { setMeeting(null); setShowBanner(false); };
    socket.on("meet:started", onStarted);
    socket.on("meet:ended",   onEnded);
    return () => { socket.off("meet:started", onStarted); socket.off("meet:ended", onEnded); };
  }, [userId, companyId]);

  const handleStart = async () => {
    if (!urlInput.trim()) { setError("Please enter a Google Meet URL."); return; }
    setError("");
    setStarting(true);
    try {
      await api.post("/meet/start", {
        roomUrl: urlInput.trim(),
        title:   titleInput.trim() || "Team Meeting",
      });
      setShowModal(false);
      setUrlInput("");
      setTitleInput("Team Meeting");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to start meeting.");
    } finally {
      setStarting(false);
    }
  };

  const handleEnd = async () => {
    try { await api.post("/meet/end"); } catch {}
  };

  return (
    <>
      {/* ── Live meeting banner ── */}
      {showBanner && meeting && (
        <div style={{
          position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)",
          zIndex: 9800,
          background: "rgba(8,15,30,0.98)",
          border: "1px solid rgba(16,185,129,0.45)",
          borderRadius: 14, padding: "11px 18px",
          display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(16,185,129,0.12)",
          backdropFilter: "blur(18px)",
          minWidth: 360, maxWidth: "90vw",
          animation: "meetBannerIn 0.3s ease both",
          fontFamily: "'Inter','Segoe UI',sans-serif",
        }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
            <div style={{ position: "absolute", inset: -4, borderRadius: "50%", background: "rgba(16,185,129,0.3)", animation: "meetPulse 1.6s infinite" }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{meeting.title || "Team Meeting"} is live!</p>
            <p style={{ fontSize: "0.7rem", color: "#64748b", margin: "2px 0 0" }}>Started by {meeting.startedBy}</p>
          </div>
          <a href={meeting.roomUrl} target="_blank" rel="noopener noreferrer" id="join-meeting-btn"
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff", fontWeight: 700, fontSize: "0.79rem",
              padding: "7px 15px", borderRadius: 9, textDecoration: "none",
              boxShadow: "0 4px 12px rgba(16,185,129,0.3)", flexShrink: 0,
            }}>
            Join →
          </a>
          {isAdmin && (
            <button onClick={handleEnd} style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              color: "#f87171", fontSize: "0.74rem", fontWeight: 600, fontFamily: "inherit",
              padding: "6px 11px", borderRadius: 8, cursor: "pointer", flexShrink: 0,
            }}>End</button>
          )}
          <button onClick={() => setShowBanner(false)} style={{
            background: "rgba(255,255,255,0.06)", border: "none", color: "#64748b",
            width: 26, height: 26, borderRadius: 7, cursor: "pointer", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.82rem",
          }}>✕</button>
        </div>
      )}

      {/* ── Admin "Start Meeting" modal ── */}
      {showModal && (
        <>
          <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, zIndex: 9850, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            zIndex: 9851, width: 430, maxWidth: "90vw",
            background: "rgba(8,15,30,0.99)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 18,
            boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
            padding: "24px",
            fontFamily: "'Inter','Segoe UI',sans-serif",
            animation: "modalIn 0.25s ease",
          }}>
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.08))",
                border: "1px solid rgba(16,185,129,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: "1.02rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>Start a Meeting</p>
                <p style={{ fontSize: "0.72rem", color: "#475569", margin: 0 }}>All company members will be notified instantly</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Meeting Title</label>
                <input
                  placeholder="Team Standup, Sprint Review…"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(16,185,129,0.5)"}
                  onBlur={(e)  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Google Meet URL *</label>
                <input
                  id="meet-url-input"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleStart(); }}
                  style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(16,185,129,0.5)"}
                  onBlur={(e)  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                <p style={{ fontSize: "0.7rem", color: "#475569", marginTop: 6 }}>
                  Create a room at{" "}
                  <a href="https://meet.google.com" target="_blank" rel="noreferrer" style={{ color: "#10b981", textDecoration: "none" }}>meet.google.com</a>
                  {" "}and paste the URL here.
                </p>
              </div>

              {error && <p style={{ color: "#fca5a5", fontSize: "0.8rem", margin: 0 }}>⚠ {error}</p>}

              <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#94a3b8", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
                <button id="confirm-start-meeting-btn" onClick={handleStart} disabled={starting} style={{
                  flex: 2, padding: "10px",
                  background: starting ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg, #10b981, #059669)",
                  border: "none", borderRadius: 10, color: "#fff",
                  fontWeight: 700, fontSize: "0.85rem",
                  cursor: starting ? "not-allowed" : "pointer",
                  boxShadow: starting ? "none" : "0 4px 16px rgba(16,185,129,0.3)",
                  fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {starting
                    ? <><span style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", animation: "spin 0.8s linear infinite", display: "inline-block" }} />Starting…</>
                    : "🎥 Start & Notify All"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes meetBannerIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes meetPulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50%       { opacity: 0;   transform: scale(2.4); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translate(-50%,-54%); }
          to   { opacity: 1; transform: translate(-50%,-50%); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
