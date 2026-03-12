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

    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900">

      <div className="bg-slate-800 p-10 rounded-xl border border-slate-700 w-96">

        <div className="text-center mb-6">

          <h1 className="text-4xl font-bold text-green-500">
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