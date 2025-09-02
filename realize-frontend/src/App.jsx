import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import API from "./api";

// Components
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SuperiorDashboard from "./pages/SuperiorDashboard";
import AdminSuperiorManagement from "./pages/AdminSuperiorManagement";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Justification from "./pages/Justification";
import CreateEmployee from "./pages/CreateEmployee";
import Reports from "./pages/Reports";
import JustificationsManagement from "./pages/JustificationsManagement";
import MyTeam from "./pages/MyTeam";
import SuperiorReports from "./pages/SuperiorReports";
import Profile from "./pages/Profile";
import SuperiorLeavesApproval from "./pages/SuperiorLeavesApproval";
import SuperiorJustificationsApproval from "./pages/SuperiorJustificationsApproval";
import AllRequests from "./pages/AllRequests";

function App() {
  const navigate = useNavigate();

  // State
  const [employeeId, setEmployeeId] = useState(localStorage.getItem("employeeId") || "");
  const [role, setRole] = useState(localStorage.getItem("userRole") || "");
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail") || "");
  const [profilePicture, setProfilePicture] = useState(localStorage.getItem("profilePicture") || null);

  const isAuthenticated = Boolean(role);

  /**
   * Sync state when localStorage changes (multi-tab support)
   */
  useEffect(() => {
    const handleStorageChange = () => {
      setEmployeeId(localStorage.getItem("employeeId") || "");
      setRole(localStorage.getItem("userRole") || "");
      setUserEmail(localStorage.getItem("userEmail") || "");
      setProfilePicture(localStorage.getItem("profilePicture") || null);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  /**
   * Fetch user profile when logged in
   */
  useEffect(() => {
    const fetchProfile = async () => {
      const currentRole = localStorage.getItem("userRole");
      const currentEmployeeId = localStorage.getItem("employeeId");
      const token = localStorage.getItem("token");

      if (currentRole && currentEmployeeId && token) {
        try {
          const { data } = await API.get("/api/auth/profile");
          setProfilePicture(data.profilePicture);
          localStorage.setItem("profilePicture", data.profilePicture || "");
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        }
      }
    };

    fetchProfile();
  }, []);

  /**
   * Handle logout
   */
  const handleLogout = () => {
    localStorage.clear();
    setEmployeeId("");
    setRole("");
    setUserEmail("");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <Login
            setEmployeeId={setEmployeeId}
            setRole={setRole}
            setUserEmail={setUserEmail}
          />
        }
      />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <div className="flex h-screen">
              {/* Sidebar */}
              <Sidebar userRole={role} userEmail={userEmail} />

              {/* Main Content */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Navbar */}
                <Navbar
                  userName={localStorage.getItem("userName") || "User"}
                  userRole={role}
                  userEmail={userEmail}
                  onLogout={handleLogout}
                  onProfile={handleProfile}
                />

                {/* Pages */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <main className="p-6">
                    <Routes>
                      {/* Dashboard (role-based) */}
                      <Route
                        path="/"
                        element={
                          role === "admin" ? (
                            <Navigate to="/admin" replace />
                          ) : role === "superior" ? (
                            <SuperiorDashboard superiorId={employeeId} />
                          ) : (
                            <Dashboard employeeId={employeeId} />
                          )
                        }
                      />

                      {/* Common Routes */}
                      <Route path="/attendance" element={<Attendance employeeId={employeeId} />} />
                      <Route path="/profile" element={<Profile employeeId={employeeId} />} />

                      {/* Employee Only */}
                      {role !== "admin" && (
                        <>
                          <Route path="/leave" element={<Leave employeeId={employeeId} />} />
                          <Route path="/justification" element={<Justification employeeId={employeeId} />} />
                        </>
                      )}

                      {/* Admin Only */}
                      {role === "admin" && (
                        <>
                          <Route path="/admin" element={<AdminDashboard />} />
                          <Route path="/create-employee" element={<CreateEmployee />} />
                          <Route path="/admin/superior-management" element={<AdminSuperiorManagement />} />
                          <Route path="/admin/reports" element={<Reports />} />
                          <Route path="/admin/justifications-management" element={<JustificationsManagement />} />
                          <Route path="/all-requests" element={<AllRequests userRole={role} userId={employeeId} />} />
                        </>
                      )}

                      {/* Superior Only */}
                      {role === "superior" && (
                        <>
                          <Route path="/superior/team" element={<MyTeam superiorId={employeeId} />} />
                          <Route path="/superior/reports" element={<SuperiorReports superiorId={employeeId} />} />
                          <Route path="/superior/leaves-approval" element={<SuperiorLeavesApproval superiorId={employeeId} />} />
                          <Route path="/superior/justifications-approval" element={<SuperiorJustificationsApproval superiorId={employeeId} />} />
                          <Route path="/all-requests" element={<AllRequests userRole={role} userId={employeeId} />} />
                        </>
                      )}

                      {/* Catch-all redirect */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
