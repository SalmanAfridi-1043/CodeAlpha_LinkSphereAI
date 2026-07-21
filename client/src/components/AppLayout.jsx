import { Outlet, NavLink } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import RightPanel from "./RightPanel";
import useAuth from "../hooks/useAuth";

const AppLayout = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div
      className="min-h-screen font-sans select-none overflow-x-hidden"
      style={{ color: "var(--text)" }}
    >
      {/* Subtle dot-grid background pattern */}
      <div className="app-bg-pattern" aria-hidden="true" />

      {/* Top Navbar */}
      <Navbar />

      {/* Main Layout */}
      <div className="flex min-h-screen">

        {/* Left Sidebar — fixed, always full width, hidden on mobile */}
        <aside
          className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 hidden md:flex flex-col border-r border-[var(--border)] bg-[var(--bg-card)] overflow-y-auto z-30"
        >
          <Sidebar />
        </aside>

        {/* Center Content — offset for sidebar on md+, sidebar+right on lg+ */}
        <main className="flex-1 md:ml-64 lg:mr-80 pt-16 pb-16 md:pb-0 min-h-screen overflow-x-hidden">
          <div className="max-w-[620px] w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 animate-fadeIn">
            <Outlet />
          </div>
        </main>

        {/* Right Panel — fixed, visible on lg+ */}
        <aside
          className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 hidden lg:flex flex-col border-l"
          style={{
            background:  "transparent",
            borderColor: "var(--glass-border)",
          }}
        >
          <RightPanel />
        </aside>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 h-14 bg-[var(--bg-card)]/90 backdrop-blur-md border-t border-[var(--border)] flex md:hidden items-center justify-around px-2 z-40 pb-[env(safe-area-inset-bottom)]"
      >
        <NavLink to="/" className={({ isActive }) => `flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ${isActive ? "bg-gradient-to-br from-[#6C63FF]/25 to-[#FF6584]/10 text-[var(--primary)] scale-105 shadow-[0_0_16px_var(--primary-glow)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </NavLink>
        <NavLink to="/explore" className={({ isActive }) => `flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ${isActive ? "bg-gradient-to-br from-[#6C63FF]/25 to-[#FF6584]/10 text-[var(--primary)] scale-105 shadow-[0_0_16px_var(--primary-glow)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </NavLink>
        <NavLink to="/create" className={({ isActive }) => `flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ${isActive ? "bg-gradient-to-br from-[#6C63FF]/25 to-[#FF6584]/10 text-[var(--primary)] scale-105 shadow-[0_0_16px_var(--primary-glow)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        </NavLink>
        <NavLink to={`/profile/${user.username}`} className={({ isActive }) => `flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300 ${isActive ? "bg-gradient-to-br from-[#6C63FF]/25 to-[#FF6584]/10 text-[var(--primary)] scale-105 shadow-[0_0_16px_var(--primary-glow)]" : "text-[var(--muted)] hover:text-[var(--text)]"}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </NavLink>
      </nav>
    </div>
  );
};

export default AppLayout;
