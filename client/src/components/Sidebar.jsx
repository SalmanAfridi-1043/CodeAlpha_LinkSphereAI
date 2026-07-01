// VERIFIED: components/Sidebar.jsx — no issues found
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useSocket from "../hooks/useSocket";
import api from "../api/axios";
import Avatar from "./Avatar";

const Sidebar = () => {
  const { user: currentUser } = useAuth();
  const { unreadCount } = useSocket();
  const location = useLocation();

  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });

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
            posts: postsRes.data.totalPosts || 0,
            followers: profileRes.data.user.followers?.length || 0,
            following: profileRes.data.user.following?.length || 0,
          });
        }
      } catch (err) {
        console.error("Error fetching sidebar stats:", err);
        // Fallback to local context data if API fails
        setStats({
          posts: 0,
          followers: currentUser.followers?.length || 0,
          following: currentUser.following?.length || 0,
        });
      }
    };

    fetchStats();
  }, [currentUser, location.pathname]);

  if (!currentUser) return null;

  const navItems = [
    { label: "Home", path: "/", icon: "🏠" },
    { label: "Explore", path: "/explore", icon: "🔍" },
    { label: "Notifications", path: "/notifications", icon: "🔔", badge: unreadCount },
    { label: "Profile", path: `/profile/${currentUser.username}`, icon: "👤" },
    { label: "Create Post", path: "/create", icon: "✏️" },
  ];

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-16 lg:w-64 bg-[#1E1E2E] border-r border-[#3A3A5E] z-30 transition-all duration-300 flex flex-col justify-between py-6 px-3 select-none hidden md:flex">
      
      {/* Top Section Navigation Links */}
      <div className="flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition duration-200 relative ${
                isActive
                  ? "bg-[#6C63FF]/20 text-[#6C63FF] font-semibold"
                  : "text-[#A0A0C0] hover:bg-[#2A2A3E] hover:text-white"
              } justify-center lg:justify-start`
            }
            title={item.label}
          >
            <span className="text-xl flex items-center justify-center">{item.icon}</span>
            <span className="hidden lg:inline text-sm">{item.label}</span>
            
            {/* Unread Notifications Badge */}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="absolute lg:relative top-1.5 right-1.5 lg:top-auto lg:right-auto lg:ml-auto bg-red-500 text-white text-[9px] font-bold rounded-full px-1 min-w-[15px] h-[15px] flex items-center justify-center border border-[#1E1E2E] lg:border-none animate-pulse">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Middle Section: User Mini Card (Visible only on Desktop) */}
      <div className="hidden lg:flex flex-col items-center p-4 bg-[#2A2A3E]/30 rounded-2xl border border-[#3A3A5E]/40 mb-2">
        <NavLink to={`/profile/${currentUser.username}`} className="flex flex-col items-center">
          <Avatar user={currentUser} size="md" userId={currentUser._id} showOnlineStatus={true} />
          <span className="text-white font-semibold text-sm mt-2 hover:underline truncate max-w-[180px]">
            {currentUser.name}
          </span>
          <span className="text-[#A0A0C0] text-xs truncate max-w-[180px]">
            @{currentUser.username}
          </span>
        </NavLink>

        {/* Short Stat Row */}
        <div className="flex justify-around items-center w-full mt-4 pt-3 border-t border-[#3A3A5E]/40 text-[11px] text-[#A0A0C0]">
          <div className="text-center">
            <span className="block font-bold text-white text-xs">{stats.posts}</span>
            Posts
          </div>
          <div className="text-center">
            <span className="block font-bold text-white text-xs">{stats.followers}</span>
            Followers
          </div>
          <div className="text-center">
            <span className="block font-bold text-white text-xs">{stats.following}</span>
            Following
          </div>
        </div>
      </div>

      {/* Bottom Section: Branding (Visible only on Desktop) */}
      <div className="hidden lg:block text-center px-2">
        <p className="text-[11px] text-[#A0A0C0] font-semibold tracking-wide">
          LinkSphereAI
        </p>
        <p className="text-[9px] text-[#A0A0C0]/50 mt-0.5 leading-none">
          Built with ❤️ for CodeAlpha
        </p>
        <p className="text-[9px] font-mono text-[#A0A0C0]/40 mt-1 select-none">
          v1.0.0
        </p>
      </div>

    </aside>
  );
};

export default Sidebar;
