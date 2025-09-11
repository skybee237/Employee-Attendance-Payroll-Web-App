
import { useState, useEffect } from "react";
import API from "../api";
import { toast } from "react-toastify";

const Profile = ({ employeeId, updateUserProfile }) => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    position: "",
    department: "",
    phone: "",
    address: "",
    joinDate: "",
    profilePicture: null
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState({
    qrCode: null,
    secret: null,
    verificationCode: ""
  });
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    inApp: true,
    leaveRequests: true,
    payrollUpdates: true
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [settingUp2FA, setSettingUp2FA] = useState(false);
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [updatingNotifications, setUpdatingNotifications] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/auth/profile");
      const profileData = response.data;

      setProfile({
        name: profileData.name || "",
        email: profileData.email || "",
        role: profileData.role || "",
        position: profileData.position || "",
        department: profileData.department || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        joinDate: profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : "",
        profilePicture: profileData.profilePicture || null
      });

      setFormData({
        name: profileData.name || "",
        email: profileData.email || "",
        position: profileData.position || "",
        department: profileData.department || "",
        phone: profileData.phone || "",
        address: profileData.address || ""
      });

      // Set 2FA status from profile
      setTwoFactorEnabled(profileData.twoFactorEnabled || false);

      // Fetch notification preferences
      try {
        const notificationsResponse = await API.get("/api/auth/notifications");
        setNotificationPreferences(notificationsResponse.data);
      } catch (err) {
        console.error("Failed to fetch notification preferences:", err);
      }

    } catch (err) {
      console.error("Failed to fetch profile:", err);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      await API.put("/api/auth/profile", formData);
      toast.success("Profile updated successfully");
      setEditing(false);
      fetchProfile(); // Refresh profile data

      // Update localStorage and parent state if name changed
      if (formData.name && formData.name !== profile.name) {
        localStorage.setItem("userName", formData.name);
        if (updateUserProfile) {
          updateUserProfile(formData.name, null);
        }
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error("Failed to update profile");
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name,
      email: profile.email,
      position: profile.position,
      department: profile.department,
      phone: profile.phone,
      address: profile.address
    });
    setEditing(false);
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    try {
      setChangingPassword(true);
      await API.post("/api/password/change", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      toast.success("Password changed successfully");
      setShowChangePasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      console.error("Failed to change password:", err);
      const errorMessage = err.response?.data?.error || "Failed to change password";
      toast.error(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      setSettingUp2FA(true);
      const response = await API.post("/api/auth/2fa/setup");
      setTwoFactorData({
        qrCode: response.data.qrCode,
        secret: response.data.secret,
        verificationCode: ""
      });
      setShow2FAModal(true);
    } catch (err) {
      console.error("Failed to setup 2FA:", err);
      toast.error(err.response?.data?.error || "Failed to setup 2FA");
    } finally {
      setSettingUp2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFactorData.verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }

    try {
      setVerifying2FA(true);
      await API.post("/api/auth/2fa/verify", {
        token: twoFactorData.verificationCode
      });
      toast.success("2FA enabled successfully");
      setShow2FAModal(false);
      setTwoFactorEnabled(true);
      setTwoFactorData({
        qrCode: null,
        secret: null,
        verificationCode: ""
      });
    } catch (err) {
      console.error("Failed to verify 2FA:", err);
      toast.error(err.response?.data?.error || "Failed to verify 2FA");
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleNotificationInputChange = (e) => {
    const { name, checked } = e.target;
    setNotificationPreferences(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleUpdateNotifications = async () => {
    try {
      setUpdatingNotifications(true);
      await API.put("/api/auth/notifications", notificationPreferences);
      toast.success("Notification preferences updated successfully");
      setShowNotificationsModal(false);
    } catch (err) {
      console.error("Failed to update notifications:", err);
      toast.error(err.response?.data?.error || "Failed to update notifications");
    } finally {
      setUpdatingNotifications(false);
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt("Enter your password to disable 2FA:");
    if (!password) return;

    try {
      setVerifying2FA(true);
      await API.post("/api/auth/2fa/disable", { password });
      toast.success("2FA disabled successfully");
      setShow2FAModal(false);
      setTwoFactorEnabled(false);
    } catch (err) {
      console.error("Failed to disable 2FA:", err);
      toast.error(err.response?.data?.error || "Failed to disable 2FA");
    } finally {
      setVerifying2FA(false);
    }
  };

  const handlePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('profilePicture', file);

    try {
      setUploadingPicture(true);
      const response = await API.post(`/api/profile-picture/upload`, uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success("Profile picture uploaded successfully");
      fetchProfile(); // Refresh profile data to show new picture

      // Update localStorage and parent state with new picture
      if (response.data.profilePicture) {
        localStorage.setItem("profilePicture", response.data.profilePicture);
        if (updateUserProfile) {
          updateUserProfile(null, response.data.profilePicture);
        }
      }
    } catch (err) {
      console.error("Failed to upload profile picture:", err);
      toast.error("Failed to upload profile picture");
    } finally {
      setUploadingPicture(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
        <span className="text-gray-600 text-lg">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        {!editing ? (
          <button
            className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            onClick={() => setEditing(true)}
          >
            <span className="mr-2">✏️</span> Edit Profile
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              onClick={handleSave}
            >
              <span className="mr-2">💾</span> Save
            </button>
            <button
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              onClick={handleCancel}
            >
              <span className="mr-2">❌</span> Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture and Basic Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              {profile.profilePicture ? (
                <img
                  src={`http://localhost:5000${profile.profilePicture}`}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePictureUpload}
                  className="hidden"
                  disabled={uploadingPicture}
                />
                {uploadingPicture ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
              </label>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">{profile.name || "User"}</h2>
            <p className="text-gray-600">{profile.email}</p>
            <div className="mt-2">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full capitalize">
                {profile.role}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Position</span>
              <span className="font-medium">{profile.position || "Not specified"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Department</span>
              <span className="font-medium">{profile.department || "Not specified"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Join Date</span>
              <span className="font-medium">{profile.joinDate || "Not available"}</span>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profile.name || "Not provided"}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              {editing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profile.email || "Not provided"}</p>
              )}
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
              {editing ? (
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profile.position || "Not provided"}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              {editing ? (
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profile.department || "Not provided"}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              {editing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900 py-2">{profile.phone || "Not provided"}</p>
              )}
            </div>

            {/* Join Date (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Join Date</label>
              <p className="text-gray-900 py-2">{profile.joinDate || "Not available"}</p>
            </div>
          </div>

          {/* Address */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            {editing ? (
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your address"
              />
            ) : (
              <p className="text-gray-900 py-2">{profile.address || "Not provided"}</p>
            )}
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <h4 className="font-medium text-gray-900">Change Password</h4>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={() => setShowChangePasswordModal(true)}
            >
              Change Password
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600">
                {twoFactorEnabled ? "Two-factor authentication is enabled" : "Add an extra layer of security to your account"}
              </p>
            </div>
            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={() => setShow2FAModal(true)}
            >
              {twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-gray-900">Notification Preferences</h4>
              <p className="text-sm text-gray-600">Manage how you receive notifications</p>
            </div>
            <button
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={() => setShowNotificationsModal(true)}
            >
              Manage
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                  });
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {twoFactorEnabled ? "Two-Factor Authentication" : "Two-Factor Authentication Setup"}
            </h3>

            {twoFactorEnabled ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Two-factor authentication is currently enabled for your account.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    onClick={handleDisable2FA}
                    disabled={verifying2FA}
                  >
                    {verifying2FA ? "Disabling..." : "Disable 2FA"}
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    onClick={() => setShow2FAModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                {twoFactorData.qrCode ? (
                  <div className="flex flex-col items-center space-y-4">
                    <img src={twoFactorData.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                    <p className="text-sm text-gray-600">Scan this QR code with your authenticator app.</p>
                    <input
                      type="text"
                      name="verificationCode"
                      value={twoFactorData.verificationCode}
                      onChange={(e) => setTwoFactorData(prev => ({ ...prev, verificationCode: e.target.value }))}
                      placeholder="Enter verification code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex justify-end space-x-3 w-full">
                      <button
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        onClick={() => setShow2FAModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleVerify2FA}
                        disabled={verifying2FA}
                      >
                        {verifying2FA ? "Verifying..." : "Verify"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <p className="text-sm text-gray-600 text-center">
                      Two-factor authentication adds an extra layer of security to your account by requiring a verification code from your authenticator app.
                    </p>
                    <div className="flex justify-center space-x-3">
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSetup2FA}
                        disabled={settingUp2FA}
                      >
                        {settingUp2FA ? "Setting up..." : "Setup 2FA"}
                      </button>
                      <button
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        onClick={() => setShow2FAModal(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Notification Preferences Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Preferences</h3>

            <form className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="email"
                  name="email"
                  checked={notificationPreferences.email}
                  onChange={handleNotificationInputChange}
                  className="mr-2"
                />
                <label htmlFor="email" className="text-gray-700">Email Notifications</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="inApp"
                  name="inApp"
                  checked={notificationPreferences.inApp}
                  onChange={handleNotificationInputChange}
                  className="mr-2"
                />
                <label htmlFor="inApp" className="text-gray-700">In-App Notifications</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="leaveRequests"
                  name="leaveRequests"
                  checked={notificationPreferences.leaveRequests}
                  onChange={handleNotificationInputChange}
                  className="mr-2"
                />
                <label htmlFor="leaveRequests" className="text-gray-700">Leave Requests</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="payrollUpdates"
                  name="payrollUpdates"
                  checked={notificationPreferences.payrollUpdates}
                  onChange={handleNotificationInputChange}
                  className="mr-2"
                />
                <label htmlFor="payrollUpdates" className="text-gray-700">Payroll Updates</label>
              </div>
            </form>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                onClick={() => setShowNotificationsModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUpdateNotifications}
                disabled={updatingNotifications}
              >
                {updatingNotifications ? "Updating..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
