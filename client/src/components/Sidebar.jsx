import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import api from "../api/axios";
import Avatar from "./Avatar";

/* ─────────────────────────────────────────
   SVG icons — inline so no icon lib needed
───────────────────────────────────────── */
const Icons = {
  Home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Explore: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  Connect: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Message: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Profile: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Create: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
};

const Sidebar = () => {
  const { user: currentUser } = useAuth();
  const { unreadCount: notificationsCount, pendingConnectionCount } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Fetch pending connections count and unread message count
  const fetchBadgeCounts = async () => {
    if (!currentUser) return;
    try {
      const [unreadMsgRes] = await Promise.all([
        api.get("/messages/unread-count"),
      ]);
      if (unreadMsgRes.data.success) {
        setUnreadMessagesCount(unreadMsgRes.data.count);
      }
    } catch (err) {
      console.error("Failed to load badge counts in Sidebar:", err);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchBadgeCounts();

    const interval = setInterval(() => {
      fetchBadgeCounts();
    }, 30000); // refresh every 30s

    return () => clearInterval(interval);
  }, [currentUser, location.pathname]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchStats = async () => {
      try {
        const [profileRes, postsRes] = await Promise.all([
          api.get(`/posts/profile/${currentUser.username}`),
          api.get(`/posts/user/${currentUser.username}?limit=1`),
        ]);
        if (profileRes.data.success && postsRes.data.success) {
          setStats({
            // FIX: Use totalPosts from API, fall back to auth context postsCount
            posts:     postsRes.data.totalPosts || currentUser.postsCount || 0,
            followers: profileRes.data.user.followers?.length || 0,
            following: profileRes.data.user.following?.length || 0,
          });
        }
      } catch {
        setStats({
          // FIX: Use postsCount from auth context (updated by CreatePost) instead of 0
          posts:     currentUser.postsCount || 0,
          followers: currentUser.followers?.length || 0,
          following: currentUser.following?.length || 0,
        });
      }
    };
    fetchStats();
  }, [currentUser, location.pathname]);

  if (!currentUser) return null;

  const navItems = [
    { label: "Home",          path: "/",                                Icon: Icons.Home    },
    { label: "Explore",       path: "/explore",                         Icon: Icons.Explore },
    { label: "Notifications", path: "/notifications",                   Icon: Icons.Bell,    badge: notificationsCount },
    { label: "Connect",       path: "/connect",                         Icon: Icons.Connect, badge: pendingConnectionCount },
    { label: "Messages",      path: "/messages",                        Icon: Icons.Message, badge: unreadMessagesCount },
    { label: "Profile",       path: `/profile/${currentUser.username}`, Icon: Icons.Profile },
    { label: "Create Post",   path: "/create",                          Icon: Icons.Create  },
  ];

  return (
    <aside className="flex flex-col justify-between py-5 select-none w-full h-full overflow-y-auto">

      {/* ── Navigation Links ── */}
      <nav className="flex flex-col gap-1 px-3">
        {navItems.map(({ label, path, Icon, badge }) => (
          <NavLink
            key={label}
            to={path}
            className={({ isActive }) =>
              `group/item relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-[#6C63FF]/20 to-[#FF6584]/10 text-[var(--primary)] shadow-[0_0_12px_var(--primary-glow)]"
                  : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active left-border bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-[#6C63FF] to-[#FF6584]" />
                )}

                {/* Icon */}
                <span className={`transition-transform duration-200 group-hover/item:scale-110 ${isActive ? "text-[var(--primary)]" : ""}`}>
                  <Icon />
                </span>

                {/* Label — always visible */}
                <span className="text-[14px] font-medium whitespace-nowrap flex-1">
                  {label}
                </span>

                {/* Notification/Connection/Messages badge */}
                {badge > 0 && (
                  <span className="flex-shrink-0 bg-red-500 text-white text-[9px] font-bold rounded-full w-[16px] h-[16px] flex items-center justify-center border border-[var(--surface)] animate-pulse">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom: Premium Profile Card ── */}
      <div className="flex flex-col">
        {/* Premium profile card */}
        <div
          className="mx-3 mb-2 p-3.5 rounded-2xl cursor-pointer transition-all duration-300"
          style={{
            border:     "1px solid var(--border)",
            background: "linear-gradient(135deg, rgba(108,99,255,0.06), rgba(255,101,132,0.06))",
            boxShadow:  "0 0 20px rgba(108,99,255,0.07)",
          }}
          onClick={() => navigate(`/profile/${currentUser.username}`)}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "rgba(108,99,255,0.27)";
            e.currentTarget.style.boxShadow   = "0 0 24px rgba(108,99,255,0.15)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow   = "0 0 20px rgba(108,99,255,0.07)";
          }}
        >
          {/* Top row — avatar + name */}
          <div className="flex items-center gap-2.5 mb-3">
            <Avatar user={currentUser} size="sm" showRing showOnlineStatus={false} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[13px] truncate" style={{ color: "var(--text)" }}>
                {currentUser.name}
              </p>
              <p className="text-[11px] truncate" style={{ color: "var(--muted)" }}>
                @{currentUser.username}
              </p>
            </div>
            {currentUser.isVerified && (
              <span className="text-[11px] font-bold" style={{ color: "#6C63FF" }}>✓</span>
            )}
          </div>

          {/* Divider */}
          <div className="h-px mb-3" style={{ background: "var(--border)" }} />

          {/* Stats row */}
          <div className="flex justify-between text-center">
            {[
              { label: "Posts",     value: stats.posts },
              { label: "Followers", value: stats.followers },
              { label: "Following", value: stats.following },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-bold text-[13px]" style={{ color: "var(--text)" }}>{value}</p>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer text */}
        <div className="px-4 pb-3 text-center">
          <p className="text-[10px] tracking-widest uppercase" style={{ color: "var(--muted-faint)" }}>
            v1.0.0 · Built for CodeAlpha
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
