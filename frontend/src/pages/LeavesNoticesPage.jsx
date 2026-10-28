import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Megaphone, CalendarClock, Plus, CheckCircle, XCircle, Trash2 } from "lucide-react";

export default function LeavesNoticesPage() {
    const { user } = useAuth();
    const isStaff = user?.role === "Warden" || user?.role === "Admin";

    const [notices, setNotices] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [showNoticeModal, setShowNoticeModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    const [noticeForm, setNoticeForm] = useState({
        title: "",
        message: "",
        type: "General",
        target_role: "All",
    });

    const [leaveForm, setLeaveForm] = useState({
        destination: "",
        reason: "",
        start_date: "",
        end_date: "",
    });

    const fetchData = async () => {
        const [noticeRes, leaveRes] = await Promise.all([
            api.get("/d6/notices"),
                                                        api.get("/d6/leaves"),
        ]);
        setNotices(noticeRes.data);
        setLeaves(leaveRes.data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateNotice = async (e) => {
        e.preventDefault();
        await api.post("/d6/notices", noticeForm);
        setShowNoticeModal(false);
        setNoticeForm({ title: "", message: "", type: "General", target_role: "All" });
        fetchData();
    };

    const handleDeleteNotice = async (id) => {
        await api.delete(`/d6/notices/${id}`);
        fetchData();
    };

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        try {
            await api.post("/d6/leaves", leaveForm);
            setShowLeaveModal(false);
            setLeaveForm({ destination: "", reason: "", start_date: "", end_date: "" });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || "Failed to submit leave request");
        }
    };

    const handleLeaveDecision = async (leaveId, status) => {
        const comment = window.prompt(`Optional remark for ${status} decision:`, status === "Approved" ? "Permitted" : "Not permitted");
        if (comment === null) return;
        await api.patch(`/d6/leaves/${leaveId}`, { status, warden_comment: comment });
        fetchData();
    };

    const noticeBadge = {
        Urgent: "bg-rose-100 text-rose-800 border-rose-200",
        "Fee Reminder": "bg-amber-100 text-amber-800 border-amber-200",
        Event: "bg-indigo-100 text-indigo-800 border-indigo-200",
        General: "bg-slate-100 text-slate-700 border-slate-200",
    };

    const leaveBadge = {
        Pending: "bg-amber-100 text-amber-800",
        Approved: "bg-emerald-100 text-emerald-800",
        Rejected: "bg-rose-100 text-rose-800",
    };

    return (
        <div className="space-y-8">
        {/* SECTION 1: HOSTEL NOTICE BOARD */}
        <div className="space-y-4">
        <div className="flex items-center justify-between">
        <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <Megaphone className="w-6 h-6 text-indigo-600" />
        Hostel Notice Board
        </h2>
        <p className="text-sm text-slate-500">Official announcements, curfews, and fee reminders</p>
        </div>
        {isStaff && (
            <button
            onClick={() => setShowNoticeModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            >
            <Plus className="w-4 h-4" />
            Post Notice
            </button>
        )}
        </div>

        {notices.length === 0 ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-sm text-slate-500">
            No notices published yet.
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notices.map((n) => (
                <div
                key={n.notification_id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${noticeBadge[n.type] || noticeBadge.General}`}>
                {n.type}
                </span>
                <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                {new Date(n.sent_at).toLocaleDateString()}
                </span>
                {isStaff && (
                    <button
                    onClick={() => handleDeleteNotice(n.notification_id)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                    >
                    <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
                </div>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{n.title}</h3>
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{n.message}</p>
                </div>
                </div>
            ))}
            </div>
        )}
        </div>

        <hr className="border-slate-200" />

        {/* SECTION 2: STUDENT LEAVE REQUESTS */}
        <div className="space-y-4">
        <div className="flex items-center justify-between">
        <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
        <CalendarClock className="w-5 h-5 text-indigo-600" />
        {isStaff ? "Student Leave & Out-Pass Requests" : "My Leave Applications"}
        </h2>
        <p className="text-sm text-slate-500">
        {isStaff ? "Review and approve/reject student leave applications" : "Request hostel leave permission from the Warden"}
        </p>
        </div>
        {!isStaff && (
            <button
            onClick={() => setShowLeaveModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            >
            <Plus className="w-4 h-4" />
            Apply for Leave
            </button>
        )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {leaves.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No leave requests found.</div>
        ) : (
            <table className="w-full text-left border-collapse">
            <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
            {isStaff && <th className="py-3.5 px-4">Student</th>}
            <th className="py-3.5 px-4">Destination & Reason</th>
            <th className="py-3.5 px-4">Duration</th>
            <th className="py-3.5 px-4">Status & Warden Note</th>
            {isStaff && <th className="py-3.5 px-4 text-right">Decision</th>}
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
            {leaves.map((l) => (
                <tr key={l.leave_id} className="hover:bg-slate-50/80">
                {isStaff && (
                    <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900">{l.student?.name}</p>
                    <p className="text-xs text-indigo-600 font-mono">{l.student?.registration_no || l.student?.email}</p>
                    </td>
                )}
                <td className="py-3.5 px-4">
                <p className="font-semibold text-slate-900">{l.destination}</p>
                <p className="text-xs text-slate-500">{l.reason}</p>
                </td>
                <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                {l.start_date} &rarr; {l.end_date}
                </td>
                <td className="py-3.5 px-4">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${leaveBadge[l.status]}`}>
                {l.status}
                </span>
                {l.warden_comment && (
                    <p className="text-xs text-slate-500 mt-1 italic">"{l.warden_comment}"</p>
                )}
                </td>
                {isStaff && (
                    <td className="py-3.5 px-4 text-right">
                    {l.status === "Pending" ? (
                        <div className="inline-flex items-center gap-2">
                        <button
                        onClick={() => handleLeaveDecision(l.leave_id, "Approved")}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1"
                        >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                        onClick={() => handleLeaveDecision(l.leave_id, "Rejected")}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1"
                        >
                        <XCircle className="w-3.5 h-3.5" /> Reject
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
        </div>

        {/* Post Notice Modal */}
        {showNoticeModal && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Publish Hostel Notice</h3>
            <form onSubmit={handleCreateNotice} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
            <div>
            <label className="text-xs font-semibold text-slate-600">Notice Category</label>
            <select
            value={noticeForm.type}
            onChange={(e) => setNoticeForm({ ...noticeForm, type: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
            >
            <option value="General">General</option>
            <option value="Urgent">Urgent</option>
            <option value="Fee Reminder">Fee Reminder</option>
            <option value="Event">Event</option>
            </select>
            </div>
            <div>
            <label className="text-xs font-semibold text-slate-600">Target Audience</label>
            <select
            value={noticeForm.target_role}
            onChange={(e) => setNoticeForm({ ...noticeForm, target_role: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
            >
            <option value="All">All Hostel Residents</option>
            <option value="Student">Students Only</option>
            <option value="Warden">Wardens Only</option>
            </select>
            </div>
            </div>
            <div>
            <label className="text-xs font-semibold text-slate-600">Headline</label>
            <input
            type="text"
            required
            placeholder="e.g., Winter Hostel Gate Curfew Timings"
            value={noticeForm.title}
            onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
            </div>
            <div>
            <label className="text-xs font-semibold text-slate-600">Message Body</label>
            <textarea
            rows="3"
            required
            value={noticeForm.message}
            onChange={(e) => setNoticeForm({ ...noticeForm, message: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
            </div>
            <div className="flex justify-end gap-2 pt-2">
            <button
            type="button"
            onClick={() => setShowNoticeModal(false)}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
            Cancel
            </button>
            <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
            Publish Notice
            </button>
            </div>
            </form>
            </div>
            </div>
        )}

        {/* Apply Leave Modal */}
        {showLeaveModal && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Apply for Hostel Leave</h3>
            <form onSubmit={handleApplyLeave} className="space-y-3">
            <div>
            <label className="text-xs font-semibold text-slate-600">Destination Address / City</label>
            <input
            type="text"
            required
            placeholder="e.g., Home - Jaipur, Rajasthan"
            value={leaveForm.destination}
            onChange={(e) => setLeaveForm({ ...leaveForm, destination: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
            </div>
            <div className="grid grid-cols-2 gap-3">
            <div>
            <label className="text-xs font-semibold text-slate-600">Start Date</label>
            <input
            type="date"
            required
            value={leaveForm.start_date}
            onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
            </div>
            <div>
            <label className="text-xs font-semibold text-slate-600">Return Date</label>
            <input
            type="date"
            required
            value={leaveForm.end_date}
            onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
            </div>
            </div>
            <div>
            <label className="text-xs font-semibold text-slate-600">Reason for Leave</label>
            <textarea
            rows="3"
            required
            placeholder="Family function / Medical appointment / Weekend visit"
            value={leaveForm.reason}
            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
            </div>
            <div className="flex justify-end gap-2 pt-2">
            <button
            type="button"
            onClick={() => setShowLeaveModal(false)}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
            Cancel
            </button>
            <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
            Submit Request
            </button>
            </div>
            </form>
            </div>
            </div>
        )}
        </div>
    );
}
