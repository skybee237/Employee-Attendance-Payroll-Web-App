import { useEffect, useState } from "react";
import API from "../api";
import { toast } from "react-toastify";

const SuperiorLeavesApproval = ({ superiorId }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // pending, approved, rejected, all

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/superior/leaves/${superiorId}`);
      setLeaves(response.data);
    } catch (err) {
      console.error("Failed to fetch subordinate leaves:", err);
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (leaveId, newStatus) => {
    try {
      const response = await API.put(`/api/superior/approve-leave/${superiorId}/${leaveId}`, {
        status: newStatus
      });
      toast.success(response.data.message);
      fetchLeaves(); // Refresh the list
    } catch (err) {
      console.error("Failed to update leave status:", err);
      toast.error("Failed to update leave status");
    }
  };

  const filteredLeaves = leaves.filter(leave => {
    if (filter === "all") return true;
    return leave.status.toLowerCase() === filter;
  });

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
      year: 'numeric'
    });
  };

  useEffect(() => {
    if (superiorId) {
      fetchLeaves();
    }
  }, [superiorId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
        <span className="text-gray-600 text-lg">Loading leave requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Leave Requests Approval</h1>
        <button
          className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          onClick={fetchLeaves}
        >
          <span className="mr-2">🔄</span> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex space-x-4 mb-4">
          {["pending", "approved", "rejected", "all"].map((status) => (
            <button
              key={status}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== "all" && (
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-white bg-opacity-20">
                  {leaves.filter(l => l.status.toLowerCase() === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Leaves List */}
        <div className="space-y-4">
          {filteredLeaves.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No leave requests found for the selected filter.</p>
            </div>
          ) : (
            filteredLeaves.map((leave) => (
              <div key={leave._id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {leave.employeeName || `Employee ${leave.employeeId}`}
                      </h3>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{leave.reason}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>🏖️ {leave.type || 'Leave'}</span>
                      <span>📅 From: {formatDate(leave.startDate)}</span>
                      <span>📅 To: {formatDate(leave.endDate)}</span>
                      <span>📝 Submitted: {formatDate(leave.createdAt)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {leave.status === "Pending" && (
                    <div className="flex space-x-2">
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        onClick={() => handleStatusUpdate(leave._id, "Approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        onClick={() => handleStatusUpdate(leave._id, "Rejected")}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Details */}
                {leave.comments && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Comments:</strong> {leave.comments}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{leaves.length}</div>
          <div className="text-sm text-gray-600">Total Requests</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {leaves.filter(l => l.status === "Pending").length}
          </div>
          <div className="text-sm text-gray-600">Pending Review</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {leaves.filter(l => l.status === "Approved").length}
          </div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {leaves.filter(l => l.status === "Rejected").length}
          </div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>
    </div>
  );
};

export default SuperiorLeavesApproval;
