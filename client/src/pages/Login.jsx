import { useState } from "react";
import { login } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function Login() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      const data = await login(form);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("userId", data.user.id);

      navigate("/dashboard");

    } catch {
      alert("Login failed");
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-950 overflow-hidden px-4">

      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-32 h-32 border border-orange-400/30 rotate-12" />

      <div className="bg-slate-900/90 backdrop-blur p-8 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">

        <div className="text-center mb-6">

          <h1 className="text-4xl font-bold text-orange-400">
            WorkPulse
          </h1>

          <p className="text-gray-400">
            Login to your workspace
          </p>

        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
            value={form.email}
            className="bg-slate-900 border border-slate-700 p-2 rounded text-white"
          />

          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              onChange={handleChange}
              value={form.password}
              className="bg-slate-900 border border-slate-700 p-2 pr-16 rounded text-white w-full"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-slate-700 text-slate-200 hover:bg-slate-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 p-2 rounded text-white"
          >
            Login
          </button>

        </form>

        <p className="mt-4 text-center text-gray-400">
          No account?{" "}
          <Link to="/register" className="text-orange-400 font-semibold">
            Create company
          </Link>
        </p>

      </div>

    </div>
  );
}