import { useState, useEffect } from "react";
import { register } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("create");
  const [mounted, setMounted] = useState(false);
  const [pendingResult, setPendingResult] = useState(null); // { companyName }

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    companyName: "", companyCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const payload = mode === "create"
        ? { name: form.name, email: form.email, password: form.password, companyName: form.companyName }
        : { name: form.name, email: form.email, password: form.password, companyCode: form.companyCode };

      const data = await register(payload);

      // New employee → pending approval
      if (data.pending) {
        setPendingResult({ companyName: data.companyName });
        return;
      }

      // Admin / creator → goes straight to dashboard
      const u = data.user;
      const id = u?._id || u?.id;
      if (id) localStorage.setItem("userId", String(id));
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({ id, name: u?.name, email: u?.email, role: u?.role }));
      navigate("/dashboard");

    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Pending approval confirmation screen ─────────────────────────────────
  if (pendingResult) {
    return (
      <div className="rp-root">
        <div className="rp-blob rp-blob1" /><div className="rp-blob rp-blob2" /><div className="rp-blob rp-blob3" />
        <div className="rp-grid" />
        <div className="rp-card rp-card--in" style={{ textAlign: "center", maxWidth: 440 }}>
          <div className="rp-stripe" />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: "8px 0 4px" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(251,191,36,0.12)", border: "1.5px solid rgba(251,191,36,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 32px rgba(251,191,36,0.15)"
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>
                Awaiting Approval
              </h2>
              <p style={{ fontSize: "0.88rem", color: "#64748b", lineHeight: 1.6 }}>
                Your registration for <strong style={{ color: "#e2e8f0" }}>{pendingResult.companyName}</strong> has been submitted successfully.
                <br /><br />
                Your admin will review and approve your account. Once approved, you can sign in using your email and password.
              </p>
            </div>
            <Link to="/login?role=employee" style={{
              marginTop: 8, display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)",
              color: "#fbbf24", fontSize: "0.85rem", fontWeight: 600,
              padding: "11px 24px", borderRadius: 10, textDecoration: "none",
              transition: "background 0.2s"
            }}>
              Back to Login
            </Link>
          </div>
        </div>
        <PendingStyles />
      </div>
    );
  }

  return (
    <div className="rp-root">
      <div className="rp-blob rp-blob1" /><div className="rp-blob rp-blob2" /><div className="rp-blob rp-blob3" />
      <div className="rp-grid" />

      <div className={`rp-card ${mounted ? "rp-card--in" : ""}`}>
        <div className="rp-stripe" />

        <Link to="/" className="rp-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          Back
        </Link>

        <div className="rp-brand">
          <div className="rp-brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
            </svg>
          </div>
          <div>
            <h1 className="rp-wordmark">WorkPulse</h1>
            <div className="rp-badge">Company Setup</div>
          </div>
        </div>

        <p className="rp-subtitle">
          {mode === "create"
            ? "Create your company workspace and become the admin."
            : "Join an existing company using the code your admin shared."}
        </p>

        {/* mode toggle */}
        <div className="rp-toggle">
          <button type="button" className={`rp-toggle-btn ${mode === "create" ? "rp-toggle-active" : ""}`} onClick={() => setMode("create")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
            </svg>
            Create Company
          </button>
          <button type="button" className={`rp-toggle-btn ${mode === "join" ? "rp-toggle-active" : ""}`} onClick={() => setMode("join")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Join Company
          </button>
        </div>

        {/* Join-mode info banner */}
        {mode === "join" && (
          <div className="rp-info-banner">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Your account will require admin approval before you can sign in.
          </div>
        )}

        {error && (
          <div className="rp-error">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rp-form">
          {/* Company Name / Code */}
          {mode === "create" ? (
            <div className="rp-field">
              <label className="rp-label">Company Name</label>
              <div className="rp-input-wrap">
                <span className="rp-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg></span>
                <input name="companyName" placeholder="Acme Corp" onChange={handleChange} value={form.companyName} required className="rp-input" />
              </div>
            </div>
          ) : (
            <div className="rp-field">
              <label className="rp-label">Company Code</label>
              <div className="rp-input-wrap">
                <span className="rp-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg></span>
                <input name="companyCode" placeholder="e.g. ACME2024" onChange={handleChange} value={form.companyCode} required className="rp-input" />
              </div>
              <p className="rp-hint">Ask your admin for the company code.</p>
            </div>
          )}

          {/* Name */}
          <div className="rp-field">
            <label className="rp-label">Your Name</label>
            <div className="rp-input-wrap">
              <span className="rp-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg></span>
              <input name="name" placeholder="Jane Doe" onChange={handleChange} value={form.name} required className="rp-input" />
            </div>
          </div>

          {/* Email */}
          <div className="rp-field">
            <label className="rp-label">Email Address</label>
            <div className="rp-input-wrap">
              <span className="rp-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" /></svg></span>
              <input name="email" type="email" placeholder="you@company.com" onChange={handleChange} value={form.email} required className="rp-input" />
            </div>
          </div>

          {/* Password */}
          <div className="rp-field">
            <label className="rp-label">Password</label>
            <div className="rp-input-wrap">
              <span className="rp-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
              <input name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" onChange={handleChange} value={form.password} required className="rp-input" />
              <button type="button" className="rp-show-btn" onClick={() => setShowPassword(s => !s)}>{showPassword ? "Hide" : "Show"}</button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="rp-field">
            <label className="rp-label">Confirm Password</label>
            <div className="rp-input-wrap">
              <span className="rp-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></span>
              <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" onChange={handleChange} value={form.confirmPassword} required className="rp-input" />
              <button type="button" className="rp-show-btn" onClick={() => setShowConfirmPassword(s => !s)}>{showConfirmPassword ? "Hide" : "Show"}</button>
            </div>
          </div>

          <button type="submit" className="rp-submit" disabled={loading}>
            {loading ? <span className="rp-spinner" /> : (
              <>{mode === "create" ? "Create Company & Sign Up" : "Request to Join"} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>
            )}
          </button>
        </form>

        <div className="rp-footer">
          <span>Already have an account?</span>
          <Link to="/" className="rp-link">Sign in</Link>
        </div>
      </div>

      <PendingStyles />
    </div>
  );
}

function PendingStyles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      .rp-root {
        min-height: 100vh; width: 100%;
        background: #050b18;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Inter', 'Segoe UI', sans-serif;
        position: relative; overflow: hidden; padding: 30px 16px;
      }
      .rp-blob {
        position: absolute; border-radius: 50%; filter: blur(90px);
        opacity: 0.18; pointer-events: none;
        animation: rpBlobDrift 10s ease-in-out infinite alternate;
      }
      .rp-blob1 { width: 480px; height: 480px; background: radial-gradient(circle, #a78bfa, transparent 70%); top: -140px; right: -120px; }
      .rp-blob2 { width: 360px; height: 360px; background: radial-gradient(circle, #f97316, transparent 70%); bottom: -100px; left: -100px; animation-delay: 4s; }
      .rp-blob3 { width: 260px; height: 260px; background: radial-gradient(circle, #38bdf8, transparent 70%); top: 40%; left: 5%; opacity: 0.1; animation-delay: 7s; }
      @keyframes rpBlobDrift { from { transform: translate(0,0) scale(1); } to { transform: translate(20px,14px) scale(1.06); } }
      .rp-grid {
        position: absolute; inset: 0;
        background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
        background-size: 48px 48px; pointer-events: none;
        mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
      }
      .rp-card {
        position: relative; background: rgba(10,18,36,0.82); border: 1px solid rgba(255,255,255,0.07);
        border-radius: 24px; width: 100%; max-width: 480px; padding: 40px 36px 36px;
        backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
        box-shadow: 0 32px 80px rgba(0,0,0,0.6);
        opacity: 0; transform: translateY(28px) scale(0.98);
        transition: opacity 0.5s ease, transform 0.5s cubic-bezier(.16,1,.3,1);
      }
      .rp-card--in { opacity: 1; transform: translateY(0) scale(1); }
      .rp-stripe {
        position: absolute; top: 0; left: 40px; right: 40px; height: 2px; border-radius: 0 0 4px 4px;
        background: linear-gradient(90deg, rgba(167,139,250,0.15), rgba(167,139,250,0.6), rgba(167,139,250,0.15));
      }
      .rp-back { display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; color: #64748b; text-decoration: none; margin-bottom: 26px; transition: color 0.2s; }
      .rp-back:hover { color: #94a3b8; }
      .rp-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 10px; }
      .rp-brand-icon { width: 50px; height: 50px; border-radius: 14px; background: rgba(167,139,250,0.14); border: 1px solid rgba(167,139,250,0.3); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 28px rgba(167,139,250,0.2); }
      .rp-wordmark { font-size: 1.5rem; font-weight: 800; color: #f1f5f9; letter-spacing: -0.5px; line-height: 1.2; }
      .rp-badge { margin-top: 4px; display: inline-block; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 10px; border-radius: 999px; background: rgba(167,139,250,0.15); color: #c4b5fd; border: 1px solid rgba(167,139,250,0.3); }
      .rp-subtitle { font-size: 0.85rem; color: #64748b; margin-bottom: 20px; line-height: 1.5; }
      .rp-toggle { display: flex; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03); margin-bottom: 16px; }
      .rp-toggle-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 10px 8px; font-size: 0.82rem; font-weight: 600; font-family: inherit; color: #4b5563; background: transparent; border: none; cursor: pointer; transition: background 0.2s, color 0.2s; }
      .rp-toggle-active { background: rgba(167,139,250,0.18); color: #c4b5fd; }
      .rp-info-banner { display: flex; align-items: flex-start; gap: 8px; background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2); color: #fbbf24; font-size: 0.8rem; padding: 10px 13px; border-radius: 9px; margin-bottom: 14px; line-height: 1.4; }
      .rp-error { display: flex; align-items: center; gap: 8px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #f87171; font-size: 0.82rem; padding: 10px 14px; border-radius: 10px; margin-bottom: 14px; }
      .rp-form { display: flex; flex-direction: column; gap: 13px; }
      .rp-field { display: flex; flex-direction: column; gap: 5px; }
      .rp-label { font-size: 0.78rem; font-weight: 600; color: #94a3b8; letter-spacing: 0.02em; }
      .rp-input-wrap { position: relative; display: flex; align-items: center; }
      .rp-icon { position: absolute; left: 12px; color: #4b5563; display: flex; align-items: center; pointer-events: none; }
      .rp-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; padding: 11px 44px 11px 36px; color: #e2e8f0; font-size: 0.86rem; font-family: inherit; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
      .rp-input::placeholder { color: #374151; }
      .rp-input:focus { border-color: rgba(167,139,250,0.4); box-shadow: 0 0 0 3px rgba(167,139,250,0.12); }
      .rp-show-btn { position: absolute; right: 9px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; font-size: 0.7rem; font-weight: 600; padding: 3px 9px; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
      .rp-show-btn:hover { background: rgba(255,255,255,0.1); }
      .rp-hint { font-size: 0.73rem; color: #374151; margin-top: 2px; }
      .rp-submit { display: flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: 12px; padding: 14px; background: linear-gradient(135deg, #a78bfa, #c4b5fd); color: #1e0b4b; font-size: 0.92rem; font-weight: 700; font-family: inherit; cursor: pointer; margin-top: 6px; box-shadow: 0 6px 28px rgba(167,139,250,0.3); transition: opacity 0.2s, transform 0.18s; }
      .rp-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
      .rp-submit:disabled { opacity: 0.55; cursor: not-allowed; }
      .rp-spinner { width: 18px; height: 18px; border: 2.5px solid rgba(30,11,75,0.3); border-top-color: #1e0b4b; border-radius: 50%; animation: rpSpin 0.7s linear infinite; }
      @keyframes rpSpin { to { transform: rotate(360deg); } }
      .rp-footer { margin-top: 22px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.82rem; color: #4b5563; }
      .rp-link { color: #c4b5fd; font-weight: 600; text-decoration: none; }
      .rp-link:hover { opacity: 0.75; }
      @media (max-width: 500px) { .rp-card { padding: 30px 18px 26px; } }
    `}</style>
  );
}