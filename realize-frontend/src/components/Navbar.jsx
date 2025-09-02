import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import API from "../api";
import { toast } from "react-toastify";

const Navbar = ({
  userName = "User",
  userRole = "employee",
  userEmail = "user@example.com",
  profilePicture = null,
  onLogout = () => console.log("Logout clicked"),
  onProfile = () => console.log("Profile clicked")
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const location = useLocation();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      // This would be replaced with actual API call when backend endpoint is available
      // const response = await API.get('/notifications');
      // setNotifications(response.data);
      
      // Mock data for now - simulating API response
      const mockNotifications = [
        { 
          id: 1, 
          message: "Leave request approved", 
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), 
          read: false, 
          type: "success" 
        },
        { 
          id: 2, 
          message: "New justification submitted for review", 
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), 
          read: false, 
          type: "info" 
        },
        { 
          id: 3, 
          message: "Attendance reminder: Don't forget to check out", 
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), 
          read: true, 
          type: "warning" 
        }
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (notificationsOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [notificationsOpen, notifications.length, fetchNotifications]);

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const getPageTitle = (pathname) => {
    const titles = {
      "/": "Dashboard",
      "/attendance": "Attendance",
      "/leave": "Leave Management",
      "/justification": "Justifications",
      "/employees": "Employee Management",
      "/profile": "My Profile",
      "/settings": "Settings",
      "/reports": "Reports & Analytics"
    };
    
    // Check for subroutes
    for (const path in titles) {
      if (pathname.startsWith(path)) {
        return titles[path];
      }
    }
    
    return "Realize";
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm">
      {/* Left Section - Page Title and Breadcrumb */}
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-800">
          {getPageTitle(location.pathname)}
        </h1>
        <div className="ml-4 text-sm text-gray-500 hidden md:block">
          {currentTime.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Right Section - User Actions */}
      <div className="flex items-center gap-4">
        {/* Current Time */}
        <div className="hidden md:flex items-center bg-gray-100 px-3 py-1 rounded-lg">
          <span className="text-gray-600 text-sm font-medium">
            {currentTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            aria-label="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="p-4 text-gray-500 text-center">No notifications</p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex items-start">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'success' ? 'bg-green-500' :
                          notification.type === 'warning' ? 'bg-yellow-500' :
                          notification.type === 'error' ? 'bg-red-500' :
                          'bg-blue-500'
                        } mr-3`}></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatRelativeTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-gray-200">
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 w-full text-center"
                  disabled={unreadNotifications === 0}
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-800">{userName}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
            <svg 
              className={`w-4 h-4 text-gray-500 transform transition-transform ${
                isProfileOpen ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <p className="font-medium text-gray-800">{userName}</p>
                <p className="text-sm text-gray-500">{userEmail}</p>
                <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                  {userRole}
                </span>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    onProfile();
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setIsProfileOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;