import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { UserCheck, LogOut, Plus, Clock } from "lucide-react";

export default function VisitorsPage() {
    const { user } = useAuth();
    const isStaff = user?.role === "Warden" || user?.role === "Admin";

    const [visitors, setVisitors] = useState([]);
    const [students, setStudents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        student_id: "",
        visitor_name: "",
        relation: "Parent",
        phone: "",
        purpose: "",
    });

    const fetchData = async () => {
        const visRes = await api.get("/operations/visitors");
        setVisitors(visRes.data);

        if (isStaff) {
            const usersRes = await api.get("/auth/users");
            const studentList = usersRes.data.filter((u) => u.role === "Student");
            setStudents(studentList);
            if (studentList.length > 0 && !form.student_id) {
                setForm((prev) => ({ ...prev, student_id: studentList[0].user_id }));
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleLogVisitor = async (e) => {
        e.preventDefault();
        await api.post("/operations/visitors", {
            ...form,
            student_id: Number(form.student_id),
        });
        setShowModal(false);
        setForm({ ...form, visitor_name: "", phone: "", purpose: "" });
        fetchData();
    };

    const handleCheckout = async (visitorId) => {
        await api.patch(`/operations/visitors/${visitorId}/checkout`);
        fetchData();
    };

    const getStudentName = (id) => {
        const found = students.find((s) => s.user_id === id);
        return found ? `${found.name} (${found.registration_no || found.email})` : `Student #${id}`;
    };

    return (
        <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
        <h2 className="text-2xl font-bold text-slate-900">Hostel Visitor Entry Log</h2>
        <p className="text-sm text-slate-500">
        {isStaff
            ? "Register incoming hostel visitors and track check-in / check-out timestamps"
            : "View visitors logged under your hostel profile"}
            </p>
            </div>
            {isStaff && (
                <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
                >
                <Plus className="w-4 h-4" />
                Log Visitor Entry
                </button>
            )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {visitors.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                No visitor entries recorded yet.
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <th className="py-3.5 px-4">Visitor Name & Relation</th>
                <th className="py-3.5 px-4">Phone</th>
                {isStaff && <th className="py-3.5 px-4">Visiting Student</th>}
                <th className="py-3.5 px-4">Purpose</th>
                <th className="py-3.5 px-4">Check-In</th>
                <th className="py-3.5 px-4">Check-Out / Action</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                {visitors.map((v) => (
                    <tr key={v.visitor_id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900">{v.visitor_name}</p>
                    <span className="text-xs text-indigo-600 font-medium">{v.relation}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{v.phone}</td>
                    {isStaff && (
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                        {getStudentName(v.student_id)}
                        </td>
                    )}
                    <td className="py-3.5 px-4 text-slate-600">{v.purpose}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                    {new Date(v.check_in_time).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                    {v.check_out_time ? (
                        <span className="text-xs text-emerald-700 font-medium">
                        Out: {new Date(v.check_out_time).toLocaleTimeString()}
                        </span>
                    ) : isStaff ? (
                        <button
                        onClick={() => handleCheckout(v.visitor_id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg transition"
                        >
                        <LogOut className="w-3.5 h-3.5" />
                        Mark Check-Out
                        </button>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <Clock className="w-3.5 h-3.5" /> Inside Hostel
                        </span>
                    )}
                    </td>
                    </tr>
                ))}
                </tbody>
                </table>
            )}
            </div>

            {/* Log Visitor Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900">Register Visitor Entry</h3>
                <form onSubmit={handleLogVisitor} className="space-y-3">
                <div>
                <label className="text-xs font-semibold text-slate-600">Visiting Student</label>
                <select
                required
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                >
                {students.map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                    {s.name} ({s.registration_no || s.email})
                    </option>
                ))}
                </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                <div>
                <label className="text-xs font-semibold text-slate-600">Visitor Name</label>
                <input
                type="text"
                required
                value={form.visitor_name}
                onChange={(e) => setForm({ ...form, visitor_name: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                />
                </div>
                <div>
                <label className="text-xs font-semibold text-slate-600">Relation</label>
                <select
                value={form.relation}
                onChange={(e) => setForm({ ...form, relation: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                >
                <option value="Parent">Parent</option>
                <option value="Guardian">Guardian</option>
                <option value="Sibling">Sibling</option>
                <option value="Relative">Relative</option>
                </select>
                </div>
                </div>

                <div>
                <label className="text-xs font-semibold text-slate-600">Visitor Phone</label>
                <input
                type="text"
                required
                placeholder="9876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                />
                </div>

                <div>
                <label className="text-xs font-semibold text-slate-600">Purpose of Visit</label>
                <input
                type="text"
                required
                placeholder="Dropping luggage / Family visit"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                Cancel
                </button>
                <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                Check In Visitor
                </button>
                </div>
                </form>
                </div>
                </div>
            )}
            </div>
    );
}
