import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import Card from "../components/Card";
import { toast } from "react-toastify";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    employeeCount: 0,
    pendingLeaves: 0,
    pendingJustifications: 0,
    activeEmployees: 0,
    onLeaveToday: 0,
    pendingPasswordRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [passwordRequests, setPasswordRequests] = useState([]);
  const [quickActions] = useState([
    { id: 1, title: "Create Employee", icon: "👥", path: "/create-employee", color: "blue" },
    { id: 2, title: "Manage Superior Requests", icon: "📋", path: "/admin/superior-management", color: "yellow" },
    { id: 3, title: "Process Justifications", icon: "📝", path: "/admin/justifications-management", color: "red" },
    { id: 4, title: "Password Requests", icon: "🔐", path: "#", color: "purple" },
    { id: 5, title: "Reports", icon: "📊", path: "/admin/reports", color: "green" }
  ]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Using Promise.all to fetch all data in parallel
      const [
        employeesRes,
        leavesRes,
        justificationsRes,
        attendanceRes,
        passwordRequestsRes
      ] = await Promise.all([
        API.get("/api/admin/employees"),
        API.get("/api/admin/leaves"),
        API.get("/api/admin/justifications"),
        API.get("/api/attendance/today/all"),
        API.get("/api/password/pending")
      ]);

      const employees = employeesRes.data;
      const leaves = leavesRes.data;
      const justifications = justificationsRes.data;
      const todayAttendance = attendanceRes.data;
      const passwordRequests = passwordRequestsRes.data;

      // Calculate active employees (those who checked in today)
      const activeEmployees = todayAttendance.filter(a => a.checkIn).length;
      
      // Calculate employees on leave today
      const today = new Date().toISOString().split('T')[0];
      const onLeaveToday = leaves.filter(l => 
        l.status === "Approved" && 
        today >= l.startDate && 
        today <= l.endDate
      ).length;

      setStats({
        employeeCount: employees.length,
        pendingLeaves: leaves.filter(l => l.status === "Pending").length,
        pendingJustifications: justifications.filter(j => j.status === "Pending").length,
        pendingPasswordRequests: passwordRequests.length,
        activeEmployees,
        onLeaveToday
      });

      setPasswordRequests(passwordRequests);

      // Get recent activities (last 5 actions)
      const activities = [
        ...leaves.map(l => ({
          type: "leave",
          id: l._id,
          employee: l.employeeName || `Employee ${l.employeeId}`,
          status: l.status,
          date: l.createdAt || l.startDate,
          action: `${l.status} leave request`
        })),
        ...justifications.map(j => ({
          type: "justification",
          id: j._id,
          employee: j.employeeName || `Employee ${j.employeeId}`,
          status: j.status,
          date: j.createdAt || new Date().toISOString(),
          action: `${j.status} justification`
        })),
        ...passwordRequests.map(p => ({
          type: "password",
          id: p._id,
          employee: p.employeeId?.name || `Employee ${p.employeeId}`,
          status: "Pending",
          date: p.createdAt || new Date().toISOString(),
          action: "Password reset request"
        }))
      ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

      setRecentActivities(activities);
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    if (action.path === "#") {
      // Scroll to password requests section
      const element = document.getElementById("password-requests-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      toast.info("Viewing password requests below");
    } else {
      toast.info(`Navigating to ${action.path}`);
      console.log("Navigating to:", action.path);
      navigate(action.path);
    }
  };

  const approvePasswordRequest = async (id) => {
    const newPassword = prompt("Enter new password for the employee:");
    if (!newPassword) return;

    try {
      await API.post("/password/approve", { requestId: id, newPassword });
      toast.success("Password reset approved!");
      fetchStats(); // refresh all data
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to approve request");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Approved": return "text-green-600 bg-green-100";
      case "Rejected": return "text-red-600 bg-red-100";
      case "Pending": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchStats();
    
    // Set up polling to refresh data every 2 minutes
    const intervalId = setInterval(fetchStats, 120000);
    
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
        <span className="text-gray-600 text-lg">Loading admin dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <button
          className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          onClick={fetchStats}
        >
          <span className="mr-2">🔄</span> Refresh
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all hover:shadow-md ${
                action.color === 'blue' ? 'border-blue-200 hover:bg-blue-50' :
                action.color === 'yellow' ? 'border-yellow-200 hover:bg-yellow-50' :
                action.color === 'red' ? 'border-red-200 hover:bg-red-50' :
                action.color === 'purple' ? 'border-purple-200 hover:bg-purple-50' :
                'border-green-200 hover:bg-green-50'
              }`}
              onClick={() => handleQuickAction(action)}
            >
              <span className="text-2xl mb-2">{action.icon}</span>
              <span className="font-medium text-center text-sm">{action.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card 
          title="Total Employees" 
          value={stats.employeeCount} 
          color="blue" 
          icon="👥"
          subtitle="Registered staff"
          size="small"
        />
        <Card 
          title="Active Today" 
          value={stats.activeEmployees} 
          color="green"
          icon="✅"
          subtitle="Checked in today"
          size="small"
        />
        <Card 
          title="On Leave" 
          value={stats.onLeaveToday} 
          color="purple"
          icon="🏖️"
          subtitle="On leave today"
          size="small"
        />
        <Card 
          title="Pending Leaves" 
          value={stats.pendingLeaves} 
          color="yellow"
          icon="📋"
          subtitle="Requiring review"
          size="small"
        />
        <Card 
          title="Pending Justifications" 
          value={stats.pendingJustifications} 
          color="red"
          icon="📝"
          subtitle="Requiring review"
          size="small"
        />
        <Card 
          title="Password Requests" 
          value={stats.pendingPasswordRequests} 
          color="purple"
          icon="🔐"
          subtitle="Reset requests"
          size="small"
        />
      </div>

      {/* Two Column Layout for Recent Activities and Password Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Activities</h2>
          
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No recent activities found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentActivities.map((activity) => (
                    <tr key={`${activity.type}-${activity.id}`} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {activity.employee}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {activity.action}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(activity.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Password Requests */}
        <div id="password-requests-section" className="bg-white rounded-lg shadow p-5">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Pending Password Requests</h2>
          
          {passwordRequests.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No pending password requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {passwordRequests.map((request) => (
                <div key={request._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{request.employeeId?.name || 'Employee'}</p>
                      <p className="text-sm text-gray-600">{request.employeeId?.email || 'No email'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Requested: {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <button
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                      onClick={() => approvePasswordRequest(request._id)}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Actions Summary */}
      {(stats.pendingLeaves > 0 || stats.pendingJustifications > 0 || stats.pendingPasswordRequests > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Attention Needed</h3>
          <div className="space-y-2">
            {stats.pendingLeaves > 0 && (
              <p className="text-yellow-700">
                You have <span className="font-semibold">{stats.pendingLeaves}</span> pending leave 
                request{stats.pendingLeaves !== 1 ? 's' : ''} that need review.
              </p>
            )}
            {stats.pendingJustifications > 0 && (
              <p className="text-yellow-700">
                You have <span className="font-semibold">{stats.pendingJustifications}</span> pending 
                justification{stats.pendingJustifications !== 1 ? 's' : ''} that need review.
              </p>
            )}
            {stats.pendingPasswordRequests > 0 && (
              <p className="text-yellow-700">
                You have <span className="font-semibold">{stats.pendingPasswordRequests}</span> pending 
                password reset request{stats.pendingPasswordRequests !== 1 ? 's' : ''}.
              </p>
            )}
            <button 
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              onClick={() => handleQuickAction({ path: "/all-requests" })}
            >
              Review All Pending Items
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
