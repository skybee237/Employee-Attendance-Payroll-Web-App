import { useState, useEffect, useCallback } from "react";
import API from "../api";

const CreateEmployee = ({ onEmployeeCreated }) => {
  // Form state with enhanced structure
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "employee",
    superiorId: "",
    department: "",
    position: "",
    phone: "",
    startDate: new Date().toISOString().split('T')[0] // Default to today
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [superiors, setSuperiors] = useState([]);
  const [loadingSuperiors, setLoadingSuperiors] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Validation patterns
  const validationRules = {
    name: {
      required: true,
      minLength: 2,
      pattern: /^[a-zA-Z\s]+$/,
      message: "Name must contain only letters and spaces (min 2 characters)"
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Please enter a valid email address"
    },
    phone: {
      pattern: /^[\d\-\+\(\)\s]+$/,
      message: "Please enter a valid phone number"
    },
    position: {
      minLength: 2,
      message: "Position must be at least 2 characters long"
    }
  };

  // Fetch superiors for dropdown
  const fetchSuperiors = useCallback(async () => {
    setLoadingSuperiors(true);
    try {
      const res = await API.get("/admin/superiors");
      setSuperiors(res.data || []);
    } catch (err) {
      console.error("Error fetching superiors:", err);
      // Don't set error for this, as it's optional functionality
    } finally {
      setLoadingSuperiors(false);
    }
  }, []);

  // Handle error display
  const handleError = (message, field = null) => {
    if (field) {
      setFieldErrors(prev => ({ ...prev, [field]: message }));
    } else {
      setError(message);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Clear field error
  const clearFieldError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate single field
  const validateField = (name, value) => {
    const rule = validationRules[name];
    if (!rule) return true;

    // Required validation
    if (rule.required && !value.trim()) {
      handleError(`${name.charAt(0).toUpperCase() + name.slice(1)} is required`, name);
      return false;
    }

    // Skip other validations if field is empty and not required
    if (!value.trim() && !rule.required) {
      clearFieldError(name);
      return true;
    }

    // MinLength validation
    if (rule.minLength && value.trim().length < rule.minLength) {
      handleError(rule.message, name);
      return false;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value.trim())) {
      handleError(rule.message, name);
      return false;
    }

    clearFieldError(name);
    return true;
  };

  // Validate entire form
  const validateForm = () => {
    let isValid = true;
    const newFieldErrors = {};

    Object.keys(validationRules).forEach(field => {
      if (!validateField(field, form[field])) {
        isValid = false;
      }
    });

    // Role-specific validation
    if (form.role === "employee" && !form.superiorId) {
      handleError("Superior is required for employees", "superiorId");
      isValid = false;
    }

    // Check if email is already taken (you might want to implement this check)
    // This would typically be done on the backend, but frontend validation helps UX

    return isValid;
  };

  // Handle input changes with validation
  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear success message when form is modified
    if (success) setSuccess(null);
    
    // Validate field on change (debounced validation would be better for UX)
    setTimeout(() => validateField(field, value), 300);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError("Please fix the errors below before submitting");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Clean form data
      const cleanedForm = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        department: form.department.trim(),
        position: form.position.trim(),
        phone: form.phone.trim(),
        superiorId: form.superiorId || null
      };

      const res = await API.post("/admin/create", cleanedForm);
      
      setSuccess(`Employee "${form.name}" created successfully! Employee ID: ${res.data.employeeId || 'Generated'}`);
      
      // Reset form
      setForm({
        name: "",
        email: "",
        role: "employee",
        superiorId: "",
        department: "",
        position: "",
        phone: "",
        startDate: new Date().toISOString().split('T')[0]
      });
      setFieldErrors({});
      
      // Callback for parent component
      if (onEmployeeCreated) {
        onEmployeeCreated(res.data);
      }
      
    } catch (err) {
      console.error("Error creating employee:", err);
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.error || 
                          "Error creating employee. Please try again.";
      handleError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      role: "employee",
      superiorId: "",
      department: "",
      position: "",
      phone: "",
      startDate: new Date().toISOString().split('T')[0]
    });
    setFieldErrors({});
    setError(null);
    setSuccess(null);
  };

  // Load superiors on component mount
  useEffect(() => {
    fetchSuperiors();
  }, [fetchSuperiors]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Employee</h2>
        <p className="text-gray-600">Add a new employee to your organization</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">Success!</h4>
              <p className="text-sm mt-1">{success}</p>
            </div>
            <button 
              onClick={() => setSuccess(null)}
              className="text-green-500 hover:text-green-700 font-bold text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">Error</h4>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-bold text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter employee's full name"
                required
              />
              {fieldErrors.name && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="employee@company.com"
                required
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Role Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={form.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="employee">Employee</option>
                <option value="superior">Superior/Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {/* Superior Selection */}
            {form.role === "employee" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Superior/Manager <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.superiorId}
                  onChange={(e) => handleInputChange('superiorId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    fieldErrors.superiorId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={loadingSuperiors}
                >
                  <option value="">Select a superior...</option>
                  {superiors.map(superior => (
                    <option key={superior._id} value={superior._id}>
                      {superior.name} ({superior.email})
                    </option>
                  ))}
                </select>
                {loadingSuperiors && (
                  <p className="mt-1 text-sm text-gray-500">Loading superiors...</p>
                )}
                {fieldErrors.superiorId && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.superiorId}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Advanced Information (Collapsible) */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <h3 className="text-lg font-semibold">Additional Information</h3>
            <span className="text-blue-600 hover:text-blue-800 transition-colors">
              {showAdvanced ? '▼ Hide' : '▶ Show'}
            </span>
          </div>
          
          {showAdvanced && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="e.g., Engineering, HR, Marketing"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position/Title
                </label>
                <input
                  type="text"
                  value={form.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    fieldErrors.position ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Software Developer, HR Manager"
                />
                {fieldErrors.position && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.position}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    fieldErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="+1 (555) 123-4567"
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Reset Form
          </button>
          
          <button
            type="submit"
            disabled={loading || Object.keys(fieldErrors).length > 0}
            className={`px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
              loading || Object.keys(fieldErrors).length > 0
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Employee...
              </>
            ) : (
              <>
                ✨ Create Employee
              </>
            )}
          </button>
        </div>
      </form>

      {/* Form Tips */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">💡 Tips:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Fields marked with <span className="text-red-500">*</span> are required</li>
          <li>• Email addresses must be unique and valid</li>
          <li>• Employees must be assigned to a superior/manager</li>
          <li>• Additional information can be updated later in the employee profile</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateEmployee;