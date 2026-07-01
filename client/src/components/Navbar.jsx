import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import Avatar from "./Avatar";
import NotificationDropdown from "./NotificationDropdown";
import { ThemeContext } from "../context/ThemeContext";

const Navbar = () => {
  const { user: currentUser, logout } = useAuth();
  const { unreadCount } = useSocket();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const userDropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  // Sync search input value with URL q parameter if on explore page
  useEffect(() => {
    if (location.pathname === "/explore") {
      setSearchVal(searchParams.get("q") || "");
    } else {
      setSearchVal("");
    }
  }, [searchParams, location.pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setShowUserDropdown(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchVal(value);
    // Keep URL parameter up to date
    navigate(`/explore?q=${encodeURIComponent(value)}`);
  };

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
    toast.success("Logged out successfully", {
      style: {
        background: "#1E1E2E",
        color: "#F5F5FF",
        border: "1px solid #3A3A5E",
      },
    });
    navigate("/login");
  };

  if (!currentUser) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full h-16 bg-[#1E1E2E]/80 backdrop-blur-md border-b border-[#3A3A5E] select-none shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        
        {/* Left Side: Brand Logo */}
        <Link to="/" className="flex items-center gap-1.5 focus:outline-none">
          <span className="font-bold text-xl bg-gradient-to-r from-[#6C63FF] to-[#FF6584] bg-clip-text text-transparent tracking-wide">
            LinkSphere
          </span>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-[#FF6584]/20 text-[#FF6584] border border-[#FF6584]/30 leading-none">
            AI
          </span>
        </Link>

        {/* Center: Search Bar (Hidden on Mobile) */}
        <div className="hidden md:flex items-center relative">
          <span className="absolute left-3 text-[#A0A0C0] text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search LinkSphereAI..."
            value={searchVal}
            onChange={handleSearchChange}
            className="bg-[#2A2A3E] border border-[#3A3A5E]/60 text-white placeholder-[#A0A0C0]/65 text-xs rounded-full pl-9 pr-4 py-2 w-64 focus:border-[#6C63FF] focus:outline-none transition-all duration-300"
          />
        </div>

        {/* Right Side: Operations Row */}
        <div className="flex items-center gap-4">
          
          {/* Create Post Button (Hidden on Mobile) */}
          <Link
            to="/create"
            className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-[#6C63FF] to-[#FF6584] hover:opacity-90 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all duration-200 shadow-md shadow-[#6C63FF]/20"
          >
            <span>✏️</span>
            <span>Post</span>
          </Link>

          {/* Notification Bell Icon */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserDropdown(false);
              }}
              title="Notifications"
              className="text-[#A0A0C0] hover:text-white transition duration-200 relative focus:outline-none flex items-center p-1.5 rounded-lg hover:bg-[#2A2A3E]/60"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full px-1 min-w-[15px] h-[15px] flex items-center justify-center border border-[#1E1E2E] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Component */}
            <NotificationDropdown
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
            />
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="text-[#A0A0C0] hover:text-white transition duration-200 focus:outline-none flex items-center p-1.5 rounded-lg hover:bg-[#2A2A3E]/60 text-xl"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>

          {/* User Settings Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowNotifications(false);
              }}
              className="focus:outline-none ring-2 ring-transparent hover:ring-[#6C63FF]/40 rounded-full transition duration-200 flex items-center"
            >
              <Avatar user={currentUser} size="sm" showOnlineStatus={false} />
            </button>

            {showUserDropdown && (
              <div className="absolute top-12 right-0 w-44 bg-[#1E1E2E] border border-[#3A3A5E] rounded-xl shadow-2xl py-1.5 z-50 animate-fadeIn select-none">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    navigate(`/profile/${currentUser.username}`);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#F5F5FF] hover:bg-[#2A2A3E] transition duration-150 font-medium"
                >
                  👤 View Profile
                </button>
                
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    toast.success("Settings feature coming soon!", {
                      style: {
                        background: "#1E1E2E",
                        color: "#F5F5FF",
                        border: "1px solid #3A3A5E",
                      },
                    });
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#F5F5FF] hover:bg-[#2A2A3E] transition duration-150 font-medium"
                >
                  ⚙️ Settings
                </button>

                <div className="h-px bg-[#3A3A5E]/40 my-1" />
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#2A2A3E] transition duration-150 font-medium"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
