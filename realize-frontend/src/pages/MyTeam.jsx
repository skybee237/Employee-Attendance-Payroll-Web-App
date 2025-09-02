import { useEffect, useState } from "react";
import API from "../api";
import Card from "../components/Card";
import { toast } from "react-toastify";

const MyTeam = ({ superiorId }) => {
  const [subordinates, setSubordinates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubordinates = async () => {
      try {
        const response = await API.get(`/api/superior/subordinates/${superiorId}`);
        setSubordinates(response.data);
      } catch (err) {
        console.error("Failed to fetch subordinates:", err);
        toast.error("Failed to load team data");
      } finally {
        setLoading(false);
      }
    };

    if (superiorId) {
      fetchSubordinates();
    }
  }, [superiorId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
        <span className="text-gray-600 text-lg">Loading team members...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">My Team</h1>
        <div className="text-sm text-gray-600">
          Total Members: {subordinates.length}
        </div>
      </div>

      {subordinates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No team members assigned to you.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Team Members</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
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
                      <div className="text-sm text-gray-900">
                        {subordinate.position || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {subordinate.department || 'No department'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subordinate.phone || 'No phone number'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          title="Total Members"
          value={subordinates.length}
          color="blue"
          icon="👥"
          subtitle="Direct reports"
          size="small"
        />
        <Card
          title="Active Members"
          value={subordinates.length} // Assuming all are active for now
          color="green"
          icon="✅"
          subtitle="Currently active"
          size="small"
        />
        <Card
          title="Departments"
          value={new Set(subordinates.map(s => s.department).filter(d => d)).size}
          color="purple"
          icon="🏢"
          subtitle="Different departments"
          size="small"
        />
      </div>
    </div>
  );
};

export default MyTeam;
