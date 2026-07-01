import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import api from "../api/axios";
import Avatar from "./Avatar";
import NotificationDropdown from "./NotificationDropdown";
import { ThemeContext } from "../context/ThemeContext";
import LogoBadge from "./LogoBadge";

/* ─── Inline SVG Logo — crisp at all sizes ─── */
const LinkSphereLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6C63FF" />
        <stop offset="100%" stopColor="#FF6584" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {/* Outer circle */}
    <circle cx="16" cy="16" r="14" stroke="url(#lsGrad)" strokeWidth="1.5" fill="none" />
    {/* Network nodes */}
    <circle cx="16" cy="6"  r="2.2" fill="url(#lsGrad)" filter="url(#glow)" />
    <circle cx="26" cy="12" r="2.2" fill="url(#lsGrad)" filter="url(#glow)" />
    <circle cx="26" cy="22" r="2.2" fill="url(#lsGrad)" filter="url(#glow)" />
    <circle cx="16" cy="26" r="2.2" fill="url(#lsGrad)" filter="url(#glow)" />
    <circle cx="6"  cy="22" r="2.2" fill="url(#lsGrad)" filter="url(#glow)" />
    <circle cx="6"  cy="12" r="2.2" fill="url(#lsGrad)" filter="url(#glow)" />
    {/* Center hub */}
    <circle cx="16" cy="16" r="3"   fill="url(#lsGrad)" filter="url(#glow)" />
    {/* Connecting lines */}
    <line x1="16" y1="8"  x2="16" y2="13" stroke="url(#lsGrad)" strokeWidth="1" strokeOpacity="0.7" />
    <line x1="24.3" y1="13" x2="19" y2="15" stroke="url(#lsGrad)" strokeWidth="1" strokeOpacity="0.7" />
    <line x1="24.3" y1="21" x2="19" y2="17" stroke="url(#lsGrad)" strokeWidth="1" strokeOpacity="0.7" />
    <line x1="16" y1="24" x2="16" y2="19" stroke="url(#lsGrad)" strokeWidth="1" strokeOpacity="0.7" />
    <line x1="7.7"  y1="21" x2="13" y2="17" stroke="url(#lsGrad)" strokeWidth="1" strokeOpacity="0.7" />
    <line x1="7.7"  y1="13" x2="13" y2="15" stroke="url(#lsGrad)" strokeWidth="1" strokeOpacity="0.7" />
  </svg>
);

