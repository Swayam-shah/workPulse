import { useEffect, useState } from "react";
import { getStats } from "../services/dashboardService";
import { getCompany } from "../services/companyService";
import { getUsers } from "../services/userService";
import Layout from "../components/Layout";

export default function Dashboard() {

  const [stats, setStats] = useState(null);
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {

    const fetchData = async () => {

      const statsData = await getStats();
      setStats(statsData);

      const companyData = await getCompany();
      setCompany(companyData);

      const usersData = await getUsers();
      setUsers(usersData);

    };

    fetchData();

  }, []);

  if (!stats) return <p className="text-white">Loading...</p>;

  return (
    <Layout>

      <h1 className="text-3xl font-bold mb-6 text-white">
        Dashboard
      </h1>

      {/* COMPANY CODE */}
      {company && (
        <div className="bg-slate-800 border border-slate-700 p-4 rounded mb-6 flex justify-between items-center">

          <div>
            <p className="text-slate-400 text-sm">Company Code</p>
            <p className="font-mono text-lg font-bold text-white">{company.code}</p>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(company.code);
              alert("Copied!");
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded"
          >
            Copy
          </button>

        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-4 gap-6 mt-6">

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <p className="text-slate-400">Teams</p>
          <h2 className="text-3xl font-bold text-white">{stats.totalTeams}</h2>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <p className="text-slate-400">Tasks</p>
          <h2 className="text-3xl font-bold text-white">{stats.totalTasks}</h2>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <p className="text-slate-400">Completed</p>
          <h2 className="text-3xl font-bold text-green-400">{stats.completedTasks}</h2>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <p className="text-slate-400">In Progress</p>
          <h2 className="text-3xl font-bold text-orange-400">{stats.inProgressTasks}</h2>
        </div>

      </div>

      {/* MEMBERS */}
      <div className="bg-slate-800 border border-slate-700 p-6 rounded mt-6">

        <h2 className="text-xl font-semibold mb-4 text-white">Members</h2>

        {users.map((user) => (

          <div
            key={user._id}
            className="flex justify-between border-b border-slate-700 py-2"
          >

            <p className="text-white">{user.name}</p>

            <span className={`text-sm px-2 py-1 rounded ${
              user.role === "admin"
                ? "bg-green-900 text-green-400"
                : "bg-slate-700 text-slate-300"
            }`}>
              {user.role}
            </span>

          </div>

        ))}

      </div>

    </Layout>
  );
}