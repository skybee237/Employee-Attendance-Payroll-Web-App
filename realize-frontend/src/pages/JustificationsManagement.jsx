import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import API from "../api";
import { toast } from "react-toastify";

const JustificationsManagement = () => {
  const [justifications, setJustifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const location = useLocation();

  const fetchJustifications = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/admin/justifications");
      setJustifications(response.data);
    } catch (err) {
      console.error("Failed to fetch justifications:", err);
      toast.error("Failed to load justifications");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (justificationId, newStatus) => {
    try {
      await API.put(`/api/justification/${justificationId}/status`, { status: newStatus });
      toast.success(`Justification ${newStatus.toLowerCase()} successfully`);
      fetchJustifications(); // Refresh the list
    } catch (err) {
      console.error("Failed to update justification:", err);
      toast.error("Failed to update justification status");
    }
  };

  const filteredJustifications = justifications.filter(justification => {
    if (filter === "all") return true;
    return justification.status.toLowerCase() === filter;
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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchJustifications();
  }, []);

  useEffect(() => {
    if (location.pathname === '/justification/pending') {
      setFilter('pending');
    } else if (location.pathname === '/justification/history') {
      setFilter('approved');
    } else {
      setFilter('all');
    }
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
        <span className="text-gray-600 text-lg">Loading justifications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Justifications Management</h1>
        <button
          className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          onClick={fetchJustifications}
        >
          <span className="mr-2">🔄</span> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex space-x-4 mb-4">
          {["all", "pending", "approved", "rejected"].map((status) => (
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
                  {justifications.filter(j => j.status.toLowerCase() === status).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Justifications List */}
        <div className="space-y-4">
          {filteredJustifications.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No justifications found for the selected filter.</p>
            </div>
          ) : (
            filteredJustifications.map((justification) => (
              <div key={justification._id} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {justification.employeeId?.name || `Employee ${justification.employeeId}`}
                      </h3>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(justification.status)}`}>
                        {justification.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{justification.reason}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📅 {formatDate(justification.createdAt)}</span>
                      <span>🏢 {justification.employeeId?._id || justification.employeeId}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {justification.status === "Pending" && (
                    <div className="flex space-x-2">
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        onClick={() => handleStatusUpdate(justification._id, "Approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        onClick={() => handleStatusUpdate(justification._id, "Rejected")}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Details */}
                {justification.additionalInfo && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Additional Information:</strong> {justification.additionalInfo}
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
          <div className="text-2xl font-bold text-gray-800">{justifications.length}</div>
          <div className="text-sm text-gray-600">Total Justifications</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {justifications.filter(j => j.status === "Pending").length}
          </div>
          <div className="text-sm text-gray-600">Pending Review</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {justifications.filter(j => j.status === "Approved").length}
          </div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {justifications.filter(j => j.status === "Rejected").length}
          </div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>
    </div>
  );
};

export default JustificationsManagement;
