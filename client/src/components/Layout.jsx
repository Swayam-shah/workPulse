import { Link, useNavigate } from "react-router-dom";

export default function Layout({ children }) {

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200">

      {/* Sidebar */}
      <div className="w-60 bg-black border-r border-slate-800 flex flex-col p-6">

        <h1 className="text-xl font-bold mb-10">
          WorkPulse
        </h1>

        <Link to="/dashboard" className="mb-3 hover:text-orange-400">Dashboard</Link>
        <Link to="/tasks" className="mb-3 hover:text-orange-400">Tasks</Link>

        {user?.role === "admin" && (
          <>
            <Link to="/teams" className="mb-3 hover:text-orange-400">Teams</Link>
            <Link to="/users" className="mb-3 hover:text-orange-400">Users</Link>
          </>
        )}

      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">

        {/* Top Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex justify-between items-center">

          <h2 className="font-semibold text-lg">
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
              className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
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