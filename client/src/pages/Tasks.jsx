import { useEffect, useState } from "react";
import { getTasks, createTask, updateTaskStatus } from "../services/taskService";
import { getTeams } from "../services/teamService";
import { getUsers } from "../services/userService";
import Layout from "../components/Layout";

export default function Tasks() {

  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");

  const [form, setForm] = useState({
    title: "",
    description: "",
    teamId: "",
    assignedTo: ""
  });

  const loadTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  const loadTeams = async () => {
    const data = await getTeams();
    setTeams(data);
  };

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  useEffect(() => {
    loadTasks();
    loadTeams();
    loadUsers();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleCreate = async () => {

    await createTask(form);

    setForm({
      title: "",
      description: "",
      teamId: "",
      assignedTo: ""
    });

    loadTasks();
  };

  const handleStatusChange = async (taskId, status) => {
    await updateTaskStatus(taskId, status);
    loadTasks();
  };

  const filteredTasks =
    filter === "mine"
      ? tasks.filter(
          (task) => task.assignedTo?._id === localStorage.getItem("userId")
        )
      : tasks;

  return (
    <Layout>

      <h1 className="text-3xl font-bold mb-6 text-white">
        Tasks
      </h1>

      {/* Filter Buttons */}
      <div className="flex gap-3 mb-6">

        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-1 rounded ${
            filter === "all" ? "bg-orange-500 text-white" : "bg-slate-700 text-slate-300"
          }`}
        >
          All Tasks
        </button>

        <button
          onClick={() => setFilter("mine")}
          className={`px-4 py-1 rounded ${
            filter === "mine" ? "bg-orange-500 text-white" : "bg-slate-700 text-slate-300"
          }`}
        >
          My Tasks
        </button>

      </div>

      {/* Create Task Card */}
      <div className="bg-slate-800 border border-slate-700 p-6 rounded shadow mb-8">

        <h2 className="font-semibold mb-4 text-white">
          Create Task
        </h2>

        <div className="flex gap-3 flex-wrap">

          <input
            name="title"
            placeholder="Title"
            onChange={handleChange}
            value={form.title}
            className="bg-slate-900 border border-slate-700 p-2 rounded text-white"
          />

          <input
            name="description"
            placeholder="Description"
            onChange={handleChange}
            value={form.description}
            className="bg-slate-900 border border-slate-700 p-2 rounded text-white"
          />

          <select
            name="teamId"
            onChange={handleChange}
            value={form.teamId}
            className="bg-slate-900 border border-slate-700 p-2 rounded text-white"
          >
            <option value="">Select Team</option>
            {teams.map((team) => (
              <option key={team._id} value={team._id}>{team.name}</option>
            ))}
          </select>

          <select
            name="assignedTo"
            onChange={handleChange}
            value={form.assignedTo}
            className="bg-slate-900 border border-slate-700 p-2 rounded text-white"
          >
            <option value="">Assign User</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>{user.name}</option>
            ))}
          </select>

          <button
            onClick={handleCreate}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 rounded"
          >
            Create
          </button>

        </div>

      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-3 gap-6">

        {/* TODO */}
        <div className="bg-slate-800 border border-slate-700 p-4 rounded">

          <h2 className="font-bold mb-4 text-white">Todo</h2>

          {filteredTasks
            .filter((task) => task.status === "todo")
            .map((task) => (

              <div
                key={task._id}
                className="bg-slate-900 border border-slate-700 p-4 mb-3 rounded hover:shadow-lg transition"
              >
                <p className="font-semibold text-white">{task.title}</p>
                <p className="text-sm text-slate-400">{task.description}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Assigned: {task.assignedTo?.name || "Unassigned"}
                </p>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task._id, e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white p-1 mt-2 rounded"
                >
                  <option value="todo">Todo</option>
                  <option value="progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

            ))}

        </div>

        {/* PROGRESS */}
        <div className="bg-slate-800 border border-slate-700 p-4 rounded">

          <h2 className="font-bold mb-4 text-white">In Progress</h2>

          {filteredTasks
            .filter((task) => task.status === "progress")
            .map((task) => (

              <div
                key={task._id}
                className="bg-slate-900 border border-slate-700 p-4 mb-3 rounded hover:shadow-lg transition"
              >
                <p className="font-semibold text-white">{task.title}</p>
                <p className="text-sm text-slate-400">{task.description}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Assigned: {task.assignedTo?.name || "Unassigned"}
                </p>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task._id, e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white p-1 mt-2 rounded"
                >
                  <option value="todo">Todo</option>
                  <option value="progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

            ))}

        </div>

        {/* DONE */}
        <div className="bg-slate-800 border border-slate-700 p-4 rounded">

          <h2 className="font-bold mb-4 text-white">Done</h2>

          {filteredTasks
            .filter((task) => task.status === "done")
            .map((task) => (

              <div
                key={task._id}
                className="bg-slate-900 border border-slate-700 p-4 mb-3 rounded hover:shadow-lg transition"
              >
                <p className="font-semibold text-white">{task.title}</p>
                <p className="text-sm text-slate-400">{task.description}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Assigned: {task.assignedTo?.name || "Unassigned"}
                </p>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task._id, e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white p-1 mt-2 rounded"
                >
                  <option value="todo">Todo</option>
                  <option value="progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

            ))}

        </div>

      </div>

    </Layout>
  );
}