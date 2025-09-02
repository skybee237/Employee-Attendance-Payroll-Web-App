import { useEffect, useState } from "react";
import API from "../api";
import { toast } from "react-toastify";

const AllRequests = ({ userRole, userId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [typeFilter, setTypeFilter] = useState("all"); // all, leave, justification, password

  const fetchAllRequests = async () => {
    try {
      setLoading(true);

      let leaves = [];
      let justifications = [];

      // Fetch data based on user role
      if (userRole === "admin") {
        // Admin can see all requests
        const [leavesRes, justificationsRes] = await Promise.all([
          API.get("/api/admin/leaves"),
          API.get("/api/admin/justifications")
        ]);
        leaves = leavesRes.data;
        justifications = justificationsRes.data;
      } else if (userRole === "superior") {
        // Superior can see subordinate requests
        const [leavesRes, justificationsRes] = await Promise.all([
          API.get(`/api/superior/leaves/${userId}`),
          API.get(`/api/superior/justifications/${userId}`)
        ]);
        leaves = leavesRes.data;
        justifications = justificationsRes.data;
      }

      // Combine all requests with type identifier
      const allRequests = [
        ...leaves.map(leave => ({
          ...leave,
          requestType: "leave",
          displayType: "Leave Request",
          title: leave.reason || "Leave Request",
          date: leave.createdAt || leave.startDate,
          details: `${leave.type || 'Leave'} from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()}`
        })),
        ...justifications.map(just => ({
          ...just,
          requestType: "justification",
          displayType: "Justification",
          title: just.reason || "Justification Request",
          date: just.createdAt || just.date,
          details: just.reason
        }))
      ];

      // Sort by date (most recent first)
      allRequests.sort((a, b) => new Date(b.date) - new Date(a.date));

      setRequests(allRequests);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const statusMatch = filter === "all" || request.status.toLowerCase() === filter;
    const typeMatch = typeFilter === "all" || request.requestType === typeFilter;
    return statusMatch && typeMatch;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case "Approved": return "text-green-600 bg-green-100";
      case "Rejected": return "text-red-600 bg-red-100";
      case "Pending": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case "leave": return "🏖️";
      case "justification": return "📝";
      default: return "📋";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (userId && userRole) {
      fetchAllRequests();
    }
  }, [userId, userRole]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
        <span className="text-gray-600 text-lg">Loading all requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">All Requests</h1>
        <button
          className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          onClick={fetchAllRequests}
        >
          <span className="mr-2">🔄</span> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="leave">Leave Requests</option>
              <option value="justification">Justifications</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No requests found for the selected filters.</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={`${request.requestType}-${request._id}`} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getTypeIcon(request.requestType)}</span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.employeeName || `Employee ${request.employeeId}`}
                      </h3>
                      <span className="text-sm text-gray-500">{request.displayType}</span>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{request.title}</p>
                    <p className="text-sm text-gray-500 mb-2">{request.details}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📅 {formatDate(request.date)}</span>
                      <span>🏢 ID: {request.employeeId}</span>
                    </div>
                  </div>
                </div>

                {/* Comments if available */}
                {request.comments && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Comments:</strong> {request.comments}
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
          <div className="text-2xl font-bold text-gray-800">{requests.length}</div>
          <div className="text-sm text-gray-600">Total Requests</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {requests.filter(r => r.status === "Pending").length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {requests.filter(r => r.status === "Approved").length}
          </div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {requests.filter(r => r.status === "Rejected").length}
          </div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>
    </div>
  );
};

export default AllRequests;
