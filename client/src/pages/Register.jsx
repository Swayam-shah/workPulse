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
    companyName: "",
    companyCode: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      navigate("/dashboard");

    } catch (err) {
      console.log(err.response?.data);
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900">

      <div className="bg-slate-800 p-10 rounded-xl border border-slate-700 w-96">

        <h1 className="text-3xl font-bold text-green-500 mb-6 text-center">
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
              className="bg-slate-900 border border-slate-700 p-2 rounded text-white"
            />
          )}

          {mode === "join" && (
            <input
              name="companyCode"
              placeholder="Company Code"
              onChange={handleChange}
              className="bg-slate-900 border border-slate-700 p-2 rounded text-white"
            />
          )}

          <input
            name="name"
            placeholder="Your Name"
            onChange={handleChange}
            className="bg-slate-900 border border-slate-700 p-2 rounded text-white"
          />

          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="bg-slate-900 border border-slate-700 p-2 rounded text-white"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="bg-slate-900 border border-slate-700 p-2 rounded text-white"
          />

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