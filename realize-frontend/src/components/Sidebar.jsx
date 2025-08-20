import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

const Sidebar = ({ userRole = "employee", userName = "User", userEmail = "user@example.com" }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  // Navigation items based on role
  const navigationItems = {
    admin: [
      { id: "dashboard", path: "/", label: "Dashboard", icon: "📊" },
      { id: "employees", path: "/employees", label: "Employees", icon: "👥" },
      { 
        id: "attendance", 
        path: "/attendance", 
        label: "Attendance", 
        icon: "🕒",
        submenu: [
          { path: "/attendance/records", label: "All Records" },
          { path: "/attendance/reports", label: "Reports" },
          { path: "/attendance/overtime", label: "Overtime" }
        ]
      },
      { 
        id: "leave", 
        path: "/leave", 
        label: "Leave Management", 
        icon: "📅",
        submenu: [
          { path: "/leave/requests", label: "All Requests" },
          { path: "/leave/approvals", label: "Approvals" },
          { path: "/leave/reports", label: "Reports" }
        ]
      },
      { 
        id: "justification", 
        path: "/justification", 
        label: "Justifications", 
        icon: "📝",
        submenu: [
          { path: "/justification/pending", label: "Pending" },
          { path: "/justification/history", label: "History" }
        ]
      },
      { id: "reports", path: "/reports", label: "Analytics", icon: "📈" },
      { id: "settings", path: "/settings", label: "Settings", icon: "⚙️" }
    ],
    superior: [
      { id: "dashboard", path: "/", label: "Dashboard", icon: "📊" },
      { id: "team", path: "/team", label: "My Team", icon: "👥" },
      { id: "attendance", path: "/attendance", label: "Attendance", icon: "🕒" },
      { id: "leave", path: "/leave", label: "Leave Approvals", icon: "📅" },
      { id: "justification", path: "/justification", label: "Justifications", icon: "📝" },
      { id: "reports", path: "/reports", label: "Team Reports", icon: "📈" }
    ],
    employee: [
      { id: "dashboard", path: "/", label: "Dashboard", icon: "📊" },
      { id: "attendance", path: "/attendance", label: "My Attendance", icon: "🕒" },
      { id: "leave", path: "/leave", label: "My Leave", icon: "📅" },
      { id: "justification", path: "/justification", label: "My Justifications", icon: "📝" },
      { id: "profile", path: "/profile", label: "Profile", icon: "👤" }
    ]
  };

  const currentNavItems = navigationItems[userRole] || navigationItems.employee;

  const toggleSubmenu = (itemId) => {
    if (activeSubmenu === itemId) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(itemId);
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className={`bg-gray-800 text-white min-h-screen flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="text-xl font-bold flex items-center">
            <span className="text-blue-400 mr-2">⚡</span>
            Realize
          </h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded hover:bg-gray-700 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? "➡️" : "⬅️"}
        </button>
      </div>

      {/* User Profile */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{userName}</p>
              <p className="text-gray-400 text-sm truncate">{userEmail}</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="inline-block px-2 py-1 bg-blue-900 text-blue-200 text-xs rounded-full capitalize">
              {userRole}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {currentNavItems.map((item) => (
            <li key={item.id}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() => toggleSubmenu(item.id)}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                      isActive(item.path) ? 'bg-blue-700 text-white' : 'hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-lg mr-3">{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <span className={`transform transition-transform ${activeSubmenu === item.id ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </>
                    )}
                  </button>
                  {!isCollapsed && activeSubmenu === item.id && (
                    <ul className="ml-4 mt-1 space-y-1 pl-4 border-l border-gray-700">
                      {item.submenu.map((subItem) => (
                        <li key={subItem.path}>
                          <Link
                            to={subItem.path}
                            className={`block p-2 rounded-lg transition-colors text-sm ${
                              isActive(subItem.path) ? 'text-blue-300' : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    isActive(item.path) ? 'bg-blue-700 text-white' : 'hover:bg-gray-700'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className="text-lg">{item.icon}</span>
                  {!isCollapsed && <span className="ml-3">{item.label}</span>}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-700">
          <div className="text-center text-gray-400 text-sm">
            <p>Realize v1.2.0</p>
            <p className="mt-1">© 2023 Company Name</p>
          </div>
        </div>
      )}

      {/* Collapsed mode user avatar */}
      {isCollapsed && (
        <div className="mt-auto p-4 border-t border-gray-700 flex justify-center">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;