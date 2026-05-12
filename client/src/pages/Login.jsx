import { useState, useEffect } from "react";
import { login } from "../services/authService";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "employee";

  const [form, setForm] = useState({ email: "", password: "", companyCode: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState(""); // "pending" | "rejected" | "error"
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const isAdmin = role === "admin";
  const accent       = isAdmin ? "#38bdf8" : "#f97316";
  const accentMuted  = isAdmin ? "rgba(56,189,248,0.18)"  : "rgba(249,115,22,0.18)";
  const accentBorder = isAdmin ? "rgba(56,189,248,0.35)"  : "rgba(249,115,22,0.35)";
  const accentGlow   = isAdmin ? "rgba(56,189,248,0.22)"  : "rgba(249,115,22,0.22)";

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setErrorType("");
    setLoading(true);
    try {
      const payload = { email: form.email, password: form.password };
      if (form.companyCode.trim()) payload.companyCode = form.companyCode.trim();

      const data = await login(payload);

      if (isAdmin && data.user.role !== "admin") {
        setError("This account does not have admin privileges.");
        setErrorType("error");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("userId", data.user.id);
      navigate("/dashboard");

    } catch (err) {
      const msg  = err?.response?.data?.message || "Invalid credentials. Please try again.";
      const isPending  = err?.response?.data?.pending;
      const isRejected = err?.response?.data?.rejected;
      setError(msg);
      setErrorType(isPending ? "pending" : isRejected ? "rejected" : "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── error banner colour per type ── */
  const bannerStyle = {
    pending:  { bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.3)",  color: "#fbbf24" },
    rejected: { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)",   color: "#f87171" },
    error:    { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)",  color: "#f87171" },
  }[errorType] || { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", color: "#f87171" };

  return (
    <div className="lp-root" style={{ "--accent": accent, "--accentMuted": accentMuted, "--accentBorder": accentBorder, "--accentGlow": accentGlow }}>

      <div className="lp-blob lp-blob1" style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }} />
      <div className="lp-blob lp-blob2" />
      <div className="lp-blob lp-blob3" />
      <div className="lp-grid" />

      <div className={`lp-card ${mounted ? "lp-card--in" : ""}`}>
        <div className="lp-stripe" style={{ background: `linear-gradient(90deg, ${accent}22, ${accent}55, ${accent}22)` }} />

        <Link to="/" className="lp-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          Back
        </Link>

        <div className="lp-brand">
          <div className="lp-brand-icon" style={{ borderColor: accentBorder, background: accentMuted, boxShadow: `0 0 28px ${accentGlow}` }}>
            {isAdmin ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            )}
          </div>
          <div>
            <h1 className="lp-wordmark">WorkPulse</h1>
            <div className="lp-role-badge" style={{ background: accentMuted, color: accent, border: `1px solid ${accentBorder}` }}>
              {isAdmin ? "Admin Portal" : "Employee Portal"}
            </div>
          </div>
        </div>

        <p className="lp-subtitle">
          {isAdmin
            ? "Sign in with your admin credentials to manage your workspace."
            : "Welcome back! Enter your details to access your workspace."}
        </p>

        {/* Error / status banner */}
        {error && (
          <div className="lp-error" style={{ background: bannerStyle.bg, borderColor: bannerStyle.border, color: bannerStyle.color }}>
            {errorType === "pending" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="lp-form">
          {/* Email */}
          <div className="lp-field">
            <label className="lp-label">Email Address</label>
            <div className="lp-input-wrap">
              <span className="lp-input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 7L2 7" /></svg></span>
              <input id="login-email" name="email" type="email" placeholder="you@company.com" autoComplete="email" onChange={handleChange} value={form.email} required className="lp-input" />
            </div>
          </div>

          {/* Password */}
          <div className="lp-field">
            <label className="lp-label">Password</label>
            <div className="lp-input-wrap">
              <span className="lp-input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></span>
              <input id="login-password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" onChange={handleChange} value={form.password} required className="lp-input" />
              <button type="button" className="lp-show-btn" onClick={() => setShowPassword(s => !s)}>{showPassword ? "Hide" : "Show"}</button>
            </div>
          </div>

          {/* Company Code */}
          <div className="lp-field">
            <label className="lp-label">Company Code <span className="lp-optional">(required to join)</span></label>
            <div className="lp-input-wrap">
              <span className="lp-input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg></span>
              <input id="login-companyCode" name="companyCode" type="text" placeholder="e.g. ACME2024" onChange={handleChange} value={form.companyCode} className="lp-input" />
            </div>
            <p className="lp-hint">Enter the code your company admin shared with you.</p>
          </div>

          <button id="login-submit" type="submit" className="lp-submit" disabled={loading}
            style={{ background: `linear-gradient(135deg, ${accent}, ${isAdmin ? "#7dd3fc" : "#fb923c"})`, boxShadow: `0 6px 28px ${accentGlow}` }}>
            {loading ? <span className="lp-spinner" /> : (
              <>Sign In <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>
            )}
          </button>
        </form>

        <div className="lp-footer">
          <span>New to WorkPulse?</span>
          <Link to="/register" className="lp-link" style={{ color: accent }}>Create a company</Link>
          <span className="lp-sep">·</span>
          <Link to="/" className="lp-link" style={{ color: accent }}>Switch role</Link>
        </div>
      </div>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .lp-root { min-height: 100vh; width: 100%; background: #050b18; display: flex; align-items: center; justify-content: center; font-family: 'Inter','Segoe UI',sans-serif; position: relative; overflow: hidden; padding: 30px 16px; }
        .lp-blob { position: absolute; border-radius: 50%; filter: blur(88px); opacity: 0.2; pointer-events: none; animation: blobDrift 10s ease-in-out infinite alternate; }
        .lp-blob1 { width: 500px; height: 500px; top: -160px; left: -160px; animation-delay: 0s; }
        .lp-blob2 { width: 360px; height: 360px; background: radial-gradient(circle, #a78bfa, transparent 70%); bottom: -100px; right: -100px; animation-delay: 4s; }
        .lp-blob3 { width: 240px; height: 240px; background: radial-gradient(circle, #818cf8, transparent 70%); top: 40%; right: 10%; opacity: 0.1; animation-delay: 7s; }
        @keyframes blobDrift { from { transform: translate(0,0) scale(1); } to { transform: translate(24px,16px) scale(1.07); } }
        .lp-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%); }
        .lp-card { position: relative; background: rgba(10,18,36,0.8); border: 1px solid rgba(255,255,255,0.07); border-radius: 24px; width: 100%; max-width: 460px; padding: 40px 36px 36px; backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); box-shadow: 0 32px 80px rgba(0,0,0,0.6); opacity: 0; transform: translateY(28px) scale(0.98); transition: opacity 0.5s ease, transform 0.5s cubic-bezier(.16,1,.3,1); }
        .lp-card--in { opacity: 1; transform: translateY(0) scale(1); }
        .lp-stripe { position: absolute; top: 0; left: 40px; right: 40px; height: 2px; border-radius: 0 0 4px 4px; }
        .lp-back { display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; color: #64748b; text-decoration: none; margin-bottom: 28px; transition: color 0.2s; }
        .lp-back:hover { color: #94a3b8; }
        .lp-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 10px; }
        .lp-brand-icon { width: 50px; height: 50px; border-radius: 14px; border: 1px solid; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .lp-wordmark { font-size: 1.5rem; font-weight: 800; color: #f1f5f9; letter-spacing: -0.5px; line-height: 1.2; }
        .lp-role-badge { margin-top: 4px; display: inline-block; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 10px; border-radius: 999px; }
        .lp-subtitle { font-size: 0.85rem; color: #64748b; margin-bottom: 20px; line-height: 1.5; }
        .lp-error { display: flex; align-items: flex-start; gap: 8px; border: 1px solid; font-size: 0.82rem; padding: 10px 14px; border-radius: 10px; margin-bottom: 16px; line-height: 1.4; }
        .lp-form { display: flex; flex-direction: column; gap: 16px; }
        .lp-field { display: flex; flex-direction: column; gap: 6px; }
        .lp-label { font-size: 0.8rem; font-weight: 600; color: #94a3b8; letter-spacing: 0.02em; }
        .lp-optional { font-weight: 400; color: #4b5563; margin-left: 4px; }
        .lp-input-wrap { position: relative; display: flex; align-items: center; }
        .lp-input-icon { position: absolute; left: 13px; color: #4b5563; display: flex; align-items: center; pointer-events: none; }
        .lp-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 11px; padding: 12px 46px 12px 38px; color: #e2e8f0; font-size: 0.88rem; font-family: inherit; transition: border-color 0.2s, box-shadow 0.2s; outline: none; }
        .lp-input::placeholder { color: #374151; }
        .lp-input:focus { border-color: var(--accentBorder); box-shadow: 0 0 0 3px var(--accentMuted); }
        .lp-show-btn { position: absolute; right: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; font-size: 0.72rem; font-weight: 600; padding: 4px 10px; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
        .lp-show-btn:hover { background: rgba(255,255,255,0.1); }
        .lp-hint { font-size: 0.74rem; color: #374151; margin-top: 2px; }
        .lp-submit { display: flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: 12px; padding: 14px; color: #fff; font-size: 0.95rem; font-weight: 700; font-family: inherit; cursor: pointer; margin-top: 4px; transition: opacity 0.2s, transform 0.18s; letter-spacing: 0.01em; }
        .lp-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .lp-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .lp-spinner { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lp-footer { margin-top: 24px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.82rem; color: #4b5563; flex-wrap: wrap; }
        .lp-link { font-weight: 600; text-decoration: none; transition: opacity 0.2s; }
        .lp-link:hover { opacity: 0.75; }
        .lp-sep { color: #1f2937; }
        @media (max-width: 500px) { .lp-card { padding: 32px 20px 28px; } }
      `}</style>
    </div>
  );
}