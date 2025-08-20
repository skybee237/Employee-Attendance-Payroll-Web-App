import { useState, useEffect, useCallback } from "react";
import API from "../api";

const Attendance = ({ employeeId }) => {
  // State management
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({
    checkIn: false,
    checkOut: false
  });
  const [currentStatus, setCurrentStatus] = useState(null);
  const [filter, setFilter] = useState('all'); // all, today, week, month
  const [sortOrder, setSortOrder] = useState('desc'); // desc, asc

  // Enhanced error handling
  const handleError = (err, action) => {
    console.error(`Error ${action}:`, err);
    const message = err?.response?.data?.message || err?.message || `Error ${action}`;
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // Show success notification
  const showNotification = (message, type = "success") => {
    console.log(`${type.toUpperCase()}: ${message}`);
    // Consider integrating with a toast library like react-hot-toast
  };

  // Fetch attendance records with filtering
  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/attendance/${employeeId}`);
      let fetchedRecords = res.data || [];
      
      // Apply filtering
      const filteredRecords = filterRecords(fetchedRecords);
      
      // Apply sorting
      const sortedRecords = sortRecords(filteredRecords);
      
      setRecords(sortedRecords);
      
      // Determine current status
      const todayRecord = fetchedRecords.find(record => {
        const recordDate = new Date(record.checkInTime).toDateString();
        const today = new Date().toDateString();
        return recordDate === today;
      });
      
      setCurrentStatus({
        isCheckedIn: todayRecord && !todayRecord.checkOutTime,
        todayRecord: todayRecord,
        lastAction: todayRecord?.checkOutTime ? 'checked-out' : todayRecord ? 'checked-in' : 'none'
      });

      setError(null);
    } catch (err) {
      handleError(err, "fetching attendance records");
    } finally {
      setLoading(false);
    }
  }, [employeeId, filter, sortOrder]);

  // Filter records based on selected filter
  const filterRecords = (records) => {
    if (filter === 'all') return records;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return records.filter(record => {
      const recordDate = new Date(record.checkInTime);
      
      switch (filter) {
        case 'today':
          return recordDate >= today;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return recordDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          return recordDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  // Sort records
  const sortRecords = (records) => {
    return [...records].sort((a, b) => {
      const dateA = new Date(a.checkInTime);
      const dateB = new Date(b.checkInTime);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  };

  // Enhanced check-in with validation
  const handleCheckIn = async () => {
    if (currentStatus?.isCheckedIn) {
      setError("You are already checked in today!");
      return;
    }

    setActionLoading(prev => ({ ...prev, checkIn: true }));
    try {
      await API.post("/attendance/checkin", { employeeId });
      await fetchAttendance();
      showNotification("Successfully checked in!");
      setError(null);
    } catch (err) {
      handleError(err, "checking in");
    } finally {
      setActionLoading(prev => ({ ...prev, checkIn: false }));
    }
  };

  // Enhanced check-out with validation
  const handleCheckOut = async () => {
    if (!currentStatus?.isCheckedIn) {
      setError("You must check in first before checking out!");
      return;
    }

    setActionLoading(prev => ({ ...prev, checkOut: true }));
    try {
      await API.post("/attendance/checkout", { employeeId });
      await fetchAttendance();
      showNotification("Successfully checked out!");
      setError(null);
    } catch (err) {
      handleError(err, "checking out");
    } finally {
      setActionLoading(prev => ({ ...prev, checkOut: false }));
    }
  };

  // Calculate work duration
  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 'In progress';
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Format time for display
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = () => {
    if (!currentStatus) return null;
    
    const { isCheckedIn, lastAction } = currentStatus;
    
    if (isCheckedIn) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          🟢 Checked In
        </span>
      );
    } else if (lastAction === 'checked-out') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          ⚫ Checked Out
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          ⚪ Not Checked In
        </span>
      );
    }
  };

  // Calculate stats
  const getStats = () => {
    if (!records.length) return { totalDays: 0, totalHours: 0, avgHours: 0 };
    
    const completedRecords = records.filter(r => r.checkOutTime);
    const totalMs = completedRecords.reduce((sum, record) => {
      const start = new Date(record.checkInTime);
      const end = new Date(record.checkOutTime);
      return sum + (end - start);
    }, 0);
    
    const totalHours = totalMs / (1000 * 60 * 60);
    const avgHours = completedRecords.length ? totalHours / completedRecords.length : 0;
    
    return {
      totalDays: records.length,
      completedDays: completedRecords.length,
      totalHours: Math.round(totalHours * 10) / 10,
      avgHours: Math.round(avgHours * 10) / 10
    };
  };

  useEffect(() => {
    if (employeeId) {
      fetchAttendance();
    }
  }, [employeeId, fetchAttendance]);

  // Loading state
  if (loading && !records.length) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading attendance records...</span>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Attendance</h2>
          <div className="flex items-center space-x-3">
            {getStatusBadge()}
            {currentStatus?.todayRecord && (
              <span className="text-sm text-gray-600">
                Since {formatTime(currentStatus.todayRecord.checkInTime)}
              </span>
            )}
          </div>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={fetchAttendance}
          className="mt-4 sm:mt-0 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          disabled={loading}
        >
          🔄 {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-bold text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Total Days</p>
          <p className="text-2xl font-bold text-blue-800">{stats.totalDays}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Completed</p>
          <p className="text-2xl font-bold text-green-800">{stats.completedDays}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">Total Hours</p>
          <p className="text-2xl font-bold text-purple-800">{stats.totalHours}h</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-orange-600 font-medium">Avg Hours</p>
          <p className="text-2xl font-bold text-orange-800">{stats.avgHours}h</p>
        </div>
      </div>

      {/* Check In/Out Buttons */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCheckIn}
            disabled={actionLoading.checkIn || currentStatus?.isCheckedIn}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center ${
              currentStatus?.isCheckedIn
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : actionLoading.checkIn
                ? 'bg-green-400 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {actionLoading.checkIn ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Checking In...
              </>
            ) : (
              <>
                🟢 Check In
              </>
            )}
          </button>

          <button
            onClick={handleCheckOut}
            disabled={actionLoading.checkOut || !currentStatus?.isCheckedIn}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center ${
              !currentStatus?.isCheckedIn
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : actionLoading.checkOut
                ? 'bg-red-400 text-white cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {actionLoading.checkOut ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Checking Out...
              </>
            ) : (
              <>
                🔴 Check Out
              </>
            )}
          </button>
        </div>
        
        {currentStatus?.isCheckedIn && (
          <p className="mt-3 text-sm text-green-700 bg-green-50 p-2 rounded">
            💡 Don't forget to check out when you leave!
          </p>
        )}
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <label className="text-sm font-medium text-gray-700">Filter:</label>
            {['all', 'today', 'week', 'month'].map(filterOption => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort:</label>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors"
            >
              {sortOrder === 'desc' ? '↓ Newest First' : '↑ Oldest First'}
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">
            Attendance Records 
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({records.length} {records.length === 1 ? 'record' : 'records'})
            </span>
          </h3>
        </div>
        
        {records.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {records.map((record) => (
              <div key={record._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {formatDate(record.checkInTime)}
                      </h4>
                      {!record.checkOutTime && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Check-in:</span>
                        <br />
                        {formatTime(record.checkInTime)}
                      </div>
                      <div>
                        <span className="font-medium">Check-out:</span>
                        <br />
                        {record.checkOutTime ? formatTime(record.checkOutTime) : 'Not yet'}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>
                        <br />
                        <span className="font-medium text-blue-600">
                          {calculateDuration(record.checkInTime, record.checkOutTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <p className="text-gray-500 text-lg">No attendance records found</p>
            <p className="text-gray-400 text-sm mt-2">
              {filter === 'all' 
                ? "Start by checking in to create your first record!" 
                : `Try changing the filter to see more records.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;