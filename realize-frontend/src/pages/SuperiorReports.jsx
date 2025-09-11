import { useState, useEffect } from "react";
import API from "../api";
import Card from "../components/Card";
import { toast } from "react-toastify";
import jsPDF from "jspdf";


const SuperiorReports = ({ superiorId }) => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    subordinates: [],
    leaveStats: [],
    justificationStats: [],
    attendanceStats: []
  });

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch data using superior-specific endpoints
      const [
        subordinatesRes,
        leavesRes,
        justificationsRes,
        attendanceRes
      ] = await Promise.all([
        API.get(`/api/superior/subordinates/${superiorId}`),
        API.get(`/api/superior/leaves/${superiorId}`),
        API.get(`/api/superior/justifications/${superiorId}`),
        API.get("/api/attendance/today/all")
      ]);

      const subordinates = subordinatesRes.data;
      const leaves = leavesRes.data;
      const justifications = justificationsRes.data;
      const attendance = attendanceRes.data;

      // Get subordinate IDs for filtering
      const subordinateIds = subordinates.map(s => s._id);

      // Process subordinate statistics
      const subordinateStats = subordinates.map(sub => ({
        id: sub._id,
        name: sub.name,
        email: sub.email,
        position: sub.position || 'Not specified',
        department: sub.department || 'No department',
        totalAttendance: attendance.filter(a => a.employeeId === sub._id).length,
        totalLeaves: leaves.filter(l => l.employeeId === sub._id).length,
        totalJustifications: justifications.filter(j => j.employeeId === sub._id).length
      }));

      // Process leave statistics by type
      const leaveStats = leaves.reduce((acc, leave) => {
        const type = leave.type || 'Regular';
        if (!acc[type]) {
          acc[type] = { type, count: 0, approved: 0, rejected: 0, pending: 0 };
        }
        acc[type].count++;
        if (leave.status === 'Approved') acc[type].approved++;
        else if (leave.status === 'Rejected') acc[type].rejected++;
        else acc[type].pending++;
        return acc;
      }, {});

      // Process justification statistics
      const justificationStats = justifications.reduce((acc, just) => {
        const status = just.status || 'Pending';
        if (!acc[status]) {
          acc[status] = { status, count: 0 };
        }
        acc[status].count++;
        return acc;
      }, {});

      // Process attendance statistics for subordinates
      const attendanceStats = attendance
        .filter(a => subordinateIds.includes(a.employeeId))
        .reduce((acc, record) => {
          const date = new Date(record.checkIn).toISOString().split('T')[0];
          if (!acc[date]) {
            acc[date] = { date, totalCheckIns: 0, totalCheckOuts: 0 };
          }
          acc[date].totalCheckIns++;
          if (record.checkOut) acc[date].totalCheckOuts++;
          return acc;
        }, {});

      setReportData({
        subordinates: subordinateStats,
        leaveStats: Object.values(leaveStats),
        justificationStats: Object.values(justificationStats),
        attendanceStats: Object.values(attendanceStats)
      });

    } catch (err) {
      console.error("Failed to fetch superior report data:", err);
      toast.error("Failed to load team report data");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(value =>
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    ).join('\n');

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  const exportToPDF = (data, filename, title) => {
    if (!data || data.length === 0) {
      toast.warning("No data to export");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    const headers = [Object.keys(data[0])];
    const rows = data.map(row => Object.values(row));

    // AutoTable plugin can be used if available, else manual table
    if (doc.autoTable) {
      doc.autoTable({
        head: headers,
        body: rows,
        startY: 30,
      });
    } else {
      // Simple manual table rendering
      let y = 30;
      headers[0].forEach((header, i) => {
        doc.text(header.toString(), 14 + i * 40, y);
      });
      y += 10;
      rows.forEach(row => {
        row.forEach((cell, i) => {
          doc.text(cell ? cell.toString() : '', 14 + i * 40, y);
        });
        y += 10;
      });
    }

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("Report exported successfully as PDF");
  };

  useEffect(() => {
    if (superiorId) {
      fetchReportData();
    }
  }, [superiorId]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
        <span className="text-gray-600 text-lg">Loading team reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Team Reports & Analytics</h1>
        <button
          className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          onClick={fetchReportData}
        >
          <span className="mr-2">🔄</span> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          title="Team Members"
          value={reportData.subordinates.length}
          color="blue"
          icon="👥"
          subtitle="Direct reports"
        />
        <Card
          title="Total Attendance"
          value={reportData.attendanceStats.reduce((sum, stat) => sum + stat.totalCheckIns, 0)}
          color="green"
          icon="✅"
          subtitle="Check-ins recorded"
        />
        <Card
          title="Leave Requests"
          value={reportData.leaveStats.reduce((sum, stat) => sum + stat.count, 0)}
          color="yellow"
          icon="🏖️"
          subtitle="Total requests"
        />
        <Card
          title="Justifications"
          value={reportData.justificationStats.reduce((sum, stat) => sum + stat.count, 0)}
          color="purple"
          icon="📝"
          subtitle="Submitted"
        />
      </div>

      {/* Team Member Performance Report */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Team Member Performance</h2>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            onClick={() => exportToCSV(reportData.subordinates, 'team_performance')}
          >
            Export CSV
          </button>
          <button
            className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            onClick={() => exportToPDF(reportData.subordinates, 'team_performance', 'Team Member Performance')}
          >
            Export PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Team Member</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Leaves</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Justifications</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.subordinates.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {member.name}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {member.position}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {member.department}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {member.totalAttendance}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {member.totalLeaves}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {member.totalJustifications}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Attendance Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Team Attendance Trends</h2>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            onClick={() => exportToCSV(reportData.attendanceStats, 'team_attendance_trends')}
          >
            Export CSV
          </button>
          <button
            className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            onClick={() => exportToPDF(reportData.attendanceStats, 'team_attendance_trends', 'Team Attendance Trends')}
          >
            Export PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check-ins</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.attendanceStats.slice(0, 10).map((stat) => (
                <tr key={stat.date} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(stat.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {stat.totalCheckIns}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {stat.totalCheckOuts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Leave Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Team Leave Statistics</h2>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            onClick={() => exportToCSV(reportData.leaveStats, 'team_leave_statistics')}
          >
            Export CSV
          </button>
          <button
            className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            onClick={() => exportToPDF(reportData.leaveStats, 'team_leave_statistics', 'Team Leave Statistics')}
          >
            Export PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rejected</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.leaveStats.map((stat) => (
                <tr key={stat.type} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {stat.type}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {stat.count}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600">
                    {stat.approved}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600">
                    {stat.rejected}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-yellow-600">
                    {stat.pending}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperiorReports;
