import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import Tasks from "./pages/Tasks";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Users from "./pages/Users";
import EmployeeReviews from "./pages/EmployeeReviews";
import PendingApprovals from "./pages/PendingApprovals";
import VidQueryPopup from "./components/VidQueryPopup";

/* Show VidQuery only on authenticated pages */
function VidQueryOverlay() {
  const location = useLocation();
  const publicRoutes = ["/", "/login", "/register"];
  if (publicRoutes.includes(location.pathname)) return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  return <VidQueryPopup />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public ── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Protected (any authenticated user) ── */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/tasks"     element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/teams"     element={<ProtectedRoute><Teams /></ProtectedRoute>} />

        {/* ── Admin only ── */}
        <Route path="/users"     element={<AdminRoute><Users /></AdminRoute>} />
        <Route path="/reviews"   element={<AdminRoute><EmployeeReviews /></AdminRoute>} />
        <Route path="/approvals" element={<AdminRoute><PendingApprovals /></AdminRoute>} />

      </Routes>

      {/* Global VidQuery popup — floats over all authenticated pages */}
      <VidQueryOverlay />
    </BrowserRouter>
  );
}

export default App;