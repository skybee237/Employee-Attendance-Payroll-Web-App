import React from "react";
import "./App.css";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SuperiorDashboard from "./pages/SuperiorDashboard";
import Attendance from "./components/Attendance";
import Leave from "./pages/Leave";
import Justification from "./pages/Justification";
import Login from "./pages/Login";
import CreateEmployee from "./pages/CreateEmployee";

function App() {
  const employeeId = "64e6c123abc456def789012"; // replace with real ID from login
  const role = "admin"; // "employee" or "superior" or "admin"

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <div className="flex">
              <Sidebar />
              <div className="flex-1">
                <Navbar />
                <main className="p-6">
                  <Routes>
                    {/* Role-based root dashboard */}
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

                    <Route path="/attendance" element={<Attendance employeeId={employeeId} />} />
                    <Route path="/leave" element={<Leave employeeId={employeeId} />} />
                    <Route path="/justification" element={<Justification employeeId={employeeId} />} />

                    {/* Admin only */}
                    {role === "admin" && (
                      <Route path="/create-employee" element={<CreateEmployee />} />
                    )}

                    {/* Redirect unknown routes */}
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </main>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
