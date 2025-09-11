import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { toast } from "react-toastify";
import jsPDF from "jspdf";

const Payroll = () => {
  const navigate = useNavigate();
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/payroll/all", {
        params: { year: selectedYear, month: selectedMonth }
      });
      let data = response.data;
      if (selectedEmployees.length > 0) {
        data = data.filter(emp => selectedEmployees.includes(emp.employeeId));
      }
      setPayrollData(data);
    } catch (err) {
      console.error("Failed to fetch payroll data:", err);
      toast.error("Failed to load payroll data");
      setPayrollData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployees(prev => {
      let newSelected;
      if (prev.includes(employeeId)) {
        newSelected = prev.filter(id => id !== employeeId);
      } else {
        newSelected = [...prev, employeeId];
      }
      // Update selectAll state based on whether all employees are selected
      setSelectAll(newSelected.length === payrollData.length && payrollData.length > 0);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees([]);
      setSelectAll(false);
    } else {
      setSelectedEmployees(payrollData.map(emp => emp.employeeId));
      setSelectAll(true);
    }
  };

  const exportToCSV = () => {
    let dataToExport = payrollData;
    if (selectedEmployees.length > 0) {
      dataToExport = payrollData.filter(emp => selectedEmployees.includes(emp.employeeId));
    }

    if (!dataToExport || dataToExport.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const headers = [
      "Employee Name",
      "Role",
      "Base Salary",
      "Hours Worked",
      "Expected Hours",
      "Absence Hours",
      "Deductions",
      "Net Salary"
    ];

    const rows = dataToExport.map(row => [
      row.employeeName,
      row.role,
      row.baseSalary,
      row.totalHoursWorked,
      row.expectedHours,
      row.absenceHours,
      row.deductions,
      row.netSalary
    ]);

    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${selectedYear}_${selectedMonth}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`${dataToExport.length} employee(s) payroll report exported successfully`);
  };

  const exportToPDF = () => {
    let dataToExport = payrollData;
    if (selectedEmployees.length > 0) {
      dataToExport = payrollData.filter(emp => selectedEmployees.includes(emp.employeeId));
    }

    if (!dataToExport || dataToExport.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Payroll Report - ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    const headers = [
      ["Employee Name", "Role", "Base Salary", "Hours Worked", "Deductions", "Net Salary"]
    ];

    const rows = dataToExport.map(row => [
      row.employeeName,
      row.role,
      `$${row.baseSalary.toLocaleString()}`,
      row.totalHoursWorked.toString(),
      `$${row.deductions.toLocaleString()}`,
      `$${row.netSalary.toLocaleString()}`
    ]);

    if (doc.autoTable) {
      doc.autoTable({
        head: headers,
        body: rows,
        startY: 30,
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 20 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 }
        }
      });
    } else {
      // Simple manual table rendering
      let y = 40;
      headers[0].forEach((header, i) => {
        doc.text(header, 14 + i * 30, y);
      });
      y += 10;
      rows.forEach(row => {
        row.forEach((cell, i) => {
          doc.text(cell.toString(), 14 + i * 30, y);
        });
        y += 10;
      });
    }

    doc.save(`payroll_${selectedYear}_${selectedMonth}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success(`${dataToExport.length} employee(s) payroll report exported successfully as PDF`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  useEffect(() => {
    fetchPayrollData();
  }, [selectedMonth, selectedYear]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
        <span className="text-gray-600 text-lg">Loading payroll data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Payroll Management</h1>
        <button
          className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          onClick={fetchPayrollData}
        >
          <span className="mr-2">🔄</span> Refresh
        </button>
      </div>

      {/* Month/Year Selection */}
      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Select Period</h2>
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Payroll Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800">Total Employees</h3>
          <p className="text-2xl font-bold text-blue-600">{payrollData.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800">Total Base Salary</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(payrollData.reduce((sum, emp) => sum + emp.baseSalary, 0))}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800">Total Deductions</h3>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(payrollData.reduce((sum, emp) => sum + emp.deductions, 0))}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800">Total Net Salary</h3>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(payrollData.reduce((sum, emp) => sum + emp.netSalary, 0))}
          </p>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-800">Payroll Details</h2>
            {payrollData.length > 0 && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-600">Select All</label>
                {selectedEmployees.length > 0 && (
                  <span className="text-sm text-blue-600 font-medium">
                    ({selectedEmployees.length} selected)
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              onClick={exportToCSV}
            >
              <span className="mr-1">📊</span> CSV
            </button>
            <button
              className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              onClick={exportToPDF}
            >
              <span className="mr-1">📄</span> PDF
            </button>
          </div>
        </div>

        {payrollData.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No payroll data found for the selected period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours Worked</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absence Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrollData.map((employee) => (
                  <tr key={employee.employeeId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.employeeId)}
                        onChange={() => handleEmployeeSelect(employee.employeeId)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.employeeName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {employee.role}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(employee.baseSalary)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {employee.totalHoursWorked}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {employee.expectedHours}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {employee.absenceHours}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600">
                      {formatCurrency(employee.deductions)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                      {formatCurrency(employee.netSalary)}
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

export default Payroll;
