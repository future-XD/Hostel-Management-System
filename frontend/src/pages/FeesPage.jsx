import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { CreditCard, Receipt, CheckCircle2, Clock, Printer } from "lucide-react";

export default function FeesPage() {
    const { user } = useAuth();
    const isStaff = user?.role === "Warden" || user?.role === "Admin";

    const [fees, setFees] = useState([]);
    const [payingFee, setPayingFee] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("UPI (GPay / PhonePe)");
    const [receiptModal, setReceiptModal] = useState(null);

    const fetchFees = async () => {
        const res = await api.get("/fees/");
        setFees(res.data);
    };

    useEffect(() => {
        fetchFees();
    }, []);

    const handleConfirmPayment = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post(`/fees/${payingFee.payment_id}/pay`, {
                payment_method: paymentMethod,
            });
            setPayingFee(null);
            fetchFees();
            setReceiptModal(res.data);
        } catch (err) {
            alert(err.response?.data?.detail || "Payment failed");
        }
    };

    return (
        <div className="space-y-6">
        <div>
        <h2 className="text-2xl font-bold text-slate-900">Hostel Fee Payments & Receipts</h2>
        <p className="text-sm text-slate-500">
        {isStaff
            ? "Monitor student semester fee collections and verify generated receipts"
            : "Pay your allocated room semester fees and download official receipts"}
            </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {fees.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                No fee invoices generated yet. Invoices are automatically created when a room is allocated.
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <th className="py-3.5 px-4">Reference / Receipt</th>
                {isStaff && <th className="py-3.5 px-4">Student</th>}
                <th className="py-3.5 px-4">Room & Semester</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                {fees.map((f) => (
                    <tr key={f.payment_id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-indigo-600">
                    {f.receipt_number}
                    </td>
                    {isStaff && (
                        <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{f.student?.name}</p>
                        <p className="text-xs text-slate-400">{f.student?.registration_no || f.student?.email}</p>
                        </td>
                    )}
                    <td className="py-3.5 px-4">
                    <p className="font-medium text-slate-800">
                    Room {f.allocation?.room?.room_number || "Assigned"}
                    </p>
                    <p className="text-xs text-slate-400">{f.allocation?.semester}</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                    ₹{Number(f.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                    {f.status === "Paid" ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid ({f.payment_method})
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold">
                        <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                    )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                    {f.status === "Pending" ? (
                        <button
                        onClick={() => setPayingFee(f)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
                        >
                        <CreditCard className="w-3.5 h-3.5" />
                        Pay Now
                        </button>
                    ) : (
                        <button
                        onClick={() => setReceiptModal(f)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                        >
                        <Receipt className="w-3.5 h-3.5" />
                        View Receipt
                        </button>
                    )}
                    </td>
                    </tr>
                ))}
                </tbody>
                </table>
            )}
            </div>

            {/* Payment Checkout Modal */}
            {payingFee && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900">Pay Semester Hostel Fee</h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-sm">
                <div className="flex justify-between">
                <span className="text-slate-500">Invoice Ref:</span>
                <span className="font-mono font-semibold">{payingFee.receipt_number}</span>
                </div>
                <div className="flex justify-between">
                <span className="text-slate-500">Total Payable:</span>
                <span className="text-lg font-bold text-emerald-700">
                ₹{Number(payingFee.amount).toLocaleString("en-IN")}
                </span>
                </div>
                </div>

                <form onSubmit={handleConfirmPayment} className="space-y-4">
                <div>
                <label className="text-xs font-semibold uppercase text-slate-600">Select Payment Method</label>
                <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full mt-1 px-3.5 py-2 border rounded-lg text-sm bg-white"
                >
                <option value="UPI (GPay / PhonePe)">UPI (GPay / PhonePe / Paytm)</option>
                <option value="NetBanking">NetBanking (SBI / HDFC / ICICI)</option>
                <option value="Debit / Credit Card">Debit / Credit Card</option>
                </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                <button
                type="button"
                onClick={() => setPayingFee(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                Cancel
                </button>
                <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                >
                Confirm & Pay ₹{Number(payingFee.amount).toLocaleString("en-IN")}
                </button>
                </div>
                </form>
                </div>
                </div>
            )}

            {/* Printable Official Fee Receipt Modal */}
            {receiptModal && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl border-t-8 border-indigo-600">
                <div className="flex items-center justify-between border-b pb-4">
                <div>
                <h3 className="text-xl font-bold text-slate-900">OFFICIAL FEE RECEIPT</h3>
                <p className="text-xs text-slate-500">HostelHub Residential Management System</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                PAID
                </span>
                </div>

                <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                <span className="text-slate-500">Receipt Number:</span>
                <span className="font-mono font-bold text-indigo-600">{receiptModal.receipt_number}</span>
                </div>
                <div className="flex justify-between">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-semibold">{receiptModal.student?.name || user?.name}</span>
                </div>
                <div className="flex justify-between">
                <span className="text-slate-500">Registration No:</span>
                <span className="font-mono">{receiptModal.student?.registration_no || user?.registration_no || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-medium">{receiptModal.payment_method}</span>
                </div>
                <div className="flex justify-between">
                <span className="text-slate-500">Payment Timestamp:</span>
                <span>{new Date(receiptModal.paid_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-3 border-t text-base font-bold text-slate-900">
                <span>Amount Received:</span>
                <span className="text-emerald-700">₹{Number(receiptModal.amount).toLocaleString("en-IN")}</span>
                </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                <Printer className="w-4 h-4" />
                Print Receipt
                </button>
                <button
                onClick={() => setReceiptModal(null)}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                Close
                </button>
                </div>
                </div>
                </div>
            )}
            </div>
    );
}
