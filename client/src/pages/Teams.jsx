import { useEffect, useState } from "react";
import { getTeams, createTeam, joinTeam, deleteTeam } from "../services/teamService";
import Layout from "../components/Layout";

export default function Teams() {

  const [teams, setTeams] = useState([]);
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [deletingTeam, setDeletingTeam] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const data = await getTeams();
        if (!cancelled) {
          setTeams(data);
        }
      } catch (err) {
        console.error("Failed to load teams", err);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadTeams = async () => {
    const data = await getTeams();
    setTeams(data);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      await createTeam({ name: name.trim() });
      setName("");
      loadTeams();
    } catch (err) {
      alert(err.response?.data?.message || "Could not create team");
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;

    try {
      await joinTeam(joinCode.trim());
      setJoinCode("");
      loadTeams();
    } catch (err) {
      alert(err.response?.data?.message || "Could not join team");
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied");
  };

  const openDeleteModal = (team) => {
    setDeleteError("");
    setDeletingTeam(team);
  };

  const handleDeleteTeam = async () => {
    if (!deletingTeam) return;
    try {
      setIsDeleting(true);
      setDeleteError("");
      await deleteTeam(deletingTeam._id);
      setDeletingTeam(null);
      loadTeams();
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Could not delete team");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Layout>

      <h1 className="text-3xl font-bold mb-6 text-white">
        Teams
      </h1>

      <p className="text-slate-400 mb-6 max-w-2xl leading-relaxed">
        You only see teams you belong to. Ask an admin for a team code, or join with a code below.
        Admins create teams and can share each team&apos;s join code with members.
      </p>

      <div className="flex flex-col lg:flex-row gap-6 mb-8">

        <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-xl shadow-lg flex-1 max-w-md">

          <h2 className="font-semibold mb-3 text-white">
            Join a team
          </h2>

          <p className="text-sm text-slate-400 mb-3">
            Enter the team code (same idea as the company code on registration).
          </p>

          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Team code"
              className="bg-slate-900 border border-slate-700 p-2 rounded text-white flex-1 font-mono"
            />
            <button
              type="button"
              onClick={handleJoin}
              className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded text-white whitespace-nowrap"
            >
              Join
            </button>
          </div>

        </div>

        {isAdmin && (
          <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-xl shadow-lg flex-1 max-w-md">

            <h2 className="font-semibold mb-3 text-white">
              Create team
            </h2>

            <p className="text-sm text-slate-400 mb-3">
              You are added as the first member. Share the generated join code with your team.
            </p>

            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Team name"
                className="bg-slate-900 border border-slate-700 p-2 rounded text-white flex-1"
              />
              <button
                type="button"
                onClick={handleCreate}
                className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded text-white"
              >
                Create
              </button>
            </div>

          </div>
        )}

      </div>

      <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-xl shadow-lg">

        <h2 className="font-semibold mb-4 text-white">
          My teams
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">

            <thead>
              <tr className="text-left border-b border-slate-700">
                <th className="py-2 text-slate-400">Team</th>
                <th className="py-2 text-slate-400">Members</th>
                {isAdmin && (
                  <>
                    <th className="py-2 text-slate-400">Join code</th>
                    <th className="py-2 text-slate-400">Actions</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {teams.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 4 : 2} className="py-6 text-slate-500">
                    You are not in any team yet. Join with a code or ask an admin to create one.
                  </td>
                </tr>
              )}

              {teams.map((team) => (
                <tr key={team._id} className="border-b border-slate-700">
                  <td className="py-3 text-white font-medium">{team.name}</td>
                  <td className="py-3 text-slate-300 text-sm">
                    {(team.members || [])
                      .map((m) => m.name || m.email)
                      .join(", ") || "—"}
                  </td>
                  {isAdmin && (
                    <td className="py-3">
                      {team.joinCode ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-green-400">{team.joinCode}</span>
                          <button
                            type="button"
                            onClick={() => copy(team.joinCode)}
                            className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-white"
                          >
                            Copy
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">—</span>
                      )}
                    </td>
                  )}
                  {isAdmin && (
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => openDeleteModal(team)}
                        className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}

            </tbody>

          </table>
        </div>

      </div>

      {deletingTeam && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white">Delete Team</h3>
            <p className="text-slate-300 mt-2">
              Are you sure you want to delete <span className="font-semibold">{deletingTeam.name}</span>?
            </p>
            <p className="text-slate-500 text-sm mt-1">
              All tasks in this team will also be deleted.
            </p>

            {deleteError && <p className="text-red-400 text-sm mt-3">{deleteError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingTeam(null)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTeam}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 rounded"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
