import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Building2, KeyRound, UserPlus } from "lucide-react";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    registration_no: "",
  });

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await register({ ...form, role: "Student" });
      } else {
        await login(form.email, form.password);
      }
      navigate("/rooms");
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed");
    }
  };

  const quickFill = (email, password) => {
    setIsRegister(false);
    setForm({ ...form, email, password });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white flex items-center gap-3">
          <div className="p-2.5 bg-white/15 rounded-xl">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Hostel Management System</h1>
            <p className="text-indigo-100 text-xs">Sprint 1: Role-Based Portal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Bhavishya Yadav"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Reg. Number</label>
                  <input
                    type="text"
                    value={form.registration_no}
                    onChange={(e) => setForm({ ...form, registration_no: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="2427010200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="9876543210"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="student@hostel.edu"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-2"
          >
            {isRegister ? <UserPlus className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
            {isRegister ? "Create Student Account" : "Sign In"}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              {isRegister ? "Already have an account? Sign In" : "New student? Register for Hostel"}
            </button>
          </div>
        </form>

        {/* Quick Demo Credentials Bar */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Quick Fill Demo Accounts:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => quickFill("student@hostel.edu", "student123")}
              className="px-2.5 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-100"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => quickFill("warden@hostel.edu", "warden123")}
              className="px-2.5 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-md hover:bg-amber-100"
            >
              Warden
            </button>
            <button
              type="button"
              onClick={() => quickFill("admin@hostel.edu", "admin123")}
              className="px-2.5 py-1.5 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 rounded-md hover:bg-rose-100"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
