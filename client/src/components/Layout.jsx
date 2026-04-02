import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getTeams } from "../services/teamService";

export default function Layout({ children }) {

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const [teams, setTeams] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  useEffect(() => {
    let cancelled = false;

    const fetchTeams = async () => {
      try {
        const data = await getTeams();
        if (!cancelled) {
          setTeams(Array.isArray(data) ? data : []);
        }
      } catch {
        // Most pages are protected, so failures here are unexpected. Keep it silent for UX.
      }
    };

    fetchTeams();
    const intervalId = setInterval(fetchTeams, 60_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">

      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col p-6 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-16 -left-16 w-40 h-40 rounded-full bg-orange-500/10 blur-2xl" />

        <h1 className="text-xl font-bold mb-10 text-orange-300 tracking-wide">
          WorkPulse
        </h1>

        <div className="space-y-1">
          <Link to="/dashboard" className="block px-3 py-2 rounded-md hover:bg-slate-800 hover:text-orange-300 transition">Dashboard</Link>
          <Link to="/tasks" className="block px-3 py-2 rounded-md hover:bg-slate-800 hover:text-orange-300 transition">Tasks</Link>
          <Link to="/teams" className="block px-3 py-2 rounded-md hover:bg-slate-800 hover:text-orange-300 transition">Teams</Link>

          {user?.role === "admin" && (
            <Link to="/users" className="block px-3 py-2 rounded-md hover:bg-slate-800 hover:text-orange-300 transition">Users</Link>
          )}
        </div>

        <div className="mt-auto pt-6 border-t border-slate-800 bg-slate-950/60 rounded-lg p-3">
          <p className="text-sm font-semibold text-white break-words">
            {user?.name}
          </p>
          <p className="text-xs text-gray-500 break-all">
            {user?.email}
          </p>
          <p className="text-xs text-green-400">
            {user?.role}
          </p>
          <p className="text-xs text-slate-400 mt-3">
            Teams
          </p>
          <div className="text-xs text-slate-200 mt-1 space-y-1">
            {teams.length === 0 ? (
              <span className="text-slate-500">—</span>
            ) : (
              teams.map((t) => (
                <div key={t._id} className="truncate">
                  {t.name}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-950 to-slate-900">

        {/* Top Header */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-6 py-3 flex justify-between items-center">

          <h2 className="font-semibold text-lg text-slate-100">
            WorkPulse Dashboard
          </h2>

          <div className="flex items-center gap-4">

            <div className="text-right">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-xs text-green-400">{user?.role}</p>
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-600/90 text-white px-4 py-1.5 rounded-md hover:bg-red-500 transition"
            >
              Logout
            </button>

          </div>

        </div>

        {/* Page Content */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>

      </div>

    </div>
  );
}