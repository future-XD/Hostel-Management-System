import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { AlertTriangle, ClipboardList, CheckCircle2, ShieldAlert, Plus, Edit3 } from "lucide-react";

export default function ComplaintsPage() {
    const { user } = useAuth();
    const isStaff = user?.role === "Warden" || user?.role === "Admin";

    const [logs, setLogs] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingLog, setEditingLog] = useState(null);

    const [createForm, setCreateForm] = useState({
        room_id: "",
        category: "Electrical",
        title: "",
        description: "",
        cleanliness_level: 4,
        damage_severity: 1,
    });

    const [updateForm, setUpdateForm] = useState({
        status: "In Progress",
        cleanliness_level: 4,
        damage_severity: 2,
        warden_remarks: "",
    });

    const fetchData = async () => {
        const [logsRes, roomsRes] = await Promise.all([
            api.get("/operations/complaints"),
                                                      api.get("/rooms/"),
        ]);
        setLogs(logsRes.data);
        setRooms(roomsRes.data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            category: createForm.category,
            title: createForm.title,
            description: createForm.description,
            room_id: createForm.room_id ? Number(createForm.room_id) : null,
        };
        if (isStaff) {
            payload.cleanliness_level = Number(createForm.cleanliness_level);
            payload.damage_severity = Number(createForm.damage_severity);
        }
        await api.post("/operations/complaints", payload);
        setShowCreateModal(false);
        setCreateForm({ room_id: "", category: "Electrical", title: "", description: "", cleanliness_level: 4, damage_severity: 1 });
        fetchData();
    };

    const openResolveModal = (log) => {
        setEditingLog(log);
        setUpdateForm({
            status: log.status,
            cleanliness_level: log.cleanliness_level || 4,
            damage_severity: log.damage_severity || 1,
            warden_remarks: log.warden_remarks || "",
        });
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        await api.patch(`/operations/complaints/${editingLog.log_id}`, {
            status: updateForm.status,
            cleanliness_level: Number(updateForm.cleanliness_level),
                        damage_severity: Number(updateForm.damage_severity),
                        warden_remarks: updateForm.warden_remarks,
        });
        setEditingLog(null);
        fetchData();
    };

    const statusBadge = {
        Open: "bg-amber-100 text-amber-800 border-amber-200",
        "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
        Resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
        Escalated: "bg-rose-100 text-rose-800 border-rose-200",
    };

    return (
        <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
        <h2 className="text-2xl font-bold text-slate-900">
        Complaints & Room Inspection Logs
        </h2>
        <p className="text-sm text-slate-500">
        {isStaff
            ? "Resolve student maintenance complaints and record room cleanliness/damage inspections"
            : "Raise maintenance requests for your room and track resolution updates"}
            </p>
            </div>
            <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            >
            <Plus className="w-4 h-4" />
            {isStaff ? "Log Room Inspection" : "Raise Complaint"}
            </button>
            </div>

            {/* Logs Grid */}
            {logs.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-sm text-slate-500">
                No complaints or room inspection logs recorded yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {logs.map((log) => (
                    <div
                    key={log.log_id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between space-y-4"
                    >
                    <div>
                    <div className="flex items-start justify-between gap-2">
                    <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    {log.category} {log.room ? `• Room ${log.room.room_number}` : ""}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{log.title}</h3>
                    </div>
                    <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                        statusBadge[log.status] || statusBadge.Open
                    }`}
                    >
                    {log.status}
                    </span>
                    </div>

                    <p className="text-sm text-slate-600 mt-2">{log.description}</p>

                    {/* ER Diagram Inspection Metrics (Cleanliness & Damage Severity) */}
                    {(log.cleanliness_level !== null || log.damage_severity !== null) && (
                        <div className="mt-4 grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <div>
                        <span className="text-slate-500 block">Cleanliness Rating:</span>
                        <span className="font-bold text-slate-800">{log.cleanliness_level ?? "N/A"} / 5</span>
                        </div>
                        <div>
                        <span className="text-slate-500 block">Damage Severity:</span>
                        <span className="font-bold text-rose-600">{log.damage_severity ?? "N/A"} / 5</span>
                        </div>
                        </div>
                    )}

                    {log.warden_remarks && (
                        <div className="mt-3 p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950">
                        <span className="font-semibold block mb-0.5">Warden Remarks:</span>
                        {log.warden_remarks}
                        </div>
                    )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>
                    By {log.student?.name || "User"} • {new Date(log.created_at).toLocaleDateString()}
                    </span>
                    {isStaff && (
                        <button
                        onClick={() => openResolveModal(log)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 font-semibold rounded-lg transition"
                        >
                        <Edit3 className="w-3.5 h-3.5" />
                        Inspect / Resolve
                        </button>
                    )}
                    </div>
                    </div>
                ))}
                </div>
            )}

            {/* Raise Complaint / Log Inspection Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900">
                {isStaff ? "Log Room Inspection / Maintenance" : "Raise Room Complaint"}
                </h3>
                <form onSubmit={handleCreateSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                <div>
                <label className="text-xs font-semibold text-slate-600">Category</label>
                <select
                value={createForm.category}
                onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                >
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Furniture">Furniture</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Room Inspection">Room Inspection</option>
                </select>
                </div>
                <div>
                <label className="text-xs font-semibold text-slate-600">Room (Optional)</label>
                <select
                value={createForm.room_id}
                onChange={(e) => setCreateForm({ ...createForm, room_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                >
                <option value="">Auto-Detect My Room</option>
                {rooms.map((r) => (
                    <option key={r.room_id} value={r.room_id}>
                    Room {r.room_number} ({r.block})
                    </option>
                ))}
                </select>
                </div>
                </div>

                <div>
                <label className="text-xs font-semibold text-slate-600">Issue Title</label>
                <input
                type="text"
                required
                placeholder="e.g., Ceiling fan regulator not working"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                />
                </div>

                <div>
                <label className="text-xs font-semibold text-slate-600">Detailed Description</label>
                <textarea
                rows="3"
                required
                placeholder="Describe the issue or inspection findings..."
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                />
                </div>

                {isStaff && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                    <label className="text-xs font-semibold text-slate-600">Cleanliness (1-5)</label>
                    <input
                    type="number"
                    min="1"
                    max="5"
                    value={createForm.cleanliness_level}
                    onChange={(e) => setCreateForm({ ...createForm, cleanliness_level: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                    />
                    </div>
                    <div>
                    <label className="text-xs font-semibold text-slate-600">Damage Severity (1-5)</label>
                    <input
                    type="number"
                    min="1"
                    max="5"
                    value={createForm.damage_severity}
                    onChange={(e) => setCreateForm({ ...createForm, damage_severity: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                    />
                    </div>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-3">
                <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                Cancel
                </button>
                <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                Submit Record
                </button>
                </div>
                </form>
                </div>
                </div>
            )}

            {/* Warden / Admin Resolution & Inspection Scoring Modal */}
            {editingLog && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900">
                Update Status & Inspection Metrics
                </h3>
                <form onSubmit={handleUpdateSubmit} className="space-y-3">
                <div>
                <label className="text-xs font-semibold text-slate-600">Resolution Status</label>
                <select
                value={updateForm.status}
                onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Escalated">Escalated (Send to Admin)</option>
                </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                <div>
                <label className="text-xs font-semibold text-slate-600">Cleanliness Level (1-5)</label>
                <input
                type="number"
                min="1"
                max="5"
                value={updateForm.cleanliness_level}
                onChange={(e) => setUpdateForm({ ...updateForm, cleanliness_level: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                />
                </div>
                <div>
                <label className="text-xs font-semibold text-slate-600">Damage Severity (1-5)</label>
                <input
                type="number"
                min="1"
                max="5"
                value={updateForm.damage_severity}
                onChange={(e) => setUpdateForm({ ...updateForm, damage_severity: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                />
                </div>
                </div>

                <div>
                <label className="text-xs font-semibold text-slate-600">Warden / Admin Remarks</label>
                <textarea
                rows="3"
                placeholder="Action taken or maintenance notes..."
                value={updateForm.warden_remarks}
                onChange={(e) => setUpdateForm({ ...updateForm, warden_remarks: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                Cancel
                </button>
                <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                Save Resolution
                </button>
                </div>
                </form>
                </div>
                </div>
            )}
            </div>
    );
}
