import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import api from "../api/axios";

const SOCKET_URL = "http://localhost:5000";

let socketInstance = null;

function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, { autoConnect: false });
  }
  return socketInstance;
}

/* ── ChatPanel ────────────────────────────────────────────────────────────── */
export default function ChatPanel({ open, onClose }) {
  const user      = JSON.parse(localStorage.getItem("user") || "{}");
  const userId    = user?._id || user?.id;
  const companyId = user?.companyId;

  const [contacts, setContacts]         = useState([]);
  const [activeChat, setActiveChat]     = useState(null); // contact object
  const [messages, setMessages]         = useState([]);
  const [text, setText]                 = useState("");
  const [sending, setSending]           = useState(false);
  const [totalUnread, setTotalUnread]   = useState(0);
  const bottomRef                       = useRef(null);

  /* ── Socket setup ── */
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
      socket.emit("join", { userId, companyId });
    }

    const onMessage = (msg) => {
      // Update conversation if chat is open with sender
      setMessages((prev) => {
        if (
          activeChat &&
          (msg.from?.toString() === activeChat._id?.toString() ||
            msg.to?.toString() === activeChat._id?.toString())
        ) {
          return [...prev, msg];
        }
        return prev;
      });
      // Increment unread badge
      setContacts((prev) =>
        prev.map((c) =>
          c._id?.toString() === msg.from?.toString()
            ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
            : c
        )
      );
    };

    socket.on("message:new", onMessage);
    return () => socket.off("message:new", onMessage);
  }, [userId, companyId, activeChat]);

  /* ── Fetch contacts ── */
  useEffect(() => {
    if (!open) return;
    api.get("/messages/contacts").then((res) => {
      const data = Array.isArray(res.data) ? res.data : [];
      setContacts(data);
      setTotalUnread(data.reduce((s, c) => s + (c.unreadCount || 0), 0));
    }).catch(() => {});
  }, [open]);

  /* ── Fetch conversation ── */
  useEffect(() => {
    if (!activeChat) return;
    api.get(`/messages/${activeChat._id}`).then((res) => {
      setMessages(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
    // Mark as read
    api.patch(`/messages/read/${activeChat._id}`).catch(() => {});
    setContacts((prev) =>
      prev.map((c) =>
        c._id === activeChat._id ? { ...c, unreadCount: 0 } : c
      )
    );
  }, [activeChat]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Recalculate total unread ── */
  useEffect(() => {
    setTotalUnread(contacts.reduce((s, c) => s + (c.unreadCount || 0), 0));
  }, [contacts]);

  const handleSend = async () => {
    if (!text.trim() || !activeChat) return;
    setSending(true);
    try {
      const res = await api.post("/messages", {
        toUserId: activeChat._id,
        text: text.trim(),
      });
      setMessages((prev) => [...prev, res.data]);
      setText("");
    } catch (err) {
      console.error("Send failed", err);
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 9900, background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(2px)",
      }} />

      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 680, maxWidth: "100vw", zIndex: 9901,
        background: "rgba(5,11,24,0.98)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "-24px 0 64px rgba(0,0,0,0.7)",
        display: "flex", flexDirection: "column",
        animation: "slideInRight 0.25s ease both",
        fontFamily: "'Inter','Segoe UI',sans-serif",
      }}>

        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(15,23,42,0.6)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))",
              border: "1px solid rgba(99,102,241,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>Team Messages</p>
              <p style={{ fontSize: "0.7rem", color: "#475569", margin: 0 }}>
                {contacts.length} colleague{contacts.length !== 1 ? "s" : ""}
                {totalUnread > 0 && ` · ${totalUnread} unread`}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.06)", border: "none",
            color: "#64748b", width: 32, height: 32, borderRadius: 8,
            cursor: "pointer", fontSize: "1.1rem",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Body: contacts + chat */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Contacts list */}
          <div style={{
            width: 220, flexShrink: 0,
            borderRight: "1px solid rgba(255,255,255,0.06)",
            overflowY: "auto",
            padding: "8px 0",
          }}>
            <p style={{ padding: "8px 14px", fontSize: "0.65rem", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Colleagues
            </p>
            {contacts.length === 0 && (
              <p style={{ padding: "12px 14px", fontSize: "0.8rem", color: "#334155" }}>No colleagues found.</p>
            )}
            {contacts.map((c) => {
              const isActive = activeChat?._id === c._id;
              return (
                <button
                  key={c._id}
                  onClick={() => setActiveChat(c)}
                  style={{
                    width: "100%", background: isActive
                      ? "rgba(99,102,241,0.15)"
                      : "transparent",
                    border: "none",
                    borderLeft: isActive ? "2px solid #818cf8" : "2px solid transparent",
                    padding: "10px 14px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                    textAlign: "left", transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(99,102,241,0.1))",
                    border: "1px solid rgba(99,102,241,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 700, color: "#818cf8",
                  }}>
                    {c.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.82rem", fontWeight: 600, color: isActive ? "#e2e8f0" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                      {c.name}
                    </p>
                    <p style={{ fontSize: "0.68rem", color: "#475569", margin: 0, textTransform: "capitalize" }}>{c.role}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span style={{
                      background: "#818cf8", color: "#fff",
                      fontSize: "0.6rem", fontWeight: 800,
                      padding: "1px 6px", borderRadius: 999, flexShrink: 0,
                    }}>
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Chat window */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {!activeChat ? (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 12,
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p style={{ color: "#334155", fontSize: "0.88rem" }}>Select a colleague to start chatting</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", gap: 10,
                  background: "rgba(15,23,42,0.4)", flexShrink: 0,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(99,102,241,0.1))",
                    border: "1px solid rgba(99,102,241,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.85rem", fontWeight: 700, color: "#818cf8",
                  }}>
                    {activeChat.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{activeChat.name}</p>
                    <p style={{ fontSize: "0.68rem", color: "#475569", margin: 0, textTransform: "capitalize" }}>{activeChat.role} · {activeChat.email}</p>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: "center", marginTop: 40 }}>
                      <p style={{ color: "#334155", fontSize: "0.82rem" }}>No messages yet. Say hello! 👋</p>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isMine = msg.from?.toString() === userId?.toString();
                    return (
                      <div key={msg._id || i} style={{
                        display: "flex",
                        justifyContent: isMine ? "flex-end" : "flex-start",
                        animation: "msgFadeIn 0.2s ease",
                      }}>
                        <div style={{
                          maxWidth: "70%",
                          background: isMine
                            ? "linear-gradient(135deg, rgba(99,102,241,0.35), rgba(99,102,241,0.2))"
                            : "rgba(255,255,255,0.06)",
                          border: isMine
                            ? "1px solid rgba(99,102,241,0.4)"
                            : "1px solid rgba(255,255,255,0.07)",
                          borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                          padding: "10px 14px",
                        }}>
                          <p style={{ fontSize: "0.85rem", color: "#e2e8f0", margin: 0, lineHeight: 1.5 }}>
                            {msg.text}
                          </p>
                          <p style={{ fontSize: "0.65rem", color: "#475569", margin: "4px 0 0", textAlign: "right" }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div style={{
                  padding: "12px 16px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  display: "flex", gap: 10, alignItems: "flex-end",
                  background: "rgba(8,15,30,0.8)", flexShrink: 0,
                }}>
                  <textarea
                    id="chat-input"
                    placeholder={`Message ${activeChat.name}…`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                    style={{
                      flex: 1, padding: "10px 14px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10, color: "#e2e8f0",
                      fontSize: "0.85rem", outline: "none",
                      resize: "none", fontFamily: "inherit",
                      lineHeight: 1.5,
                    }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                    onBlur={(e)  => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                  <button
                    id="chat-send-btn"
                    onClick={handleSend}
                    disabled={sending || !text.trim()}
                    style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: text.trim()
                        ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                        : "rgba(99,102,241,0.15)",
                      border: "none", cursor: text.trim() ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "opacity 0.15s, transform 0.15s",
                      boxShadow: text.trim() ? "0 4px 12px rgba(99,102,241,0.4)" : "none",
                    }}
                    onMouseEnter={(e) => { if (text.trim()) e.currentTarget.style.transform = "scale(1.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? "#fff" : "#475569"} strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes msgFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        #chat-input::placeholder { color: #334155; }
      `}</style>
    </>
  );
}
