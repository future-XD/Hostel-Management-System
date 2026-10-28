import { useState, useEffect } from "react";
import api from "../api/axios";
import { BarChart3, IndianRupee, BedDouble, ShieldAlert, Users, RefreshCw } from "lucide-react";

export default function AdminReportsPage() {
    const [report, setReport] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchReport = async (force = false) => {
        setRefreshing(true);
        const res = await api.get("/reports/operational-summary", { forceRefresh: force });
        setReport(res.data);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchReport(false);
    }, []);

    if (!report) {
        return <div className="p-8 text-sm text-slate-500">Generating operational summary...</div>;
    }

    return (
        <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-indigo-600" />
        System Operational Summary & Reports
        </h2>
        <p className="text-sm text-slate-500">
        DFD Process 7.0: Real-time occupancy, fee revenue, pending workflows, and escalated complaints
        </p>
        </div>
        <button
        onClick={() => fetchReport(true)}
        className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition"
        >
        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
        Refresh Live Data
        </button>
        </div>

        {/* Top Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between text-emerald-600 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fee Revenue Collected</span>
        <IndianRupee className="w-5 h-5" />
        </div>
        <p className="text-2xl font-bold text-slate-900">
        ₹{report.finance.revenue_collected.toLocaleString("en-IN")}
        </p>
        <p className="text-xs text-amber-600 mt-1 font-medium">
        ₹{report.finance.pending_dues.toLocaleString("en-IN")} pending ({report.finance.pending_invoices} invoices)
        </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between text-indigo-600 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hostel Occupancy Rate</span>
        <BedDouble className="w-5 h-5" />
        </div>
        <p className="text-2xl font-bold text-slate-900">{report.accommodation.occupancy_rate}%</p>
        <p className="text-xs text-slate-500 mt-1">
        {report.accommodation.total_occupied} / {report.accommodation.total_capacity} beds • {report.accommodation.active_waitlist} on waitlist
        </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between text-blue-600 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Users</span>
        <Users className="w-5 h-5" />
        </div>
        <p className="text-2xl font-bold text-slate-900">{report.users.total_users}</p>
        <p className="text-xs text-slate-500 mt-1">
        {report.users.students} Students • {report.users.wardens} Wardens
        </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between text-rose-600 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Action Items</span>
        <ShieldAlert className="w-5 h-5" />
        </div>
        <p className="text-2xl font-bold text-slate-900">
        {report.operations.open_complaints + report.operations.pending_leaves + report.accommodation.pending_applications}
        </p>
        <p className="text-xs text-slate-500 mt-1">
        {report.accommodation.pending_applications} Apps • {report.operations.pending_leaves} Leaves • {report.operations.open_complaints} Complaints
        </p>
        </div>
        </div>

        {/* Unresolved Escalations Table (DFD 5.0 -> 7.0 Flow) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/50">
        <div>
        <h3 className="font-bold text-rose-950 flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-rose-600" />
        Unresolved Escalations (From Warden / Process 5.0)
        </h3>
        <p className="text-xs text-rose-700">
        High-priority room damage or maintenance issues escalated to System Administration
        </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
        {report.operations.escalated_count} Escalated
        </span>
        </div>

        {report.operations.unresolved_escalations.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
            No unresolved escalations at this time. All critical issues are under control.
            </div>
        ) : (
            <table className="w-full text-left border-collapse">
            <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
            <th className="py-3 px-4">Log ID</th>
            <th className="py-3 px-4">Room & Category</th>
            <th className="py-3 px-4">Issue Title</th>
            <th className="py-3 px-4">Damage Severity</th>
            <th className="py-3 px-4">Warden Remarks</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
            {report.operations.unresolved_escalations.map((esc) => (
                <tr key={esc.log_id}>
                <td className="py-3 px-4 font-mono text-xs text-rose-600 font-bold">#LOG-{esc.log_id}</td>
                <td className="py-3 px-4 font-medium">
                Room {esc.room_number} ({esc.category})
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900">{esc.title}</td>
                <td className="py-3 px-4">
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-xs">
                {esc.damage_severity ?? "N/A"} / 5
                </span>
                </td>
                <td className="py-3 px-4 text-xs text-slate-600">{esc.warden_remarks || "Escalated for admin review"}</td>
                </tr>
            ))}
            </tbody>
            </table>
        )}
        </div>
        </div>
    );
}
