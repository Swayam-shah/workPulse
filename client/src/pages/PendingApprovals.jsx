import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function PendingApprovals() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null); // id being processed
  const [toast, setToast]     = useState(null);   // { msg, type }

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPending = useCallback(async () => {
    try {
      const res = await api.get("/users/pending");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast("Failed to load pending employees.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleAction = async (id, action) => {
    setActionId(id);
    try {
      await api.put(`/users/${id}/${action}`);
      showToast(action === "approve" ? "Employee approved successfully." : "Registration rejected.", action === "approve" ? "success" : "warning");
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      showToast(err?.response?.data?.message || "Action failed.", "error");
    } finally {
      setActionId(null);
    }
  };

  return (
    <Layout>
      <div className="ap-root">

        {/* Toast */}
        {toast && (
          <div className={`ap-toast ap-toast--${toast.type}`}>
            {toast.type === "success" && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
            {toast.type === "warning" && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
            {toast.type === "error" && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="ap-header">
          <div>
            <h1 className="ap-title">Pending Approvals</h1>
            <p className="ap-subtitle">Review and approve new employee registrations for your company.</p>
          </div>
          {!loading && (
            <div className="ap-count-badge">
              {users.length} pending
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="ap-center">
            <div className="ap-spinner" />
            <p style={{ color: "#64748b", marginTop: 12, fontSize: "0.88rem" }}>Loading pending requests…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && users.length === 0 && (
          <div className="ap-empty">
            <div className="ap-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="ap-empty-title">All caught up</p>
            <p className="ap-empty-sub">No pending employee registrations at this time.</p>
          </div>
        )}

        {/* Cards grid */}
        {!loading && users.length > 0 && (
          <div className="ap-grid">
            {users.map(u => (
              <div className="ap-card" key={u._id}>
                {/* Avatar */}
                <div className="ap-avatar">
                  {u.name?.charAt(0)?.toUpperCase() || "?"}
                </div>

                <div className="ap-card-info">
                  <p className="ap-card-name">{u.name}</p>
                  <p className="ap-card-email">{u.email}</p>
                  <p className="ap-card-date">
                    Requested {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                <div className="ap-card-badge">
                  <span className="ap-status-dot" /> Pending
                </div>

                <div className="ap-actions">
                  <button
                    className="ap-btn ap-btn-approve"
                    disabled={actionId === u._id}
                    onClick={() => handleAction(u._id, "approve")}
                  >
                    {actionId === u._id ? <span className="ap-btn-spinner" /> : (
                      <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Approve</>
                    )}
                  </button>
                  <button
                    className="ap-btn ap-btn-reject"
                    disabled={actionId === u._id}
                    onClick={() => handleAction(u._id, "reject")}
                  >
                    {actionId === u._id ? <span className="ap-btn-spinner ap-btn-spinner--dark" /> : (
                      <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Reject</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <style>{`
        .ap-root { max-width: 860px; }

        /* toast */
        .ap-toast {
          position: fixed; top: 20px; right: 24px; z-index: 9999;
          display: flex; align-items: center; gap: 9px;
          padding: 12px 18px; border-radius: 12px;
          font-size: 0.85rem; font-weight: 500;
          box-shadow: 0 8px 28px rgba(0,0,0,0.4);
          animation: apSlideIn 0.3s ease;
          backdrop-filter: blur(12px);
        }
        .ap-toast--success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.35); color: #34d399; }
        .ap-toast--warning { background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.3);  color: #fbbf24; }
        .ap-toast--error   { background: rgba(239,68,68,0.12);  border: 1px solid rgba(239,68,68,0.3);   color: #f87171; }
        @keyframes apSlideIn { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: translateX(0); } }

        /* header */
        .ap-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; gap: 16px; flex-wrap: wrap; }
        .ap-title { font-size: 1.45rem; font-weight: 700; color: #f1f5f9; letter-spacing: -0.3px; }
        .ap-subtitle { font-size: 0.85rem; color: #52637a; margin-top: 4px; }
        .ap-count-badge { background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.28); color: #fbbf24; font-size: 0.78rem; font-weight: 700; padding: 5px 14px; border-radius: 999px; white-space: nowrap; align-self: center; }

        /* loading */
        .ap-center { display: flex; flex-direction: column; align-items: center; padding: 60px 0; }
        .ap-spinner { width: 32px; height: 32px; border: 3px solid rgba(255,255,255,0.06); border-top-color: #a78bfa; border-radius: 50%; animation: apSpin 0.75s linear infinite; }
        @keyframes apSpin { to { transform: rotate(360deg); } }

        /* empty */
        .ap-empty { display: flex; flex-direction: column; align-items: center; padding: 64px 0; gap: 10px; }
        .ap-empty-icon { width: 60px; height: 60px; border-radius: 50%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); display: flex; align-items: center; justify-content: center; margin-bottom: 6px; }
        .ap-empty-title { font-size: 1rem; font-weight: 600; color: #475569; }
        .ap-empty-sub { font-size: 0.82rem; color: #334155; }

        /* grid */
        .ap-grid { display: flex; flex-direction: column; gap: 12px; }

        /* card */
        .ap-card {
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 18px 22px;
          backdrop-filter: blur(12px); transition: border-color 0.2s;
        }
        .ap-card:hover { border-color: rgba(255,255,255,0.1); }

        /* avatar */
        .ap-avatar {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(167,139,250,0.25), rgba(167,139,250,0.08));
          border: 1px solid rgba(167,139,250,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; font-weight: 700; color: #c4b5fd;
        }

        /* info */
        .ap-card-info { flex: 1; min-width: 140px; }
        .ap-card-name  { font-size: 0.92rem; font-weight: 600; color: #e2e8f0; }
        .ap-card-email { font-size: 0.8rem; color: #52637a; margin-top: 2px; }
        .ap-card-date  { font-size: 0.74rem; color: #374151; margin-top: 4px; }

        /* status badge */
        .ap-card-badge {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.75rem; font-weight: 600; color: #fbbf24;
          background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.22);
          padding: 4px 12px; border-radius: 999px;
        }
        .ap-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #fbbf24; }

        /* action btns */
        .ap-actions { display: flex; gap: 8px; }
        .ap-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.8rem; font-weight: 600; font-family: inherit;
          padding: 8px 16px; border-radius: 9px; border: 1px solid; cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
        }
        .ap-btn:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
        .ap-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .ap-btn-approve { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.3); color: #34d399; }
        .ap-btn-reject  { background: rgba(239,68,68,0.1);  border-color: rgba(239,68,68,0.28); color: #f87171; }

        .ap-btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.2); border-top-color: currentColor; border-radius: 50%; animation: apSpin 0.65s linear infinite; }
        .ap-btn-spinner--dark { border: 2px solid rgba(0,0,0,0.1); border-top-color: currentColor; }

        @media (max-width: 600px) {
          .ap-card { flex-direction: column; align-items: flex-start; }
          .ap-actions { width: 100%; }
          .ap-btn { flex: 1; justify-content: center; }
        }
      `}</style>
    </Layout>
  );
}
