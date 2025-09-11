import { useEffect, useState } from "react";
import API from "../api";
import { toast } from "react-toastify";

const ManageEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // suspend, delete, reinstate, update
  const [suspensionReason, setSuspensionReason] = useState("");
  const [updateData, setUpdateData] = useState({
    name: "",
    email: "",
    role: "",
    salary: "",
    superiorId: ""
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/admin/employees");
      setEmployees(response.data);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (employee, action) => {
    setSelectedEmployee(employee);
    setModalType(action);
    setShowModal(true);

    if (action === "update") {
      setUpdateData({
        name: employee.name,
        email: employee.email,
        role: employee.role,
        salary: employee.salary,
        superiorId: employee.superiorId ? employee.superiorId._id : ""
      });
    }
  };

  const executeAction = async () => {
    try {
      let response;
      switch (modalType) {
        case "suspend":
          response = await API.put(`/api/admin/employee/suspend/${selectedEmployee._id}`, {
            reason: suspensionReason
          });
          toast.success("Employee suspended successfully");
          break;
        case "delete":
          if (window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
            response = await API.delete(`/api/admin/employee/delete/${selectedEmployee._id}`);
            toast.success("Employee deleted successfully");
          } else {
            return;
          }
          break;
        case "reinstate":
          response = await API.put(`/api/admin/employee/reinstate/${selectedEmployee._id}`);
          toast.success("Employee reinstated successfully");
          break;
        case "update":
          response = await API.put(`/api/admin/employee/update/${selectedEmployee._id}`, updateData);
          toast.success("Employee updated successfully");
          break;
        default:
          return;
      }

      setShowModal(false);
      setSuspensionReason("");
      fetchEmployees();
    } catch (err) {
      console.error("Action failed:", err);
      toast.error(err.response?.data?.error || "Action failed");
    }
  };

  const getStatusBadge = (employee) => {
    if (!employee.isActive) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Inactive</span>;
    }
    if (employee.isSuspended) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Suspended</span>;
    }
    if (employee.reinstatedAt) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Reinstated</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
        <span className="text-gray-600 text-lg">Loading employees...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Manage Employees</h1>
        <button
          className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          onClick={fetchEmployees}
        >
          <span className="mr-2">🔄</span> Refresh
        </button>
      </div>

      {/* Employees List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Employee Accounts</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">{employee.role}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(employee)}
                    {employee.isSuspended && employee.suspensionReason && (
                      <div className="text-xs text-gray-500 mt-1">
                        Reason: {employee.suspensionReason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(employee.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => handleAction(employee, "update")}
                      >
                        Edit
                      </button>
                      {!employee.isSuspended && employee.isActive ? (
                        <button
                          className="text-yellow-600 hover:text-yellow-900"
                          onClick={() => handleAction(employee, "suspend")}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          className="text-green-600 hover:text-green-900"
                          onClick={() => handleAction(employee, "reinstate")}
                        >
                          Reinstate
                        </button>
                      )}
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleAction(employee, "delete")}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {employees.length === 0 && (
          <div className="text-center py-8 bg-gray-50">
            <p className="text-gray-500">No employees found.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {modalType === "suspend" && "Suspend Employee"}
                {modalType === "delete" && "Delete Employee"}
                {modalType === "reinstate" && "Reinstate Employee"}
                {modalType === "update" && "Update Employee"}
              </h3>

              {modalType === "suspend" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suspension Reason
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    placeholder="Enter reason for suspension..."
                  />
                </div>
              )}

              {modalType === "update" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={updateData.name}
                      onChange={(e) => setUpdateData({...updateData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={updateData.email}
                      onChange={(e) => setUpdateData({...updateData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={updateData.role}
                      onChange={(e) => setUpdateData({...updateData, role: e.target.value})}
                    >
                      <option value="employee">Employee</option>
                      <option value="superior">Superior</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={updateData.salary}
                      onChange={(e) => setUpdateData({...updateData, salary: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Superior</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={updateData.superiorId}
                      onChange={(e) => setUpdateData({...updateData, superiorId: e.target.value})}
                    >
                      <option value="">No Superior</option>
                      {employees
                        .filter(emp => emp.role === 'superior')
                        .map(superior => (
                          <option key={superior._id} value={superior._id}>
                            {superior.name} ({superior.email})
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={`px-4 py-2 text-white rounded-md ${
                    modalType === "delete" ? "bg-red-600 hover:bg-red-700" :
                    modalType === "suspend" ? "bg-yellow-600 hover:bg-yellow-700" :
                    modalType === "reinstate" ? "bg-green-600 hover:bg-green-700" :
                    "bg-blue-600 hover:bg-blue-700"
                  }`}
                  onClick={executeAction}
                >
                  {modalType === "suspend" && "Suspend"}
                  {modalType === "delete" && "Delete"}
                  {modalType === "reinstate" && "Reinstate"}
                  {modalType === "update" && "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEmployees;
