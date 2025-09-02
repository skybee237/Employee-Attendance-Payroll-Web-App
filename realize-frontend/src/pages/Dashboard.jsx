import { useEffect, useState, useCallback } from "react";
import API from "../api";
import Card from "../components/Card";
import { toast } from "react-toastify";

const Dashboard = ({ employeeId }) => {
  // State management
  const [stats, setStats] = useState({
    attendanceCount: 0,
    leaveCount: 0,
    justificationCount: 0
  });
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [isOvertime, setIsOvertime] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({
    overtime: false,
    leave: false,
    justification: false
  });
  const [quickActions, setQuickActions] = useState([
    { id: 1, title: "Request Leave", icon: "📅", action: "leave", color: "blue" },
    { id: 2, title: "Justify Time", icon: "📝", action: "justification", color: "yellow" },
    { id: 3, title: "Start Overtime", icon: "⏰", action: "overtime", color: "red" },
  ]);

  // Enhanced error handling
  const handleError = (err, action) => {
    console.error(`Error ${action}:`, err);
    const message = err?.response?.data?.message || err?.message || `Error ${action}`;
    setError(message);
    toast.error(message);
    setTimeout(() => setError(null), 5000); // Auto-clear error after 5s
  };

  // Success notification
  const handleSuccess = (message) => {
    toast.success(message);
    setError(null);
  };

  // Fetch summary stats with better error handling
  const fetchStats = useCallback(async () => {
    try {
      const [attendanceRes, leavesRes, justificationsRes] = await Promise.allSettled([
        API.get(`/api/attendance/${employeeId}`),
        API.get(`/api/leave/${employeeId}`),
        API.get(`/api/justification/${employeeId}`)
      ]);

      setStats({
        attendanceCount: attendanceRes.status === 'fulfilled' ? (attendanceRes.value.data?.length || 0) : 0,
        leaveCount: leavesRes.status === 'fulfilled' ? (leavesRes.value.data?.length || 0) : 0,
        justificationCount: justificationsRes.status === 'fulfilled' ? (justificationsRes.value.data?.length || 0) : 0
      });
    } catch (err) {
      handleError(err, "fetching statistics");
    }
  }, [employeeId]);

  // Fetch today's attendance with improved logic
  const fetchTodayAttendance = useCallback(async () => {
    try {
      const res = await API.get(`/api/attendance/${employeeId}`);
      if (res.data) {
        setTodayAttendance(res.data);

        // More robust overtime detection
        const now = new Date();
        const expectedEnd = new Date(res.data.expectedEnd);
        const hasCheckedOut = res.data.checkOut || res.data.overtimeCheckedOut;

        setIsOvertime(now > expectedEnd && !hasCheckedOut && !res.data.overtimeStarted);
      } else {
        setTodayAttendance(null);
        setIsOvertime(false);
      }
    } catch (err) {
      handleError(err, "fetching today's attendance");
    }
  }, [employeeId]);

  // Enhanced overtime check-in with loading state
  const handleOvertimeCheckIn = async () => {
    setActionLoading(prev => ({ ...prev, overtime: true }));
    try {
      await API.post(`/api/attendance/overtime/${employeeId}`);
      await fetchTodayAttendance();
      handleSuccess("Overtime started successfully!");
    } catch (err) {
      handleError(err, "starting overtime");
    } finally {
      setActionLoading(prev => ({ ...prev, overtime: false }));
    }
  };

  // Enhanced leave request with modal form
  const handleLeaveRequest = async () => {
    // Create a modal for leave request
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 class="text-xl font-semibold mb-4">Request Leave</h3>
        <textarea 
          id="leaveReason" 
          placeholder="Please provide details for your leave request (minimum 10 characters)" 
          class="w-full p-3 border rounded-lg mb-4" 
          rows="4"
        ></textarea>
        <div class="flex justify-end space-x-3">
          <button id="cancelLeave" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          <button id="submitLeave" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Submit</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Wait for user action
    return new Promise((resolve) => {
      modal.querySelector('#cancelLeave').onclick = () => {
        document.body.removeChild(modal);
        resolve(false);
      };
      
      modal.querySelector('#submitLeave').onclick = () => {
        const reason = modal.querySelector('#leaveReason').value.trim();
        
        if (!reason) {
          toast.error("Leave reason is required");
          return;
        }
        
        if (reason.length < 10) {
          toast.error("Please provide a more detailed reason (minimum 10 characters)");
          return;
        }
        
        document.body.removeChild(modal);
        resolve(reason);
      };
    }).then(async (reason) => {
      if (!reason) return;
      
      setActionLoading(prev => ({ ...prev, leave: true }));
      try {
        await API.post(`/api/leave/${employeeId}`, { reason });
        await fetchStats();
        handleSuccess("Leave request submitted successfully!");
      } catch (err) {
        handleError(err, "submitting leave request");
      } finally {
        setActionLoading(prev => ({ ...prev, leave: false }));
      }
    });
  };

  // Enhanced justification with modal form
  const handleJustification = async () => {
    // Create a modal for justification
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 class="text-xl font-semibold mb-4">Justify Absence/Late</h3>
        <textarea 
          id="justificationReason" 
          placeholder="Please provide details for your justification (minimum 10 characters)" 
          class="w-full p-3 border rounded-lg mb-4" 
          rows="4"
        ></textarea>
        <div class="flex justify-end space-x-3">
          <button id="cancelJustification" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          <button id="submitJustification" class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">Submit</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Wait for user action
    return new Promise((resolve) => {
      modal.querySelector('#cancelJustification').onclick = () => {
        document.body.removeChild(modal);
        resolve(false);
      };
      
      modal.querySelector('#submitJustification').onclick = () => {
        const reason = modal.querySelector('#justificationReason').value.trim();
        
        if (!reason) {
          toast.error("Justification reason is required");
          return;
        }
        
        if (reason.length < 10) {
          toast.error("Please provide a more detailed justification (minimum 10 characters)");
          return;
        }
        
        document.body.removeChild(modal);
        resolve(reason);
      };
    }).then(async (reason) => {
      if (!reason) return;
      
      setActionLoading(prev => ({ ...prev, justification: true }));
      try {
        await API.post(`/api/justification/${employeeId}`, { reason });
        await fetchStats();
        handleSuccess("Justification submitted successfully!");
      } catch (err) {
        handleError(err, "submitting justification");
      } finally {
        setActionLoading(prev => ({ ...prev, justification: false }));
      }
    });
  };

  // Format time display
  const formatTime = (timeString) => {
    if (!timeString) return "Not yet";
    try {
      return new Date(timeString).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return timeString;
    }
  };

  // Calculate work duration
  const getWorkDuration = () => {
    if (!todayAttendance?.checkIn) return null;
    
    const checkIn = new Date(todayAttendance.checkIn);
    const checkOut = todayAttendance.checkOut 
      ? new Date(todayAttendance.checkOut) 
      : new Date();
    
    const diffMs = checkOut - checkIn;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  // Handle quick actions
  const handleQuickAction = (action) => {
    switch(action) {
      case 'leave':
        handleLeaveRequest();
        break;
      case 'justification':
        handleJustification();
        break;
      case 'overtime':
        handleOvertimeCheckIn();
        break;
      default:
        console.warn('Unknown action:', action);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchTodayAttendance()]);
      setLoading(false);
    };

    if (employeeId) {
      loadData();
    }
  }, [employeeId, fetchStats, fetchTodayAttendance]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
        <span className="text-gray-600 text-lg">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Employee Dashboard</h1>
        <button
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          onClick={() => {
            setLoading(true);
            Promise.all([fetchStats(), fetchTodayAttendance()]).finally(() => setLoading(false));
          }}
        >
          <span className="mr-2">🔄</span> Refresh
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 text-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-all hover:shadow-md ${
                actionLoading[action.action] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${
                action.color === 'blue' ? 'border-blue-200 hover:bg-blue-50' :
                action.color === 'yellow' ? 'border-yellow-200 hover:bg-yellow-50' :
                'border-red-200 hover:bg-red-50'
              }`}
              onClick={() => handleQuickAction(action.action)}
              disabled={actionLoading[action.action]}
            >
              <span className="text-2xl mb-2">{action.icon}</span>
              <span className="font-medium">{action.title}</span>
              {actionLoading[action.action] && (
                <div className="mt-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mx-auto"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          title="Attendance Records" 
          value={stats.attendanceCount} 
          color="green" 
          subtitle="Total records"
          icon="📊"
          size="medium"
        />
        <Card 
          title="Leave Requests" 
          value={stats.leaveCount} 
          color="blue"
          subtitle="Submitted requests" 
          icon="📅"
          size="medium"
        />
        <Card 
          title="Justifications" 
          value={stats.justificationCount} 
          color="yellow"
          subtitle="Submitted justifications"
          icon="📝"
          size="medium"
        />
      </div>

      {/* Today's Attendance */}
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Today's Attendance</h3>
        
        {todayAttendance ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Check-in</p>
                <p className="text-lg font-medium text-green-600">
                  {formatTime(todayAttendance.checkIn)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Check-out</p>
                <p className={`text-lg font-medium ${todayAttendance.checkOut ? 'text-red-600' : 'text-gray-400'}`}>
                  {formatTime(todayAttendance.checkOut)}
                </p>
              </div>
            </div>
            
            {getWorkDuration() && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Work Duration</p>
                <p className="text-lg font-medium text-blue-600">{getWorkDuration()}</p>
              </div>
            )}

            {isOvertime && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-orange-800 text-sm mb-3">
                  You're past your expected end time. Would you like to start overtime?
                </p>
                <button
                  className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center ${
                    actionLoading.overtime ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={handleOvertimeCheckIn}
                  disabled={actionLoading.overtime}
                >
                  {actionLoading.overtime ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting...
                    </>
                  ) : (
                    'Start Overtime'
                  )}
                </button>
              </div>
            )}

            {todayAttendance.overtimeStarted && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  ⏰ Overtime session active since {formatTime(todayAttendance.overtimeStart)}
                </p>
                {todayAttendance.overtimeDuration && (
                  <p className="text-red-800 text-sm mt-1">
                    Duration: {todayAttendance.overtimeDuration} hours
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No attendance recorded today.</p>
          </div>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              <span className="text-green-600">📊</span>
            </div>
            <div>
              <p className="font-medium">Attendance recorded</p>
              <p className="text-sm text-gray-500">Today at {formatTime(todayAttendance?.checkIn)}</p>
            </div>
          </div>
          
          {stats.leaveCount > 0 && (
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <span className="text-blue-600">📅</span>
              </div>
              <div>
                <p className="font-medium">Leave requests</p>
                <p className="text-sm text-gray-500">{stats.leaveCount} total requests</p>
              </div>
            </div>
          )}
          
          {stats.justificationCount > 0 && (
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="bg-yellow-100 p-2 rounded-full mr-3">
                <span className="text-yellow-600">📝</span>
              </div>
              <div>
                <p className="font-medium">Justifications</p>
                <p className="text-sm text-gray-500">{stats.justificationCount} submitted</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;