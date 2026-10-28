import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Trash2 } from "lucide-react";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    const res = await api.get("/auth/users");
    setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    await api.patch(`/auth/users/${userId}/role`, { role: newRole });
    fetchUsers();
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this user?")) return;
    await api.delete(`/auth/users/${userId}`);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">User Directory & Role Management</h2>
        <p className="text-sm text-slate-500">View registered students, wardens, and administrators</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
              <th className="py-3.5 px-4">Name & Reg No</th>
              <th className="py-3.5 px-4">Email & Phone</th>
              <th className="py-3.5 px-4">Role</th>
              {currentUser?.role === "Admin" && <th className="py-3.5 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {users.map((u) => (
              <tr key={u.user_id} className="hover:bg-slate-50/80">
                <td className="py-3.5 px-4">
                  <p className="font-semibold text-slate-900">{u.name}</p>
                  {u.registration_no && (
                    <p className="text-xs text-indigo-600 font-mono">Reg: {u.registration_no}</p>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <p className="text-slate-700">{u.email}</p>
                  <p className="text-xs text-slate-400">{u.phone || "No phone"}</p>
                </td>
                <td className="py-3.5 px-4">
                  {currentUser?.role === "Admin" ? (
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                      className="px-2.5 py-1 border border-slate-300 rounded-md text-xs font-semibold bg-white"
                    >
                      <option value="Student">Student</option>
                      <option value="Warden">Warden</option>
                      <option value="Admin">Admin</option>
                    </select>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {u.role}
                    </span>
                  )}
                </td>
                {currentUser?.role === "Admin" && (
                  <td className="py-3.5 px-4 text-right">
                    {u.user_id !== currentUser.user_id && (
                      <button
                        onClick={() => handleDelete(u.user_id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
