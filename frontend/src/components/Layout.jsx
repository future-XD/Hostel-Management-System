import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
/*import { Building2, BedDouble, Users, LogOut, ShieldCheck } from "lucide-react"; */
import { Building2, BedDouble, Users, LogOut, ClipboardCheck, CreditCard, ShieldCheck, Wrench, UserCheck, Megaphone, BarChart3 } from "lucide-react";
export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleBadgeColor = {
    Admin: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    Warden: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Student: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  }[user?.role || "Student"];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">HostelHub</h1>
              <p className="text-xs text-slate-400">Management System</p>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Active Role
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${roleBadgeColor}`}>
                {user?.role}
              </span>
            </div>
            <p className="mt-2 font-semibold text-sm truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            {user?.registration_no && (
              <p className="text-xs text-indigo-400 mt-0.5 font-mono">Reg: {user.registration_no}</p>
            )}
          </div>

          <nav className="p-4 space-y-1.5">
            <NavLink
              to="/rooms"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`
              }
            >
              <BedDouble className="w-4 h-4" />
              {user?.role === "Student" ? "Hostel Rooms" : "Manage Rooms"}
            </NavLink>


            <NavLink
            to="/allocations"
            className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`
            }
            >
            <ClipboardCheck className="w-4 h-4" />
            {user?.role === "Student" ? "My Accommodation" : "Room Allocations"}
            </NavLink>

            <NavLink
            to="/fees"
            className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`
            }
            >

            <CreditCard className="w-4 h-4" />
            Fee Payments
            </NavLink>

            <NavLink
            to="/complaints"
            className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`
            }
            >
            <Wrench className="w-4 h-4" />
            Complaints & Inspections
            </NavLink>

            <NavLink
            to="/visitors"
            className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`
            }
            >
            <UserCheck className="w-4 h-4" />
            Visitor Entry Log
            </NavLink>

            <NavLink
            to="/leaves-notices"
            className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
              isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`
            }
            >
            <Megaphone className="w-4 h-4" />
            Leaves & Notices
            </NavLink>

            {(user?.role === "Admin" || user?.role === "Warden") && (
              <NavLink
              to="/reports"
              className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
              }`
              }
              >
              <BarChart3 className="w-4 h-4" />
              System Reports
              </NavLink>
            )}

            {(user?.role === "Admin" || user?.role === "Warden") && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`
                }
              >
                <Users className="w-4 h-4" />
                Manage Users
              </NavLink>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white text-sm font-medium transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
