import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

export default function Landing() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  /* ── animated particle background ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const dots = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      color: Math.random() > 0.5 ? "255,120,40" : "56,189,248",
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${d.color},0.65)`;
        ctx.fill();
      });

      // draw connecting lines
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255,140,60,${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="landing-root">
      <canvas ref={canvasRef} className="landing-canvas" />

      {/* ── glow blobs ── */}
      <div className="blob blob-orange" />
      <div className="blob blob-blue" />
      <div className="blob blob-purple" />

      <main className="landing-main">
        {/* ── Brand ── */}
        <div className="brand">
          <div className="brand-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="url(#lg)" />
              <path d="M10 22l6-8 4 5 3-4 3 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="36" y2="36">
                  <stop stopColor="#f97316" />
                  <stop offset="1" stopColor="#fb923c" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="brand-name">WorkPulse</h1>
          <p className="brand-tagline">Your unified workspace — smarter, faster, together.</p>
        </div>

        {/* ── Role Cards ── */}
        <div className="cards-row">

          {/* Employee */}
          <button className="role-card employee-card" onClick={() => navigate("/login?role=employee")}>
            <div className="card-glow card-glow-orange" />
            <div className="card-icon-wrap employee-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <h2 className="card-title">Employee</h2>
            <p className="card-desc">Sign in to your workspace, manage tasks, collaborate with your team.</p>
            <span className="card-cta">Login as Employee →</span>
          </button>

          {/* Admin */}
          <button className="role-card admin-card" onClick={() => navigate("/login?role=admin")}>
            <div className="card-glow card-glow-blue" />
            <div className="card-icon-wrap admin-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h2 className="card-title">Admin</h2>
            <p className="card-desc">Access management tools, review performance, and oversee your company.</p>
            <span className="card-cta">Login as Admin →</span>
          </button>

        </div>

        {/* ── Create Company ── */}
        <div className="create-company-section">
          <div className="divider-line" />
          <span className="divider-label">or</span>
          <div className="divider-line" />
        </div>

        <button className="create-company-btn" onClick={() => navigate("/register")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            <line x1="12" y1="12" x2="12" y2="16" />
            <line x1="10" y1="14" x2="14" y2="14" />
          </svg>
          Create a New Company
        </button>

        <p className="footer-note">
          Already registered your company?{" "}
          <span>Choose a role above to sign in.</span>
        </p>
      </main>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .landing-root {
          position: relative;
          min-height: 100vh;
          width: 100%;
          background: #050b18;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          overflow: hidden;
        }

        .landing-canvas {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        /* ── glow blobs ── */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.18;
          pointer-events: none;
          z-index: 0;
          animation: blobFloat 8s ease-in-out infinite alternate;
        }
        .blob-orange {
          width: 520px; height: 520px;
          background: radial-gradient(circle, #f97316, transparent 70%);
          top: -140px; left: -140px;
          animation-delay: 0s;
        }
        .blob-blue {
          width: 440px; height: 440px;
          background: radial-gradient(circle, #38bdf8, transparent 70%);
          bottom: -120px; right: -100px;
          animation-delay: 3s;
        }
        .blob-purple {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #a78bfa, transparent 70%);
          bottom: 10%; left: 30%;
          animation-delay: 5s;
        }

        @keyframes blobFloat {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, 20px) scale(1.08); }
        }

        /* ── main layout ── */
        .landing-main {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          padding: 40px 20px;
          width: 100%;
          max-width: 840px;
        }

        /* ── brand ── */
        .brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-bottom: 52px;
          animation: fadeDown 0.6s ease both;
        }
        .brand-icon {
          background: rgba(249,115,22,0.12);
          border: 1px solid rgba(249,115,22,0.3);
          border-radius: 18px;
          padding: 12px;
          box-shadow: 0 0 32px rgba(249,115,22,0.25);
          margin-bottom: 4px;
        }
        .brand-name {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -1px;
          background: linear-gradient(135deg, #f97316 0%, #fb923c 40%, #fdba74 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .brand-tagline {
          font-size: 1rem;
          color: #94a3b8;
          letter-spacing: 0.01em;
        }

        /* ── role cards ── */
        .cards-row {
          display: flex;
          gap: 24px;
          width: 100%;
          justify-content: center;
          flex-wrap: wrap;
          animation: fadeUp 0.6s 0.1s ease both;
        }

        .role-card {
          position: relative;
          flex: 1 1 300px;
          max-width: 340px;
          min-width: 260px;
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 22px;
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.28s cubic-bezier(.34,1.56,.64,1), border-color 0.25s, box-shadow 0.25s;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          outline: none;
          text-align: center;
        }
        .role-card:hover {
          transform: translateY(-8px) scale(1.025);
        }

        /* per-card glow on hover */
        .employee-card:hover {
          border-color: rgba(249,115,22,0.45);
          box-shadow: 0 20px 60px rgba(249,115,22,0.2), 0 0 0 1px rgba(249,115,22,0.1);
        }
        .admin-card:hover {
          border-color: rgba(56,189,248,0.45);
          box-shadow: 0 20px 60px rgba(56,189,248,0.2), 0 0 0 1px rgba(56,189,248,0.1);
        }

        /* inner glow */
        .card-glow {
          position: absolute;
          top: -60px; left: 50%;
          transform: translateX(-50%);
          width: 180px; height: 180px;
          border-radius: 50%;
          filter: blur(50px);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        .role-card:hover .card-glow { opacity: 0.25; }
        .card-glow-orange { background: #f97316; }
        .card-glow-blue   { background: #38bdf8; }

        /* icon wraps */
        .card-icon-wrap {
          width: 68px; height: 68px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.28s cubic-bezier(.34,1.56,.64,1);
        }
        .role-card:hover .card-icon-wrap { transform: scale(1.12) rotate(-3deg); }

        .employee-icon-wrap {
          background: linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.05));
          border: 1px solid rgba(249,115,22,0.3);
          color: #fb923c;
          box-shadow: 0 0 24px rgba(249,115,22,0.15);
        }
        .admin-icon-wrap {
          background: linear-gradient(135deg, rgba(56,189,248,0.2), rgba(56,189,248,0.05));
          border: 1px solid rgba(56,189,248,0.3);
          color: #38bdf8;
          box-shadow: 0 0 24px rgba(56,189,248,0.15);
        }

        .card-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.3px;
        }
        .card-desc {
          font-size: 0.88rem;
          color: #7c8ea6;
          line-height: 1.55;
        }
        .card-cta {
          margin-top: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          padding: 7px 20px;
          border-radius: 999px;
          transition: background 0.2s, color 0.2s;
        }
        .employee-card .card-cta {
          background: rgba(249,115,22,0.14);
          color: #fb923c;
          border: 1px solid rgba(249,115,22,0.25);
        }
        .employee-card:hover .card-cta {
          background: rgba(249,115,22,0.25);
        }
        .admin-card .card-cta {
          background: rgba(56,189,248,0.12);
          color: #38bdf8;
          border: 1px solid rgba(56,189,248,0.25);
        }
        .admin-card:hover .card-cta {
          background: rgba(56,189,248,0.22);
        }

        /* ── create-company divider ── */
        .create-company-section {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          max-width: 500px;
          margin: 40px 0 20px;
          animation: fadeUp 0.6s 0.2s ease both;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
        }
        .divider-label {
          color: #4b5563;
          font-size: 0.8rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* Create company button */
        .create-company-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(167,139,250,0.1);
          border: 1px solid rgba(167,139,250,0.28);
          color: #c4b5fd;
          font-size: 0.92rem;
          font-weight: 600;
          padding: 13px 30px;
          border-radius: 14px;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          animation: fadeUp 0.6s 0.25s ease both;
          backdrop-filter: blur(8px);
        }
        .create-company-btn:hover {
          background: rgba(167,139,250,0.2);
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(167,139,250,0.18);
        }

        .footer-note {
          margin-top: 22px;
          font-size: 0.82rem;
          color: #4b5563;
          text-align: center;
          animation: fadeUp 0.6s 0.3s ease both;
        }
        .footer-note span {
          color: #64748b;
        }

        /* ── keyframes ── */
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .brand-name { font-size: 2.2rem; }
          .cards-row { flex-direction: column; align-items: center; }
          .role-card { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
