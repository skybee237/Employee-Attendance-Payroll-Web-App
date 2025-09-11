import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, Copy, RefreshCw, CheckCircle, AlertCircle, Info } from "lucide-react";
import { toast } from "react-toastify";
import API from "../api";

const CreateEmployee = ({ onEmployeeCreated }) => {
  // --- State (form, UI, password options, etc.)
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "employee",
    superiorId: "",
    department: "",
    position: "",
    phone: "",
    startDate: new Date().toISOString().split("T")[0],
    password: "",
    confirmPassword: "",
    passwordMethod: "generate", // "generate" or "manual"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [superiors, setSuperiors] = useState([]);
  const [loadingSuperiors, setLoadingSuperiors] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
  });

  const [passwordOptions, setPasswordOptions] = useState({
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true,
  });

  // --- Password strength checker
  const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = [];

    if (password.length >= 8) score++;
    else feedback.push("At least 8 characters");

    if (/[A-Z]/.test(password)) score++;
    else feedback.push("Include an uppercase letter");

    if (/[a-z]/.test(password)) score++;
    else feedback.push("Include a lowercase letter");

    if (/[0-9]/.test(password)) score++;
    else feedback.push("Include a number");

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push("Include a symbol");

    return { score, feedback };
  };

  // --- Password generator
  const generatePassword = useCallback(() => {
    // Always include required character types for backend validation
    const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowerCase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+[]{}|;:,.<>?";

    let password = "";
    // Ensure at least one of each required type
    password += upperCase[Math.floor(Math.random() * upperCase.length)];
    password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Build chars based on options
    let chars = "";
    if (passwordOptions.includeUppercase) chars += upperCase;
    if (passwordOptions.includeLowercase) chars += lowerCase;
    if (passwordOptions.includeNumbers) chars += numbers;
    if (passwordOptions.includeSymbols) chars += symbols;

    if (passwordOptions.excludeSimilar) {
      chars = chars.replace(/[ilLI|oO0]/g, "");
    }

    // Fill remaining length
    for (let i = 4; i < passwordOptions.length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Shuffle
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }, [passwordOptions]);

  // --- Copy helper
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setSuccess(`${label} copied to clipboard`);
    setTimeout(() => setSuccess(null), 2000);
  };

  // --- Fetch superiors
  useEffect(() => {
    const fetchSuperiors = async () => {
      setLoadingSuperiors(true);
      try {
        const response = await API.get("/api/admin/superiors");
        setSuperiors(response.data);
      } catch (err) {
        console.error("Error fetching superiors", err);
      } finally {
        setLoadingSuperiors(false);
      }
    };
    fetchSuperiors();
  }, []);

  // --- Handle input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "password" && form.passwordMethod === "manual") {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  // --- Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.passwordMethod === "manual" && form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await API.post("/api/admin/create", form);
      toast.success(`Employee created successfully. name: ${response.data.employee.name}`);
      if (onEmployeeCreated) onEmployeeCreated(response.data.employee);
      setForm({
        name: "",
        email: "",
        role: "employee",
        superiorId: "",
        department: "",
        position: "",
        phone: "",
        startDate: new Date().toISOString().split("T")[0],
        password: "",
        confirmPassword: "",
        passwordMethod: "generate",
      });
    } catch (err) {
      setError(err.response?.data?.error || "Error creating employee. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Handle password generation
  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setForm((prev) => ({ ...prev, password: newPassword, confirmPassword: newPassword }));
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create New Employee</h2>
        <p className="text-gray-600">Fill in the details below to add a new employee</p>
      </div>

      {/* Error messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="name" placeholder="Full Name"
              value={form.name} onChange={handleInputChange}
              className="border p-2 rounded-lg" required />
            <input type="email" name="email" placeholder="Email Address"
              value={form.email} onChange={handleInputChange}
              className="border p-2 rounded-lg" required />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select name="role" value={form.role} onChange={handleInputChange}
              className="border p-2 rounded-lg w-full md:w-1/2">
              <option value="employee">Employee</option>
              <option value="superior">Superior</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Password & Security */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Password & Security</h3>

          {/* Method selection */}
          <div className="mb-4">
            <label className="flex items-center mb-2">
              <input type="radio" name="passwordMethod" value="generate"
                checked={form.passwordMethod === "generate"}
                onChange={handleInputChange} className="mr-2" /> Generate Password
            </label>
            <label className="flex items-center">
              <input type="radio" name="passwordMethod" value="manual"
                checked={form.passwordMethod === "manual"}
                onChange={handleInputChange} className="mr-2" /> Enter Manually
            </label>
          </div>

          {/* --- Generated Password Section --- */}
          {form.passwordMethod === "generate" && (
            <div className="space-y-6">
              {/* Length slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Length: {passwordOptions.length}
                </label>
                <input type="range" min="8" max="32" value={passwordOptions.length}
                  onChange={(e) =>
                    setPasswordOptions((prev) => ({
                      ...prev, length: parseInt(e.target.value),
                    }))
                  }
                  className="w-full" />
              </div>

              {/* Options checkboxes */}
              <div className="space-y-2">
                {[
                  { key: "includeUppercase", label: "Include uppercase (A-Z)" },
                  { key: "includeLowercase", label: "Include lowercase (a-z)" },
                  { key: "includeNumbers", label: "Include numbers (0-9)" },
                  { key: "includeSymbols", label: "Include symbols (!@#$...)" },
                  { key: "excludeSimilar", label: "Exclude similar characters (i,l,1,o,0,O)" },
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center text-sm">
                    <input type="checkbox" checked={passwordOptions[opt.key]}
                      onChange={(e) =>
                        setPasswordOptions((prev) => ({
                          ...prev, [opt.key]: e.target.checked,
                        }))
                      }
                      className="mr-2" /> {opt.label}
                  </label>
                ))}
              </div>

              {/* Generate button */}
              <button type="button" onClick={handleGeneratePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <RefreshCw className="w-4 h-4 mr-2" /> Generate Password
              </button>

              {/* Show generated password */}
              {form.password && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generated Password
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <input type={showPassword ? "text" : "password"}
                        value={form.password} readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-mono text-sm" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-2 text-gray-500 hover:text-gray-700">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button type="button" onClick={() => copyToClipboard(form.password, "Password")}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 text-sm font-medium text-green-600">
                    Password Strength: Strong ✓
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- Manual Password Entry --- */}
          {form.passwordMethod === "manual" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"}
                    name="password" value={form.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Strength meter */}
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-2 rounded-full ${passwordStrength.score <= 2 ? "bg-red-500" :
                        passwordStrength.score === 3 ? "bg-yellow-500" :
                          "bg-green-500"
                        }`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm mt-1">
                    {passwordStrength.score <= 2
                      ? "Weak password"
                      : passwordStrength.score === 3
                        ? "Moderate password"
                        : "Strong password"}
                  </p>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="mt-1 text-xs text-gray-500 list-disc pl-4">
                      {passwordStrength.feedback.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword" value={form.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Information */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Advanced Information</h3>
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-800 text-sm mb-4">
            {showAdvanced ? "Hide" : "Show"} Advanced Fields
          </button>
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="department" placeholder="Department"
                value={form.department} onChange={handleInputChange}
                className="border p-2 rounded-lg" />
              <input type="text" name="position" placeholder="Position"
                value={form.position} onChange={handleInputChange}
                className="border p-2 rounded-lg" />
              <input type="text" name="phone" placeholder="Phone Number"
                value={form.phone} onChange={handleInputChange}
                className="border p-2 rounded-lg" />
              <input type="date" name="startDate"
                value={form.startDate} onChange={handleInputChange}
                className="border p-2 rounded-lg" />
              <select name="superiorId" value={form.superiorId}
                onChange={handleInputChange}
                className="border p-2 rounded-lg">
                <option value="">Select Superior</option>
                {superiors.map((sup) => (
                  <option key={sup._id} value={sup._id}>{sup.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button type="reset"
            onClick={() => setForm({
              name: "", email: "", role: "employee", superiorId: "",
              department: "", position: "", phone: "",
              startDate: new Date().toISOString().split("T")[0],
              password: "", confirmPassword: "", passwordMethod: "generate"
            })}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Creating..." : "Create Employee"}
          </button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
        <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
        <p className="text-sm text-blue-800">
          Tip: Use the password generator for stronger security. Generated
          passwords can be copied and securely shared with the employee.
        </p>
      </div>
    </div>
  );
};

export default CreateEmployee;
