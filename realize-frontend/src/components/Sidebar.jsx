import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import myIcon from "../assets/image/image.png";


const Sidebar = ({ userRole = "employee", userName = "User", userEmail = "user@example.com" }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Add toggle button handler
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  // Navigation items based on role
  const navigationItems = {
    admin: [
      { id: "dashboard", path: "/", label: "Dashboard", icon: "📊" },
      { id: "employees", path: "/create-employee", label: "Create Employee", icon: "👥" },
      { id: "manage-employees", path: "/admin/manage-employees", label: "Manage Employees", icon: "👨‍💼" },
      {
        id: "attendance",
        path: "/attendance",
        label: "My Attendance",
        icon: "🕒"
      },
      { 
        id: "leave", 
        path: "/leave", 
        label: "Leave Management", 
        icon: "📅",
        submenu: [
          { path: "/all-requests", label: "All Requests" },
          { path: "/admin/approvals", label: "Approvals" },
          { path: "/admin/reports", label: "Reports" }
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
      { 
        id: "superior-management", 
        path: "/admin/superior-management", 
        label: "Superior Management", 
        icon: "👑" 
      },
      { id: "reports", path: "/admin/reports", label: "Analytics", icon: "📈" },

    ],
    superior: [
      { id: "dashboard", path: "/", label: "Dashboard", icon: "📊" },
      { id: "team", path: "/superior/team", label: "My Team", icon: "👥" },
      { id: "attendance", path: "/attendance", label: "Attendance", icon: "🕒" },
      { id: "leave", path: "/superior/leaves-approval", label: "Leave Approvals", icon: "📅" },
      { id: "justification", path: "/superior/justifications-approval", label: "Justifications Approvals", icon: "📝" },
      { id: "reports", path: "/superior/reports", label: "Team Reports", icon: "📈" },
      { id: "allrequests", path: "/all-requests", label: "All Requests", icon: "📋" }
    ],
    employee: [
      { id: "dashboard", path: "/", label: "Dashboard", icon: "📊" },
      { id: "attendance", path: "/attendance", label: "My Attendance", icon: "🕒" },
      { id: "leave", path: "/leave", label: "My Leave", icon: "📅" },
      { id: "justification", path: "/justification", label: "My Justifications", icon: "📝" },
      // { id: "profile", path: "/profile", label: "Profile", icon: "👤" }
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
            <span className="text-blue-400 mr-2">
            <img src={myIcon} alt="icon" width="50" height="50" />
            </span>
            Realize
          </h2>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-gray-700 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? "➡️" : "⬅️"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
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


    </div>
  );
};

export default Sidebar;