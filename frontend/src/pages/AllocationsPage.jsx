import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Bed, Clock, CheckCircle, XCircle, ListOrdered, Send } from "lucide-react";

export default function AllocationsPage() {
    const { user } = useAuth();
    const isStaff = user?.role === "Warden" || user?.role === "Admin";

    const [allocations, setAllocations] = useState([]);
    const [waitlist, setWaitlist] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedRooms, setSelectedRooms] = useState({});
    const [form, setForm] = useState({
        academic_year: "2026-2027",
        semester: "Fall 2026",
        preferred_room_type: "Double",
    });
    const [error, setError] = useState("");

    const fetchData = async () => {
        const [allocRes, waitRes, roomsRes] = await Promise.all([
            api.get("/allocations/"),
                                                                api.get("/allocations/waitlist"),
                                                                api.get("/rooms/", { params: { status_filter: "Available" } }),
        ]);
        setAllocations(allocRes.data);
        setWaitlist(waitRes.data);
        setAvailableRooms(roomsRes.data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApply = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await api.post("/allocations/apply", form);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.detail || "Application failed");
        }
    };

    const handleAllocate = async (bookingId) => {
        const roomId = selectedRooms[bookingId];
        if (!roomId) {
            alert("Please select an available room from the dropdown first.");
            return;
        }
        try {
            await api.post(`/allocations/${bookingId}/allocate`, { room_id: Number(roomId) });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || "Allocation failed");
        }
    };

    const handleReject = async (bookingId) => {
        if (!window.confirm("Reject this accommodation application?")) return;
        await api.post(`/allocations/${bookingId}/reject`);
        fetchData();
    };

    const statusBadge = {
        Pending: "bg-amber-100 text-amber-800 border-amber-200",
        Approved: "bg-blue-100 text-blue-800 border-blue-200",
        Active: "bg-emerald-100 text-emerald-800 border-emerald-200",
        Rejected: "bg-rose-100 text-rose-800 border-rose-200",
        Vacated: "bg-slate-100 text-slate-700 border-slate-200",
    };

    return (
        <div className="space-y-8">
        <div>
        <h2 className="text-2xl font-bold text-slate-900">
        {isStaff ? "Accommodation Applications & Room Allocation" : "My Hostel Accommodation"}
        </h2>
        <p className="text-sm text-slate-500">
        {isStaff
            ? "Process student applications, assign available rooms, and monitor the waitlist"
            : "Apply for hostel accommodation and check your room allotment status"}
            </p>
            </div>

            {/* Student Application Card */}
            {!isStaff && allocations.length === 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-xl">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Apply for Hostel Room</h3>
                <p className="text-xs text-slate-500 mb-4">
                If your preferred room type is currently full, you will be automatically placed on the priority waitlist.
                </p>
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                    {error}
                    </div>
                )}
                <form onSubmit={handleApply} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="text-xs font-semibold uppercase text-slate-600">Academic Year</label>
                <input
                type="text"
                value={form.academic_year}
                onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                className="w-full mt-1 px-3.5 py-2 border rounded-lg text-sm"
                />
                </div>
                <div>
                <label className="text-xs font-semibold uppercase text-slate-600">Semester</label>
                <select
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className="w-full mt-1 px-3.5 py-2 border rounded-lg text-sm bg-white"
                >
                <option value="Fall 2026">Fall 2026</option>
                <option value="Spring 2027">Spring 2027</option>
                </select>
                </div>
                </div>

                <div>
                <label className="text-xs font-semibold uppercase text-slate-600">Preferred Room Type</label>
                <select
                value={form.preferred_room_type}
                onChange={(e) => setForm({ ...form, preferred_room_type: e.target.value })}
                className="w-full mt-1 px-3.5 py-2 border rounded-lg text-sm bg-white"
                >
                <option value="Single">Single Sharing (₹35,000 / Sem)</option>
                <option value="Double">Double Sharing (₹25,000 / Sem)</option>
                <option value="Triple">Triple Sharing (₹18,000 / Sem)</option>
                </select>
                </div>

                <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
                >
                <Send className="w-4 h-4" />
                Submit Accommodation Request
                </button>
                </form>
                </div>
            )}

            {/* Applications List / Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Bed className="w-5 h-5 text-indigo-600" />
            {isStaff ? "All Accommodation Requests" : "Application Status"}
            </h3>
            </div>

            {allocations.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">No accommodation applications found.</div>
            ) : (
                <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <th className="py-3.5 px-4">Booking ID</th>
                {isStaff && <th className="py-3.5 px-4">Student</th>}
                <th className="py-3.5 px-4">Semester</th>
                <th className="py-3.5 px-4">Preferred Type</th>
                <th className="py-3.5 px-4">Allocated Room</th>
                <th className="py-3.5 px-4">Status</th>
                {isStaff && <th className="py-3.5 px-4 text-right">Room Allocation Action</th>}
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                {allocations.map((app) => (
                    <tr key={app.booking_id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">#BK-{app.booking_id}</td>
                    {isStaff && (
                        <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{app.student?.name}</p>
                        <p className="text-xs text-indigo-600 font-mono">
                        {app.student?.registration_no || app.student?.email}
                        </p>
                        </td>
                    )}
                    <td className="py-3.5 px-4">
                    <p className="font-medium text-slate-800">{app.semester}</p>
                    <p className="text-xs text-slate-400">{app.academic_year}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{app.preferred_room_type}</td>
                    <td className="py-3.5 px-4">
                    {app.room ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-xs">
                        Room {app.room.room_number} ({app.room.block})
                        </span>
                    ) : (
                        <span className="text-xs text-slate-400 italic">Not assigned yet</span>
                    )}
                    </td>
                    <td className="py-3.5 px-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${statusBadge[app.status]}`}>
                    {app.status === "Approved" ? "Approved (Awaiting Fee)" : app.status}
                    </span>
                    </td>
                    {isStaff && (
                        <td className="py-3.5 px-4 text-right">
                        {app.status === "Pending" ? (
                            <div className="flex items-center justify-end gap-2">
                            <select
                            value={selectedRooms[app.booking_id] || ""}
                            onChange={(e) =>
                                setSelectedRooms({ ...selectedRooms, [app.booking_id]: e.target.value })
                            }
                            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                            >
                            <option value="">Select Room...</option>
                            {availableRooms.map((r) => (
                                <option key={r.room_id} value={r.room_id}>
                                {r.room_number} ({r.type} - {r.capacity - r.current_occupancy} bed free)
                                </option>
                            ))}
                            </select>
                            <button
                            onClick={() => handleAllocate(app.booking_id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1"
                            >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Allocate
                            </button>
                            <button
                            onClick={() => handleReject(app.booking_id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Reject"
                            >
                            <XCircle className="w-4 h-4" />
                            </button>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400">Processed</span>
                        )}
                        </td>
                    )}
                    </tr>
                ))}
                </tbody>
                </table>
            )}
            </div>

            {/* Waitlist Table (From ER Diagram) */}
            {waitlist.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900">Room Waitlist Queue</h3>
                </div>
                <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <th className="py-3 px-4">Queue Position</th>
                {isStaff && <th className="py-3 px-4">Student</th>}
                <th className="py-3 px-4">Preferred Room Type</th>
                <th className="py-3 px-4">Waitlist Status</th>
                <th className="py-3 px-4">Joined At</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                {waitlist.map((w) => (
                    <tr key={w.waitlist_id}>
                    <td className="py-3 px-4 font-bold text-amber-700">#{w.position}</td>
                    {isStaff && <td className="py-3 px-4 font-medium">{w.student?.name}</td>}
                    <td className="py-3 px-4">{w.preferred_room_type} Sharing</td>
                    <td className="py-3 px-4">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                    {w.status}
                    </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                    {new Date(w.joined_at).toLocaleDateString()}
                    </td>
                    </tr>
                ))}
                </tbody>
                </table>
                </div>
            )}
            </div>
    );
}
