import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import UserListItem from "./UserListItem";
import Spinner from "./Spinner";

const RightPanel = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const { data } = await api.get("/users/suggestions");
        if (data.success) {
          setSuggestions(data.users.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to load suggestions in RightPanel:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const handleFollowToggle = (userId, newStatus) => {
    // Optionally update local list state if you want, e.g. remove or keep
    // For a cleaner UX, we can just let UserListItem manage its follow button internally
  };

  return (
    <aside className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-transparent py-6 px-4 overflow-y-auto hidden lg:block select-none border-l border-[#3A3A5E]/30">
      {/* Section 1: Who to Follow */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-bold text-sm tracking-wide">Who to follow</h3>
          <Link
            to="/explore"
            className="text-xs text-primary hover:text-primary/80 hover:underline transition font-semibold"
          >
            Show more
          </Link>
        </div>

        <div className="bg-[#1E1E2E]/60 backdrop-blur-md rounded-2xl border border-[#3A3A5E]/40 p-2 space-y-1">
          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner size="sm" color="#6C63FF" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#A0A0C0] font-medium">
              No suggestions found
            </div>
          ) : (
            suggestions.map((user) => (
              <UserListItem
                key={user._id}
                user={user}
                onFollowToggle={handleFollowToggle}
                size="sm"
              />
            ))
          )}
        </div>
      </div>

      {/* Section 2: Stats / Community Card */}
      <div className="mb-6">
        <h3 className="text-white font-bold text-sm tracking-wide mb-3">LinkSphere Stats</h3>
        <div className="bg-[#1E1E2E] rounded-2xl p-4 border border-[#3A3A5E] space-y-4 shadow-xl">
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">🌍</span>
            <div>
              <p className="text-xs font-semibold text-white">Global Community</p>
              <p className="text-[10px] text-[#A0A0C0] mt-0.5 leading-relaxed">
                Connecting developers and builders worldwide, growing daily.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">✨</span>
            <div>
              <p className="text-xs font-semibold text-white">Real-Time Sync</p>
              <p className="text-[10px] text-[#A0A0C0] mt-0.5 leading-relaxed">
                Powered by Socket.io for instant likes, comments, and follows.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">🚀</span>
            <div>
              <p className="text-xs font-semibold text-white font-mono">MERN Stack Tech</p>
              <p className="text-[10px] text-[#A0A0C0] mt-0.5 leading-relaxed">
                Built with MongoDB, Express, React, and Node.js.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">🔒</span>
            <div>
              <p className="text-xs font-semibold text-white">JWT Secure Auth</p>
              <p className="text-[10px] text-[#A0A0C0] mt-0.5 leading-relaxed">
                Robust token encryption, secure cookie store, and safe sessions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Footer */}
      <div className="text-[10px] text-[#A0A0C0]/75 px-2 leading-relaxed space-y-1">
        <p className="hover:text-[#A0A0C0] cursor-pointer transition">
          Terms · Privacy · About · CodeAlpha
        </p>
        <p className="font-medium text-[#A0A0C0]/50 font-mono">© 2026 LinkSphereAI</p>
      </div>
    </aside>
  );
};

export default RightPanel;
