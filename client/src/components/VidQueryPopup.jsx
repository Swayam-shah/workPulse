import { useState, useRef, useEffect } from "react";
import api from "../api/axios";

/* ── Bullet-point renderer ───────────────────────────────────────────────── */
function BulletAnswer({ text }) {
  const lines = text.split("\n").filter((l) => l.trim());
  return (
    <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
      {lines.map((line, i) => {
        const clean = line.replace(/^\*\s*/, "").trim();
        if (!clean) return null;
        return (
          <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", background: "#f97316",
              flexShrink: 0, marginTop: 6,
              boxShadow: "0 0 6px rgba(249,115,22,0.6)"
            }} />
            <span style={{ fontSize: "0.84rem", color: "#cbd5e1", lineHeight: 1.6 }}>{clean}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function VidQueryPopup() {
  const [open, setOpen]         = useState(false);
  const [url, setUrl]           = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const popupRef                = useRef(null);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (open && popupRef.current && !popupRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleAsk = async () => {
    if (!url.trim() || !question.trim()) {
      setError("Please provide both a YouTube URL and a question.");
      return;
    }
    setError("");
    setAnswer("");
    setLoading(true);
    try {
      const res = await api.post("/vidquery/ask", {
        youtubeUrl: url.trim(),
        question: question.trim(),
      });
      setAnswer(res.data.answer || "No answer returned.");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); }
  };

  return (
    <>
      {/* ── Floating trigger button ── */}
      <button
        id="vidquery-open-btn"
        onClick={() => { setOpen(!open); setAnswer(""); setError(""); }}
        title="VidQuery — Ask AI about a YouTube video"
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9990,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #ff0000 0%, #cc0000 100%)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 24px rgba(255,0,0,0.4), 0 0 0 0 rgba(255,0,0,0.3)",
          transition: "transform 0.2s, box-shadow 0.2s",
          animation: "vidquery-pulse 2.5s infinite",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.12)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {/* YouTube play icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5a3 3 0 0 0-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z" />
        </svg>
      </button>

      {/* ── Popup ── */}
      {open && (
        <div
          ref={popupRef}
          id="vidquery-popup"
          style={{
            position: "fixed", bottom: 96, right: 28, zIndex: 9991,
            width: 400, maxWidth: "calc(100vw - 56px)",
            background: "rgba(8,15,30,0.97)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 18,
            boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(249,115,22,0.1)",
            backdropFilter: "blur(20px)",
            overflow: "hidden",
            animation: "vq-slideup 0.25s ease both",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, rgba(255,0,0,0.12), rgba(204,0,0,0.06))",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "linear-gradient(135deg, #ff0000, #cc0000)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(255,0,0,0.3)",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5a3 3 0 0 0-2.1 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>VidQuery</p>
                <p style={{ fontSize: "0.68rem", color: "#64748b", margin: 0 }}>Ask AI about any YouTube video</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: "rgba(255,255,255,0.06)", border: "none",
              color: "#64748b", width: 28, height: 28, borderRadius: 8,
              cursor: "pointer", fontSize: "1rem", display: "flex",
              alignItems: "center", justifyContent: "center",
              transition: "background 0.15s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
            >✕</button>
          </div>

          {/* Body */}
          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* URL input */}
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                YouTube URL
              </label>
              <input
                id="vidquery-url-input"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{
                  width: "100%", padding: "10px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, color: "#e2e8f0",
                  fontSize: "0.84rem", outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(249,115,22,0.5)"}
                onBlur={(e)  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            {/* Question input */}
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                Your Question
              </label>
              <textarea
                id="vidquery-question-input"
                placeholder="What does the video say about...?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                style={{
                  width: "100%", padding: "10px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, color: "#e2e8f0",
                  fontSize: "0.84rem", outline: "none",
                  resize: "none", boxSizing: "border-box",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(249,115,22,0.5)"}
                onBlur={(e)  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            {/* Ask button */}
            <button
              id="vidquery-ask-btn"
              onClick={handleAsk}
              disabled={loading}
              style={{
                width: "100%", padding: "11px",
                background: loading
                  ? "rgba(249,115,22,0.3)"
                  : "linear-gradient(135deg, #f97316, #ea580c)",
                border: "none", borderRadius: 10,
                color: "#fff", fontWeight: 700, fontSize: "0.87rem",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.15s, transform 0.15s",
                boxShadow: loading ? "none" : "0 4px 16px rgba(249,115,22,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(1.02)"; }}}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTop: "2px solid #fff",
                    animation: "spin 0.8s linear infinite",
                    display: "inline-block",
                  }} />
                  Analyzing video…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  Ask VidQuery
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 10, padding: "10px 14px",
                color: "#fca5a5", fontSize: "0.8rem",
              }}>
                ⚠ {error}
              </div>
            )}

            {/* Answer */}
            {answer && (
              <div style={{
                background: "rgba(15,23,42,0.8)",
                border: "1px solid rgba(249,115,22,0.2)",
                borderRadius: 12, padding: "14px 16px",
                maxHeight: 280, overflowY: "auto",
                animation: "vq-slideup 0.2s ease",
              }}>
                <p style={{
                  fontSize: "0.68rem", fontWeight: 700, color: "#f97316",
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  marginBottom: 10,
                }}>
                  ✦ Answer
                </p>
                <BulletAnswer text={answer} />
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes vidquery-pulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(255,0,0,0.4), 0 0 0 0 rgba(255,0,0,0.3); }
          50%       { box-shadow: 0 4px 24px rgba(255,0,0,0.5), 0 0 0 10px rgba(255,0,0,0); }
        }
        @keyframes vq-slideup {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        #vidquery-url-input::placeholder,
        #vidquery-question-input::placeholder { color: #334155; }
      `}</style>
    </>
  );
}
