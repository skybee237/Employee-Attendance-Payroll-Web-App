import { useState, useEffect, useCallback } from "react";
import API from "../api";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const Leave = ({ employeeId, canRequestLeave = true }) => {
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState({ 
    startDate: "", 
    endDate: "", 
    reason: "",
    leaveType: "Annual" 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    used: 0,
    remaining: 0,
    total: 0
  });

  // Leave types configuration
  const leaveTypes = [
    { value: "Annual", label: "Annual Leave" },
    { value: "Sick", label: "Sick Leave" },
    { value: "Maternity", label: "Maternity Leave" },
    { value: "Paternity", label: "Paternity Leave" },
    { value: "Unpaid", label: "Unpaid Leave" },
    { value: "Other", label: "Other" },
  ];

  // Memoized fetch function
  const fetchLeaves = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [leavesRes, statsRes] = await Promise.all([
        API.get(`/leave/${employeeId}`),
        API.get(`/leave/stats/${employeeId}`)
      ]);
      
      setLeaves(leavesRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError("Failed to fetch leave data. Please try again.");
      toast.error("Failed to fetch leave data");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  // Calculate business days between two dates (excluding weekends)
  const calculateBusinessDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    let count = 0;
    
    // Adjust to include both start and end dates
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  };

  // Form validation
  const validateForm = () => {
    if (!form.startDate || !form.endDate || !form.reason.trim() || !form.leaveType) {
      return "All fields are required";
    }
    
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    
    if (start > end) {
      return "End date must be after start date";
    }
    
    // Check if start date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return "Start date cannot be in the past";
    }
    
    // Check if the selected dates overlap with existing approved leaves
    const hasOverlap = leaves.some(leave => 
      leave.status === "Approved" && 
      ((new Date(leave.startDate) <= end && new Date(leave.endDate) >= start))
    );
    
    if (hasOverlap) {
      return "Selected dates overlap with an approved leave request";
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Calculate duration
      const duration = calculateBusinessDays(form.startDate, form.endDate);
      
      await API.post("/leave", { 
        employeeId, 
        ...form,
        duration
      });
      
      toast.success("Leave request submitted successfully");
      setForm({ startDate: "", endDate: "", reason: "", leaveType: "Annual" });
      await fetchLeaves();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to submit leave request";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm("Are you sure you want to cancel this leave request?")) {
      return;
    }

    try {
      await API.delete(`/leave/${leaveId}`);
      toast.success("Leave request cancelled successfully");
      await fetchLeaves();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to cancel leave request";
      toast.error(message);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Leave Management</h2>

      {/* Leave Statistics */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Leave Balance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.used}</p>
            <p className="text-gray-600">Days Used</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-700">{stats.remaining}</p>
            <p className="text-gray-600">Days Remaining</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
            <p className="text-gray-600">Total Allowance</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Leave Request Form */}
      {canRequestLeave && (
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <h3 className="text-lg font-semibold mb-4">Request New Leave</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Leave Type</label>
                <select
                  value={form.leaveType}
                  onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                  className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                >
                  {leaveTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration</label>
                <div className="border p-2 rounded bg-gray-50">
                  {form.startDate && form.endDate ? (
                    <span className="font-medium">
                      {calculateBusinessDays(form.startDate, form.endDate)} business days
                    </span>
                  ) : (
                    <span className="text-gray-500">Select dates to calculate duration</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                  min={form.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please provide details for your leave request"
                required
                disabled={isSubmitting}
                rows={4}
              />
            </div>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Leave Request"}
            </button>
          </form>
        </div>
      )}

      {/* Leave History */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Leave History</h3>
        
        {isLoading && !leaves.length ? (
          <div className="text-center py-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading leave requests...</p>
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            No leave requests found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.map((leave) => (
                  <tr key={leave._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {leave.leaveType || 'Annual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {leave.duration || calculateBusinessDays(leave.startDate, leave.endDate)} days
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{leave.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          leave.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : leave.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {leave.status === "Pending" && (
                        <button
                          onClick={() => handleCancelLeave(leave._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

Leave.propTypes = {
  employeeId: PropTypes.string.isRequired,
  canRequestLeave: PropTypes.bool,
};

export default Leave;