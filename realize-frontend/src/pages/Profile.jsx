import { useState, useEffect } from "react";
import API from "../api";
import { toast } from "react-toastify";

const Profile = ({ employeeId }) => {
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
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Change Password
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Enable 2FA
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-gray-900">Notification Preferences</h4>
              <p className="text-sm text-gray-600">Manage how you receive notifications</p>
            </div>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Manage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
