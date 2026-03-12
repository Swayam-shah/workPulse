import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getUsers } from "../services/userService";

export default function Users() {

  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <Layout>

      <h1 className="text-3xl font-bold mb-6 text-white">
        Users
      </h1>

      <div className="bg-slate-800 border border-slate-700 p-6 rounded shadow">

        <table className="w-full">

          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 text-slate-400">Name</th>
              <th className="text-left text-slate-400">Email</th>
              <th className="text-left text-slate-400">Role</th>
            </tr>
          </thead>

          <tbody>

            {users.map((user) => (
              <tr key={user._id} className="border-b border-slate-700">

                <td className="py-2 text-white">{user.name}</td>
                <td className="text-slate-300">{user.email}</td>
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