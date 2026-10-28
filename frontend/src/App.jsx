import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import RoomsPage from "./pages/RoomsPage";
import UsersPage from "./pages/UsersPage";
import AllocationsPage from "./pages/AllocationsPage";
import FeesPage from "./pages/FeesPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import VisitorsPage from "./pages/VisitorsPage";
import LeavesNoticesPage from "./pages/LeavesNoticesPage";
import AdminReportsPage from "./pages/AdminReportsPage";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-slate-500">Loading session...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
    <Routes>
    <Route path="/login" element={<Login />} />
    <Route
    path="/"
    element={
      <ProtectedRoute>
      <Layout />
      </ProtectedRoute>
    }
    >
    <Route index element={<Navigate to="/rooms" replace />} />
    <Route path="rooms" element={<RoomsPage />} />
    <Route path="allocations" element={<AllocationsPage />} />
    <Route path="fees" element={<FeesPage />} />
    <Route path="users" element={<UsersPage />} />
    <Route path="complaints" element={<ComplaintsPage />} />
    <Route path="visitors" element={<VisitorsPage />} />
    <Route path="leaves-notices" element={<LeavesNoticesPage />} />
    <Route path="reports" element={<AdminReportsPage />} />
    </Route>
    </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}
