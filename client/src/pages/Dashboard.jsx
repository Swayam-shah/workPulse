import { useEffect, useState } from "react";
import { getStats } from "../services/dashboardService";
import { getCompany } from "../services/companyService";
import Layout from "../components/Layout";

export default function Dashboard() {

  const [stats, setStats] = useState(null);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [statsData, companyData] = await Promise.all([getStats(), getCompany()]);
        if (!cancelled) {
          setStats(statsData);
          setCompany(companyData);
        }
      } catch (err) {
        console.error("Failed to load dashboard", err);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 30_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  if (!stats) return <p className="text-white">Loading...</p>;

  const statusStyle = {
    todo: "text-white",
    inProgress: "text-yellow-300",
    completed: "text-green-400",
    failed: "text-red-400"
  };

  const buildPie = (team) => {
    const total = team.totalTasks || 0;
    if (!total) {
      return {
        background: "conic-gradient(#334155 0 100%)"
      };
    }

    const todo = (team.todoTasks || 0) / total * 100;
    const progress = (team.inProgressTasks || 0) / total * 100;
    const done = (team.completedTasks || 0) / total * 100;
    const fail = (team.failedTasks || 0) / total * 100;

    const c1 = todo;
    const c2 = c1 + progress;
    const c3 = c2 + done;
    const c4 = c3 + fail;

    return {
      background: `conic-gradient(#ffffff 0% ${c1}%, #facc15 ${c1}% ${c2}%, #4ade80 ${c2}% ${c3}%, #f87171 ${c3}% ${c4}%)`
    };
  };

  return (
    <Layout>

      <h1 className="text-3xl font-bold mb-6 text-white">
        Dashboard
      </h1>

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

      <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-xl mb-6 shadow-lg">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {(stats.teams || []).map((team) => (
            <div key={`pie-${team.teamId}`} className="min-w-[200px] bg-slate-900 border border-slate-700 rounded-xl p-3 shadow">
              <p className="text-sm font-semibold text-white truncate mb-2">{team.teamName}</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-16 rounded-full border border-slate-600"
                  style={buildPie(team)}
                />
                <div className="text-xs space-y-1">
                  <p className="text-white">To do: {team.todoTasks}</p>
                  <p className="text-yellow-300">In progress: {team.inProgressTasks}</p>
                  <p className="text-green-400">Done: {team.completedTasks}</p>
                  <p className="text-red-400">Fail: {team.failedTasks}</p>
                </div>
              </div>
            </div>
          ))}
          {(stats.teams || []).length === 0 && (
            <p className="text-slate-500">No teams to display.</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {(stats.teams || []).map((team) => (
          <div key={team.teamId} className="bg-slate-800/80 border border-slate-700 p-5 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">{team.teamName}</h2>
              <span className="text-xs text-slate-400">Total tasks: {team.totalTasks}</span>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-900/70 border border-slate-700 p-3 rounded-lg">
                <p className="text-sm font-semibold text-white mb-1">To do</p>
                <ul className="space-y-1">
                  {(team.tasks?.todo || []).map((title, i) => (
                    <li key={`todo-${i}`} className={`text-sm ${statusStyle.todo}`}>- {title}</li>
                  ))}
                  {(team.tasks?.todo || []).length === 0 && <li className="text-slate-500 text-sm">No tasks</li>}
                </ul>
              </div>

              <div className="bg-slate-900/70 border border-slate-700 p-3 rounded-lg">
                <p className="text-sm font-semibold text-yellow-300 mb-1">In progress</p>
                <ul className="space-y-1">
                  {(team.tasks?.inProgress || []).map((title, i) => (
                    <li key={`progress-${i}`} className={`text-sm ${statusStyle.inProgress}`}>- {title}</li>
                  ))}
                  {(team.tasks?.inProgress || []).length === 0 && <li className="text-slate-500 text-sm">No tasks</li>}
                </ul>
              </div>

              <div className="bg-slate-900/70 border border-slate-700 p-3 rounded-lg">
                <p className="text-sm font-semibold text-green-400 mb-1">Done</p>
                <ul className="space-y-1">
                  {(team.tasks?.completed || []).map((title, i) => (
                    <li key={`done-${i}`} className={`text-sm ${statusStyle.completed}`}>- {title}</li>
                  ))}
                  {(team.tasks?.completed || []).length === 0 && <li className="text-slate-500 text-sm">No tasks</li>}
                </ul>
              </div>

              <div className="bg-slate-900/70 border border-slate-700 p-3 rounded-lg">
                <p className="text-sm font-semibold text-red-400 mb-1">Fail</p>
                <ul className="space-y-1">
                  {(team.tasks?.failed || []).map((title, i) => (
                    <li key={`fail-${i}`} className={`text-sm ${statusStyle.failed}`}>- {title}</li>
                  ))}
                  {(team.tasks?.failed || []).length === 0 && <li className="text-slate-500 text-sm">No tasks</li>}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

    </Layout>
  );
}