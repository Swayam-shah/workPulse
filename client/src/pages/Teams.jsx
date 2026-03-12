import { useEffect, useState } from "react";
import { getTeams, createTeam } from "../services/teamService";
import Layout from "../components/Layout";

export default function Teams() {

  const [teams, setTeams] = useState([]);
  const [name, setName] = useState("");

  const loadTeams = async () => {
    const data = await getTeams();
    setTeams(data);
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleCreate = async () => {
    if (!name) return;

    await createTeam({ name });
    setName("");
    loadTeams();
  };

  return (
    <Layout>

      <h1 className="text-3xl font-bold mb-6 text-white">
        Teams
      </h1>

      {/* Create Team Card */}
      <div className="bg-slate-800 border border-slate-700 p-6 rounded shadow mb-8 w-96">

        <h2 className="font-semibold mb-4 text-white">
          Create Team
        </h2>

        <div className="flex gap-2">

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Team name"
            className="bg-slate-900 border border-slate-700 p-2 rounded text-white flex-1"
          />

          <button
            onClick={handleCreate}
            className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded text-white"
          >
            Create
          </button>

        </div>

      </div>

      {/* Teams Table */}
      <div className="bg-slate-800 border border-slate-700 p-6 rounded shadow">

        <h2 className="font-semibold mb-4 text-white">
          All Teams
        </h2>

        <table className="w-full">

          <thead>
            <tr className="text-left border-b border-slate-700">
              <th className="py-2 text-slate-400">Team Name</th>
            </tr>
          </thead>

          <tbody>
            {teams.map((team) => (
              <tr key={team._id} className="border-b border-slate-700">
                <td className="py-2 text-white">{team.name}</td>
              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </Layout>
  );
}