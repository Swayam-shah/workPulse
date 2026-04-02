import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getUsers } from "../services/userService";
import { getTeams } from "../services/teamService";

export default function Users() {

  const [users, setUsers] = useState([]);
  const [userTeamsMap, setUserTeamsMap] = useState({});

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const [usersData, teamsData] = await Promise.all([getUsers(), getTeams()]);

        if (cancelled) return;
        setUsers(usersData);

        const map = {};
        (teamsData || []).forEach((team) => {
          (team.members || []).forEach((member) => {
            const key = String(member._id);
            if (!map[key]) map[key] = [];
            map[key].push(team.name);
          });
        });
        setUserTeamsMap(map);
      } catch (err) {
        console.error("Failed to load users/teams", err);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Layout>

      <h1 className="text-3xl font-bold mb-6 text-white">
        Users
      </h1>

      <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-xl shadow-lg">

        <table className="w-full">

          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 text-slate-400">Name</th>
              <th className="text-left text-slate-400">Email</th>
              <th className="text-left text-slate-400">Teams</th>
              <th className="text-left text-slate-400">Role</th>
            </tr>
          </thead>

          <tbody>

            {users.map((user) => (
              <tr key={user._id} className="border-b border-slate-700/70 hover:bg-slate-900/40 transition">

                <td className="py-2 text-white">{user.name}</td>
                <td className="text-slate-300">{user.email}</td>
                <td className="text-slate-300 text-sm">
                  {(userTeamsMap[user._id] || []).join(", ") || "—"}
                </td>
                <td>
                  <span className={`text-sm px-2 py-1 rounded ${
                    user.role === "admin"
                      ? "bg-green-900 text-green-400"
                      : "bg-slate-700 text-slate-300"
                  }`}>
                    {user.role}
                  </span>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </Layout>
  );
}