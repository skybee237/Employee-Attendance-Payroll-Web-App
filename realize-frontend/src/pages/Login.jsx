import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";
import { toast } from "react-toastify";
import { Eye, EyeOff, MapPin, Shield, User, AlertCircle } from "lucide-react";

const SITE_LOCATION = { lat: 3.8370057, lng: 11.5335042 }; // Yaoundé, Cameroon
const MAX_DISTANCE_METERS = 3867;
const COMPANY_NAME = "Realize HR System";

function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const Login = ({ setEmployeeId, setRole, setUserEmail }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password && password.length >= 6;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Reset error state
    setError("");

    // Comprehensive validation
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setLocationStatus("Checking user role...");

    try {
      // Get user role first
      const roleRes = await API.post("/api/auth/getRole", { email });
      const role = roleRes.data;
      console.log("User role:", role);

      // Admin login (anywhere) - no location required
      if (role === "admin") {
        setLocationStatus("Admin login detected...");
        const loginRes = await API.post("/api/auth/login", { email, password });
        console.log("Admin login successful");
        localStorage.setItem("token", loginRes.data.token);
        localStorage.setItem("userRole", role);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("employeeId", loginRes.data.employeeId);
        localStorage.setItem("userName", loginRes.data.name || email.split('@')[0]);
        // Update App.jsx state
        setEmployeeId(loginRes.data.employeeId);
        setRole(role);
        setUserEmail(email);
        console.log("About to navigate to /admin");
        navigate("/admin", { replace: true });
        console.log("Navigation called, should redirect now");
        return;
      }

      // Employee/Superior login requires location check
      setLocationStatus("Getting your location...");

      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser");
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocationStatus("Checking location...");

          try {
            console.log("Attempting login with:", { email, latitude, longitude });

            // Employee login requires location check
            const distance = getDistanceFromLatLonInMeters(
              latitude,
              longitude,
              SITE_LOCATION.lat,
              SITE_LOCATION.lng
            );

            setLocationStatus(`You are ${Math.round(distance)}m from site`);

            if (distance > MAX_DISTANCE_METERS) {
              setError(`You must be within ${MAX_DISTANCE_METERS}m of the site to login. Current distance: ${Math.round(distance)}m`);
              setLoading(false);
              return;
            }
            const loginRes = await API.post("/api/auth/login", {
              email,
              password,
              latitude,
              longitude,
            });

            if (role === "superior") {
              console.log("Superior login successful");
            } else {
              console.log("Employee login successful");
            }
            localStorage.setItem("token", loginRes.data.token);
            localStorage.setItem("userRole", role);
            localStorage.setItem("userEmail", email);
            localStorage.setItem("employeeId", loginRes.data.employeeId);
            localStorage.setItem("userName", loginRes.data.name || email.split('@')[0]);
            // Update App.jsx state
            setEmployeeId(loginRes.data.employeeId);
            setRole(role);
            setUserEmail(email);

            // Redirect based on role
            navigate("/", { replace: true });

          }
          catch (err) {
            console.error("Login error details:", {
              status: err.response?.status,
              data: err.response?.data,
              message: err.message
            });

            const errorMessage = err.response?.data?.error ||
                               err.response?.data?.message ||
                               "Login failed. Please check your credentials and try again.";

            setError(errorMessage);
          } finally {
            setLoading(false);
            setLocationStatus("");
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          let geoError = "Location access is required to login. Please enable location services.";

          switch(err.code) {
            case err.PERMISSION_DENIED:
              geoError = "Location access denied. Please enable location permissions in your browser settings.";
              break;
            case err.POSITION_UNAVAILABLE:
              geoError = "Location information unavailable. Please check your internet connection.";
              break;
            case err.TIMEOUT:
              geoError = "Location request timed out. Please try again.";
              break;
          }

          setError(geoError);
          setLoading(false);
          setLocationStatus("");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } catch (err) {
      console.error("Role check error:", err);
      const errorMessage = err.response?.data?.error ||
                         err.response?.data?.message ||
                         "Failed to check user role. Please try again.";
      setError(errorMessage);
      setLoading(false);
      setLocationStatus("");
    }
  };

  const handlePasswordResetRequest = async () => {
    try {
      const res = await API.post("/api/password/request", { email });
      toast.success(res.data.message || "Password reset request sent to admin");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to request password reset");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">{COMPANY_NAME}</h1>
          </div>
          <p className="text-gray-600">Sign in to access your HR portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Welcome Back</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Location Info */}
            <div className="flex items-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <MapPin className="w-4 h-4 mr-2 text-blue-500" />
              <span>
                {locationStatus || "Location-based authentication required"}
              </span>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                loading
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form> 

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        {/* Company Info */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2023 {COMPANY_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Secure authentication with location verification
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;