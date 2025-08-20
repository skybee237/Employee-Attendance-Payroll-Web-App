import { useEffect, useState } from "react";
import API from "../api";
import Card from "../components/Card";
import { toast } from "react-toastify";

const SuperiorDashboard = ({ superiorId }) => {
  const [subordinates, setSubordinates] = useState([]);
  const [stats, setStats] = useState({
    pendingLeaves: 0,
    pendingJustifications: 0,
    activeSubordinates: 0,
    onLeaveToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentRequests, setRecentRequests] = useState([]);
  const [quickActions] = useState([
    { id: 1, title: "Approve Leaves", icon: "✅", path: "/superior/leaves", color: "green" },
    { id: 2, title: "Review Justifications", icon: "📝", path: "/superior/justifications", color: "yellow" },
    { id: 3, title: "Team Overview", icon: "👥", path: "/superior/team", color: "blue" },
    { id: 4, title: "Team Reports", icon: "📊", path: "/superior/reports", color: "purple" }
  ]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all necessary data in parallel
      const [employeesRes, leavesRes, justificationsRes, attendanceRes] = await Promise.all([
        API.get("/admin/employees"),
        API.get("/leave"),
        API.get("/justification"),
        API.get("/attendance/today")
      ]);

      const allEmployees = employeesRes.data;
      const allLeaves = leavesRes.data;
      const allJustifications = justificationsRes.data;
      const todayAttendance = attendanceRes.data;

      // Filter subordinates
      const subs = allEmployees.filter(e => e.superiorId === superiorId);
      setSubordinates(subs);

      // Get subordinate IDs for filtering
      const subordinateIds = subs.map(s => s._id);

      // Calculate pending requests from subordinates
      const pendingLeavesCount = allLeaves.filter(
        l => l.status === "Pending" && subordinateIds.includes(l.employeeId)
      ).length;

      const pendingJustificationsCount = allJustifications.filter(
        j => j.status === "Pending" && subordinateIds.includes(j.employeeId)
      ).length;

      // Calculate active subordinates today
      const activeSubordinates = todayAttendance.filter(a => 
        a.checkIn && subordinateIds.includes(a.employeeId)
      ).length;

      // Calculate subordinates on leave today
      const today = new Date().toISOString().split('T')[0];
      const onLeaveToday = allLeaves.filter(l => 
        subordinateIds.includes(l.employeeId) &&
        l.status === "Approved" && 
        today >= l.startDate && 
        today <= l.endDate
      ).length;

      setStats({
        pendingLeaves: pendingLeavesCount,
        pendingJustifications: pendingJustificationsCount,
        activeSubordinates,
        onLeaveToday
      });

      // Get recent requests from subordinates (last 5)
      const recentSubordinateRequests = [
        ...allLeaves
          .filter(l => subordinateIds.includes(l.employeeId))
          .map(l => ({
            type: "leave",
            id: l._id,
            employee: allEmployees.find(e => e._id === l.employeeId)?.name || `Employee ${l.employeeId}`,
            status: l.status,
            date: l.createdAt || l.startDate,
            action: "leave request",
            details: `${l.leaveType || 'Leave'} from ${new Date(l.startDate).toLocaleDateString()} to ${new Date(l.endDate).toLocaleDateString()}`
          })),
        ...allJustifications
          .filter(j => subordinateIds.includes(j.employeeId))
          .map(j => ({
            type: "justification",
            id: j._id,
            employee: allEmployees.find(e => e._id === j.employeeId)?.name || `Employee ${j.employeeId}`,
            status: j.status,
            date: j.createdAt || new Date().toISOString(),
            action: "justification submission",
            details: j.reason ? j.reason.substring(0, 50) + (j.reason.length > 50 ? "..." : "") : "No reason provided"
          }))
      ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

      setRecentRequests(recentSubordinateRequests);
    } catch (err) {
      console.error("Failed to fetch superior dashboard data:", err);
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    toast.info(`Navigating to ${action.path}`);
    console.log("Navigating to:", action.path);
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
  }, [superiorId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
        <span className="text-gray-600 text-lg">Loading team dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Team Management Dashboard</h1>
        <button
          className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          onClick={fetchStats}
        >
          <span className="mr-2">🔄</span> Refresh
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Team Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all hover:shadow-md ${
                action.color === 'green' ? 'border-green-200 hover:bg-green-50' :
                action.color === 'yellow' ? 'border-yellow-200 hover:bg-yellow-50' :
                action.color === 'blue' ? 'border-blue-200 hover:bg-blue-50' :
                'border-purple-200 hover:bg-purple-50'
              }`}
              onClick={() => handleQuickAction(action)}
            >
              <span className="text-2xl mb-2">{action.icon}</span>
              <span className="font-medium text-center">{action.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Team Stats Overview */}
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          title="Team Members" 
          value={subordinates.length} 
          color="blue" 
          icon="👥"
          subtitle="Direct reports"
          size="small"
        />
        <Card 
          title="Active Today" 
          value={stats.activeSubordinates} 
          color="green"
          icon="✅"
          subtitle="Checked in today"
          size="small"
        />
        <Card 
          title="Pending Leaves" 
          value={stats.pendingLeaves} 
          color="yellow"
          icon="📋"
          subtitle="Awaiting approval"
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
      </div>

      {/* Team Overview */}
      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Team Overview</h2>
        
        {subordinates.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No team members assigned to you.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subordinates.map((subordinate) => (
                  <tr key={subordinate._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {subordinate.name ? subordinate.name.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {subordinate.name || `Employee ${subordinate._id}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subordinate.email || 'No email provided'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subordinate.position || 'Not specified'}</div>
                      <div className="text-sm text-gray-500">{subordinate.department || 'No department'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subordinate.phone || 'No phone number'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Team Requests */}
      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Team Requests</h2>
        
        {recentRequests.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No recent requests from your team.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentRequests.map((request) => (
              <div key={`${request.type}-${request.id}`} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{request.employee}</h3>
                    <p className="text-sm text-gray-600 capitalize">{request.action}</p>
                    <p className="text-sm text-gray-500 mt-1">{request.details}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">{formatDate(request.date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Actions Alert */}
      {(stats.pendingLeaves > 0 || stats.pendingJustifications > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Action Required</h3>
          <div className="space-y-2">
            {stats.pendingLeaves > 0 && (
              <p className="text-yellow-700">
                You have <span className="font-semibold">{stats.pendingLeaves}</span> pending leave 
                request{stats.pendingLeaves !== 1 ? 's' : ''} from your team that need review.
              </p>
            )}
            {stats.pendingJustifications > 0 && (
              <p className="text-yellow-700">
                You have <span className="font-semibold">{stats.pendingJustifications}</span> pending 
                justification{stats.pendingJustifications !== 1 ? 's' : ''} from your team that need review.
              </p>
            )}
            <div className="flex space-x-3">
              {stats.pendingLeaves > 0 && (
                <button 
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                  onClick={() => handleQuickAction({ path: "/superior/leaves" })}
                >
                  Review Leaves
                </button>
              )}
              {stats.pendingJustifications > 0 && (
                <button 
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                  onClick={() => handleQuickAction({ path: "/superior/justifications" })}
                >
                  Review Justifications
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperiorDashboard;