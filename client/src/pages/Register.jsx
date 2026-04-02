import { useState } from "react";
import { register } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function Register() {

  const navigate = useNavigate();

  const [mode, setMode] = useState("create");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyCode: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Password and confirm password must match");
      return;
    }

    try {

      const payload =
        mode === "create"
          ? {
              name: form.name,
              email: form.email,
              password: form.password,
              companyName: form.companyName
            }
          : {
              name: form.name,
              email: form.email,
              password: form.password,
              companyCode: form.companyCode
            };

      const data = await register(payload);

      localStorage.setItem("token", data.token);

      const u = data.user;
      const id = u?._id || u?.id;
      if (id) {
        localStorage.setItem("userId", String(id));
      }
      localStorage.setItem(
        "user",
        JSON.stringify({
          id,
          name: u?.name,
          email: u?.email,
          role: u?.role
        })
      );

      navigate("/dashboard");

    } catch (err) {
      console.log(err.response?.data);
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-950 overflow-hidden px-4">

      <div className="pointer-events-none absolute -top-24 -right-20 w-80 h-80 rounded-full bg-orange-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/4 left-1/4 w-32 h-32 border border-orange-400/30 rotate-12" />

      <div className="bg-slate-900/90 backdrop-blur p-8 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">

        <h1 className="text-3xl font-bold text-orange-400 mb-6 text-center">
          WorkPulse
        </h1>

        {/* Toggle buttons */}
        <div className="flex mb-6 rounded overflow-hidden border border-slate-700">

          <button
            onClick={() => setMode("create")}
            className={`flex-1 p-2 ${
              mode === "create"
                ? "bg-orange-500 text-white"
                : "bg-slate-900 text-gray-400"
            }`}
          >
            Create Company
          </button>

          <button
            onClick={() => setMode("join")}
            className={`flex-1 p-2 ${
              mode === "join"
                ? "bg-orange-500 text-white"
                : "bg-slate-900 text-gray-400"
            }`}
          >
            Join Company
          </button>

        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {mode === "create" && (
            <input
              name="companyName"
              placeholder="Company Name"
              onChange={handleChange}
              value={form.companyName}
              className="bg-slate-900 border border-slate-700 p-2 rounded text-white"
            />
          )}

          {mode === "join" && (
            <input
              name="companyCode"
              placeholder="Company Code"
              onChange={handleChange}
              value={form.companyCode}
              className="bg-slate-900 border border-slate-700 p-2 rounded text-white"
            />
          )}

          <input
            name="name"
            placeholder="Your Name"
            onChange={handleChange}
            value={form.name}
            className="bg-slate-900 border border-slate-700 p-2 rounded text-white"
          />

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

          <div className="relative">
            <input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              onChange={handleChange}
              value={form.confirmPassword}
              className="bg-slate-900 border border-slate-700 p-2 pr-16 rounded text-white w-full"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-slate-700 text-slate-200 hover:bg-slate-600"
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 p-2 rounded text-white"
          >
            {mode === "create" ? "Create Company" : "Join Company"}
          </button>

        </form>

        <p className="mt-4 text-center text-gray-400">
          Already have an account?{" "}
          <Link to="/" className="text-orange-400 font-semibold">
            Login
          </Link>
        </p>

      </div>

    </div>
  );
}