/* ─── Sun/Moon icons ─── */
const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 w-[18px] h-[18px]">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);
const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);
const StatsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[20px] h-[20px]">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4"  />
    <line x1="6"  y1="20" x2="6"  y2="14" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const Navbar = () => {
  const { user: currentUser, logout } = useAuth();
  const { unreadCount } = useSocket();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [showUserDropdown,    setShowUserDropdown]    = useState(false);
  const [showNotifications,   setShowNotifications]   = useState(false);
  const [showStatsDropdown,   setShowStatsDropdown]   = useState(false);
  const [searchVal,           setSearchVal]           = useState("");
  const [userStats,           setUserStats]           = useState({ posts: 0, followers: 0, following: 0 });

  const userDropdownRef  = useRef(null);
  const notificationsRef = useRef(null);
  const statsRef         = useRef(null);

  /* Sync search input with URL */
  useEffect(() => {
    if (location.pathname === "/explore") {
      setSearchVal(searchParams.get("q") || "");
    } else {
      setSearchVal("");
    }
  }, [searchParams, location.pathname]);

  /* Fetch user stats when stats dropdown opens */
  useEffect(() => {
    if (!showStatsDropdown || !currentUser) return;
    const fetch = async () => {
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/posts/profile/${currentUser.username}`),
          api.get(`/posts/user/${currentUser.username}?limit=1`),
        ]);
        if (profileRes.data.success && postsRes.data.success) {
          setUserStats({
            posts:     postsRes.data.totalPosts || 0,
            followers: profileRes.data.user.followers?.length || 0,
            following: profileRes.data.user.following?.length || 0,
          });
        }
      } catch { /* silent */ }
    };
    fetch();
  }, [showStatsDropdown, currentUser]);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current  && !userDropdownRef.current.contains(e.target))  setShowUserDropdown(false);
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setShowNotifications(false);
      if (statsRef.current         && !statsRef.current.contains(e.target))         setShowStatsDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchVal(value);
    navigate(`/explore?q=${encodeURIComponent(value)}`);
  };

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const closeAll = () => {
    setShowUserDropdown(false);
    setShowNotifications(false);
    setShowStatsDropdown(false);
  };

  if (!currentUser) return null;

  /* Stat card data */
  const statItems = [
    { label: "Posts",     value: userStats.posts,     emoji: "📝" },
    { label: "Followers", value: userStats.followers,  emoji: "👥" },
    { label: "Following", value: userStats.following,  emoji: "➡️" },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 w-full h-16 select-none"
      style={{
        background:          "var(--glass-bg)",
        backdropFilter:      "blur(24px)",
        WebkitBackdropFilter:"blur(24px)",
        borderBottom:        "1px solid var(--glass-border)",
        boxShadow:           "var(--shadow-sm)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-4">

        {/* ── Logo ── */}
        <Link
          to="/"
          className="flex-shrink-0 focus:outline-none"
        >
          <LogoBadge />
        </Link>

        {/* ── Search Bar (center, hidden on mobile) ── */}
        <div className="hidden md:flex flex-1 max-w-sm mx-auto items-center relative">
          <span className="absolute left-3.5 pointer-events-none" style={{ color: "var(--muted)" }}>
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search people, posts..."
            value={searchVal}
            onChange={handleSearchChange}
            className="input-field w-full text-[var(--text)] text-xs rounded-full pl-10 pr-4 py-2.5 focus:outline-none transition-all duration-300"
            style={{
              background:   "var(--surface-2)",
              border:       "1px solid var(--border)",
              boxShadow:    "none",
              caretColor:   "var(--primary)",
            }}
          />
        </div>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">

          {/* Create Post — desktop only */}
          <Link
            to="/create"
            className="hidden md:flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2 rounded-full transition-all duration-200 btn-primary"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Post</span>
          </Link>

          {/* Stats Dropdown */}
          <div className="relative" ref={statsRef}>
            <button
              onClick={() => { setShowStatsDropdown(!showStatsDropdown); setShowUserDropdown(false); setShowNotifications(false); }}
              title="Your Stats"
              className="navbar-icon-btn flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
              style={{ color: showStatsDropdown ? "var(--primary)" : "var(--muted)" }}
            >
              <StatsIcon />
            </button>

            {showStatsDropdown && (
              <div
                className="absolute top-12 right-0 w-64 rounded-2xl p-4 z-50 animate-slideDown"
                style={{
                  background:   "var(--surface)",
                  border:       "1px solid var(--border)",
                  boxShadow:    "var(--shadow-md), 0 0 40px var(--primary-glow)",
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar user={currentUser} size="sm" showOnlineStatus={false} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{currentUser.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>@{currentUser.username}</p>
                  </div>
                </div>

                {/* Stat items */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {statItems.map(({ label, value, emoji }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center py-3 rounded-xl transition-colors duration-150"
                      style={{ background: "var(--surface-2)" }}
                    >
                      <span className="text-lg mb-0.5">{emoji}</span>
                      <span className="font-bold text-sm font-mono" style={{ color: "var(--text)" }}>{value}</span>
                      <span className="text-[10px]" style={{ color: "var(--muted)" }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Quick link */}
                <button
                  onClick={() => { navigate(`/profile/${currentUser.username}`); closeAll(); }}
                  className="w-full py-2 rounded-xl text-xs font-bold transition-all duration-200 btn-primary"
                >
                  View Full Profile →
                </button>

                {/* Platform info */}
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: "var(--muted)" }}>
                    <span>🌍</span><span>Global Community</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] mt-1" style={{ color: "var(--muted)" }}>
                    <span>⚡</span><span>Real-time via Socket.io</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] mt-1" style={{ color: "var(--muted)" }}>
                    <span>🔒</span><span>JWT Secure Auth · MERN Stack</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowUserDropdown(false); setShowStatsDropdown(false); }}
              title="Notifications"
              className={`navbar-icon-btn relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${unreadCount > 0 ? "animate-[bellPulse_1.5s_ease_infinite]" : ""}`}
              style={{ color: showNotifications ? "var(--primary)" : "var(--muted)" }}
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center border border-[var(--surface)] animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <NotificationDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="navbar-icon-btn flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
            style={{ color: "var(--muted)" }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* User Dropdown */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => { setShowUserDropdown(!showUserDropdown); setShowNotifications(false); setShowStatsDropdown(false); }}
              className="focus:outline-none rounded-full transition-all duration-200"
              style={{ ring: showUserDropdown ? "2px solid var(--primary)" : undefined }}
            >
              <div className={`rounded-full transition-all duration-200 ${showUserDropdown ? "ring-2 ring-[var(--primary)]" : "hover:ring-2 hover:ring-[var(--border)]"}`}>
                <Avatar user={currentUser} size="sm" showOnlineStatus={false} />
              </div>
            </button>

            {showUserDropdown && (
              <div
                className="absolute top-12 right-0 w-48 rounded-2xl py-2 z-50 animate-slideDown overflow-hidden"
                style={{
                  background: "var(--surface)",
                  border:     "1px solid var(--border)",
                  boxShadow:  "var(--shadow-md)",
                }}
              >
                {/* User info header */}
                <div className="px-4 py-2 mb-1" style={{ borderBottom: "1px solid var(--border)" }}>
                  <p className="font-bold text-sm truncate" style={{ color: "var(--text)" }}>{currentUser.name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted)" }}>@{currentUser.username}</p>
                </div>

                <button
                  onClick={() => { closeAll(); navigate(`/profile/${currentUser.username}`); }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors duration-150 flex items-center gap-2.5"
                  style={{ color: "var(--text)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  View Profile
                </button>

                <button
                  onClick={() => { closeAll(); toast("Settings coming soon! ⚙️"); }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors duration-150 flex items-center gap-2.5"
                  style={{ color: "var(--text)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                  Settings
                </button>

                <div className="mx-3 my-1 h-px" style={{ background: "var(--border)" }} />

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors duration-150 flex items-center gap-2.5 text-red-400"
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <svg className="w-4 h-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign Out
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
