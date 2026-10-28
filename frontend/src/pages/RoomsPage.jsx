import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Plus, BedDouble, CheckCircle2, Wrench, Users, Trash2 } from "lucide-react";

export default function RoomsPage() {
  const { user } = useAuth();
  const canManage = user?.role === "Admin" || user?.role === "Warden";

  const [rooms, setRooms] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newRoom, setNewRoom] = useState({
    room_number: "",
    block: "Block A",
    type: "Double",
    capacity: 2,
    fee_per_semester: 25000,
    status: "Available",
  });

  const fetchRoomsAndSummary = async () => {
    const params = {};
    if (filterType) params.room_type = filterType;
    if (filterStatus) params.status_filter = filterStatus;

    const [roomsRes, summaryRes] = await Promise.all([
      api.get("/rooms/", { params }),
      api.get("/rooms/summary"),
    ]);
    setRooms(roomsRes.data);
    setSummary(summaryRes.data);
  };

  useEffect(() => {
    fetchRoomsAndSummary();
  }, [filterType, filterStatus]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post("/rooms/", newRoom);
      setShowModal(false);
      setNewRoom({ room_number: "", block: "Block A", type: "Double", capacity: 2, fee_per_semester: 25000, status: "Available" });
      fetchRoomsAndSummary();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to add room");
    }
  };

  const handleStatusToggle = async (room, nextStatus) => {
    await api.patch(`/rooms/${room.room_id}`, { status: nextStatus });
    fetchRoomsAndSummary();
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Delete this room permanently?")) return;
    await api.delete(`/rooms/${roomId}`);
    fetchRoomsAndSummary();
  };

  const badgeStyle = {
    Available: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Full: "bg-rose-100 text-rose-800 border-rose-200",
    Maintenance: "bg-amber-100 text-amber-800 border-amber-200",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hostel Room Inventory</h2>
          <p className="text-sm text-slate-500">
            Real-time room availability, capacity tracking, and block status
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add New Room
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
              <BedDouble className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Total Rooms</p>
              <p className="text-2xl font-bold text-slate-900">{summary.total_rooms}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Available Rooms</p>
              <p className="text-2xl font-bold text-slate-900">{summary.available_rooms}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Bed Occupancy</p>
              <p className="text-2xl font-bold text-slate-900">
                {summary.total_occupied} / {summary.total_capacity}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Under Maintenance</p>
              <p className="text-2xl font-bold text-slate-900">{summary.maintenance_rooms}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
        >
          <option value="">All Room Types</option>
          <option value="Single">Single</option>
          <option value="Double">Double</option>
          <option value="Triple">Triple</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
        >
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Full">Full</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {rooms.map((room) => (
          <div
            key={room.room_id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs font-semibold uppercase text-indigo-600">{room.block}</span>
                  <h3 className="text-lg font-bold text-slate-900">Room {room.room_number}</h3>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${badgeStyle[room.status]}`}>
                  {room.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-slate-600 my-4">
                <div className="flex justify-between">
                  <span>Room Type:</span>
                  <span className="font-semibold text-slate-800">{room.type} Sharing</span>
                </div>
                <div className="flex justify-between">
                  <span>Occupancy:</span>
                  <span className="font-semibold text-slate-800">
                    {room.current_occupancy} / {room.capacity} Beds
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Semester Fee:</span>
                  <span className="font-semibold text-emerald-700">
                    ₹{Number(room.fee_per_semester).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Occupancy Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                <div
                  className="bg-indigo-600 h-full transition-all"
                  style={{ width: `${Math.min(100, (room.current_occupancy / room.capacity) * 100)}%` }}
                />
              </div>
            </div>

            {canManage && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <select
                  value={room.status}
                  onChange={(e) => handleStatusToggle(room, e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-slate-50 font-medium"
                >
                  <option value="Available">Set Available</option>
                  <option value="Full">Set Full</option>
                  <option value="Maintenance">Set Maintenance</option>
                </select>

                {user?.role === "Admin" && (
                  <button
                    onClick={() => handleDeleteRoom(room.room_id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition"
                    title="Delete Room"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Room Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Add New Hostel Room</h3>
            <form onSubmit={handleCreateRoom} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Room Number</label>
                  <input
                    type="text"
                    required
                    placeholder="A-104"
                    value={newRoom.room_number}
                    onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Hostel Block</label>
                  <input
                    type="text"
                    required
                    value={newRoom.block}
                    onChange={(e) => setNewRoom({ ...newRoom, block: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Sharing Type</label>
                  <select
                    value={newRoom.type}
                    onChange={(e) => {
                      const type = e.target.value;
                      const cap = type === "Single" ? 1 : type === "Double" ? 2 : 3;
                      setNewRoom({ ...newRoom, type, capacity: cap });
                    }}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="Single">Single (1 Bed)</option>
                    <option value="Double">Double (2 Beds)</option>
                    <option value="Triple">Triple (3 Beds)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Fee / Semester (₹)</label>
                  <input
                    type="number"
                    required
                    value={newRoom.fee_per_semester}
                    onChange={(e) => setNewRoom({ ...newRoom, fee_per_semester: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
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
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
