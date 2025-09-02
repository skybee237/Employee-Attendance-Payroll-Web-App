import { useEffect, useState } from "react";
import API from "../api";
import { toast } from "react-toastify";

const AdminSuperiorManagement = () => {
  const [activeTab, setActiveTab] = useState("leaves");
  const [leaveDemands, setLeaveDemands] = useState([]);
  const [justifications, setJustifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const fetchSuperiorData = async () => {
    try {
      setLoading(true);
      const [leavesRes, justificationsRes] = await Promise.all([
        API.get("/api/admin/superior/leave-demands"),
        API.get("/api/admin/superior/justifications")
      ]);

      setLeaveDemands(leavesRes.data);
      setJustifications(justificationsRes.data);
    } catch (err) {
      toast.error("Failed to fetch superior data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const processLeaveDemand = async (leaveId, status) => {
    setProcessing(true);
    try {
      const response = await API.put(`/api/admin/superior/leave-demand/${leaveId}`, {
        status,
        adminNotes
      });
      toast.success(response.data.message);
      setAdminNotes("");
      fetchSuperiorData(); // Refresh data
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to process leave demand");
    } finally {
      setProcessing(false);
    }
  };

  const processJustification = async (justificationId, status) => {
    setProcessing(true);
    try {
      const response = await API.put(`/api/admin/superior/justification/${justificationId}`, {
        status,
        adminNotes
      });
      toast.success(response.data.message);
      setAdminNotes("");
      fetchSuperiorData(); // Refresh data
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to process justification");
    } finally {
      setProcessing(false);
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    fetchSuperiorData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
        <span className="text-gray-600 text-lg">Loading superior management data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Superior Management</h1>
        <button
          className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          onClick={fetchSuperiorData}
        >
          <span className="mr-2">🔄</span> Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex space-x-4 border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "leaves"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("leaves")}
          >
            Leave Demands ({leaveDemands.length})
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "justifications"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("justifications")}
          >
            Justifications ({justifications.length})
          </button>
        </div>
      </div>

      {/* Admin Notes Input */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Admin Notes</h3>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Add notes for your decision..."
          className="w-full p-3 border rounded-lg"
          rows="3"
        />
      </div>

      {/* Leave Demands Tab */}
      {activeTab === "leaves" && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Superior Leave Demands</h2>
          </div>
          {leaveDemands.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No leave demands from superiors
            </div>
          ) : (
            <div className="divide-y">
              {leaveDemands.map((leave) => (
                <div key={leave._id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {leave.superiorId?.name || `Superior ${leave.superiorId}`}
                      </h3>
                      <p className="text-gray-600">{leave.superiorId?.email}</p>
                      <p className="mt-2 text-sm">
                        <strong>Period:</strong> {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
                      </p>
                      <p className="text-sm">
                        <strong>Reason:</strong> {leave.reason}
                      </p>
                      {leave.adminNotes && (
                        <p className="text-sm text-gray-500 mt-1">
                          <strong>Admin Notes:</strong> {leave.adminNotes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(leave.status)}`}>
                        {leave.status}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(leave.createdAt)}</span>
                      {leave.status === "Pending" && (
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => processLeaveDemand(leave._id, "Approved")}
                            disabled={processing}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => processLeaveDemand(leave._id, "Rejected")}
                            disabled={processing}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Justifications Tab */}
      {activeTab === "justifications" && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Superior Justifications</h2>
          </div>
          {justifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No justifications from superiors
            </div>
          ) : (
            <div className="divide-y">
              {justifications.map((justification) => (
                <div key={justification._id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {justification.superiorId?.name || `Superior ${justification.superiorId}`}
                      </h3>
                      <p className="text-gray-600">{justification.superiorId?.email}</p>
                      <p className="mt-2">
                        <strong>Reason:</strong> {justification.reason}
                      </p>
                      {justification.adminNotes && (
                        <p className="text-sm text-gray-500 mt-1">
                          <strong>Admin Notes:</strong> {justification.adminNotes}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(justification.status)}`}>
                        {justification.status}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(justification.createdAt)}</span>
                      {justification.status === "Pending" && (
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => processJustification(justification._id, "Approved")}
                            disabled={processing}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => processJustification(justification._id, "Rejected")}
                            disabled={processing}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSuperiorManagement;
