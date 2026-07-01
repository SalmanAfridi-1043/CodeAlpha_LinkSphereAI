// VERIFIED: components/AppLayout.jsx — no issues found
import { Outlet, NavLink } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import RightPanel from "./RightPanel";
import useAuth from "../hooks/useAuth";

const AppLayout = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Container */}
      <div className="flex flex-1 w-full max-w-7xl mx-auto relative">
        {/* Left Sidebar: Collapses to icon-only (w-16) on md-lg, hidden on mobile */}
        <Sidebar />

        {/* Center Content Column */}
        {/* Margins dynamically adjust: 
            - Mobile (<md): w-full, ml-0, mr-0, pt-16, pb-20 (extra spacing at bottom for mobile nav)
            - Tablet (md to lg): ml-16, mr-0
            - Desktop (>lg): ml-64, mr-80
        */}
        <main className="flex-1 w-full min-h-screen pt-16 pb-20 md:pb-6 ml-0 md:ml-16 lg:ml-64 mr-0 lg:mr-80 transition-all duration-300">
          <div className="animate-fadeIn w-full h-full">
            <Outlet />
          </div>
        </main>

        {/* Right Sidebar Panel: Visible only on lg+ screens (>= 1024px) */}
        <RightPanel />
      </div>

      {/* UI UPGRADED: AppLayout */}
      {/* Mobile Bottom Navigation Bar: Visible only on mobile (<md) */}
      <nav className="fixed bottom-0 left-0 right-0 glass h-14 z-40 flex md:hidden items-center justify-around px-6">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
              isActive
                ? "bg-gradient-to-br from-[#6C63FF]/20 to-[#FF6584]/05 text-primary scale-110 shadow-[0_0_15px_rgba(108,99,255,0.25)]"
                : "text-[#A0A0C0] hover:text-white"
            }`
          }
        >
          <span className="text-xl">🏠</span>
        </NavLink>

        <NavLink
          to="/explore"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
              isActive
                ? "bg-gradient-to-br from-[#6C63FF]/20 to-[#FF6584]/05 text-primary scale-110 shadow-[0_0_15px_rgba(108,99,255,0.25)]"
                : "text-[#A0A0C0] hover:text-white"
            }`
          }
        >
          <span className="text-xl">🔍</span>
        </NavLink>

        <NavLink
          to="/create"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
              isActive
                ? "bg-gradient-to-br from-[#6C63FF]/20 to-[#FF6584]/05 text-primary scale-110 shadow-[0_0_15px_rgba(108,99,255,0.25)]"
                : "text-[#A0A0C0] hover:text-white"
            }`
          }
        >
          <span className="text-xl">➕</span>
        </NavLink>

        <NavLink
          to={`/profile/${user.username}`}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
              isActive
                ? "bg-gradient-to-br from-[#6C63FF]/20 to-[#FF6584]/05 text-primary scale-110 shadow-[0_0_15px_rgba(108,99,255,0.25)]"
                : "text-[#A0A0C0] hover:text-white"
            }`
          }
        >
          <span className="text-xl">👤</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default AppLayout;
