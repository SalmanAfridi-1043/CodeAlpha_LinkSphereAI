import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Spinner from "./Spinner";
import Avatar from "./Avatar";
import useSuggestions from "../hooks/useSuggestions";

const RightPanel = () => {
  const { suggestions, loading, setSuggestions, refresh } = useSuggestions();
  const [followingIds, setFollowingIds] = useState(new Set());
  const navigate = useNavigate();

  const handleFollow = async (userId) => {
    setFollowingIds((prev) => new Set([...prev, userId]));
    try {
      await api.post(`/follow/${userId}`);
      toast.success("Followed successfully!");
    } catch (err) {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      toast.error("Failed to follow");
    }
  };

  const renderSkeletons = () => (
    <div className="space-y-1">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-[var(--bg-hover)]" style={{ backgroundColor: "var(--surface-3)" }} />
          <div className="flex-1">
            <div className="h-3 w-24 rounded mb-1.5" style={{ backgroundColor: "var(--surface-3)" }} />
            <div className="h-2 w-16 rounded" style={{ backgroundColor: "var(--surface-3)" }} />
          </div>
          <div className="h-7 w-16 rounded-full" style={{ backgroundColor: "var(--surface-3)" }} />
        </div>
      ))}
    </div>
  );

  return (
    <aside
      className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 py-6 px-4 overflow-y-auto hidden lg:block select-none no-scrollbar"
      style={{ borderLeft: "1px solid var(--border-light)" }}
    >
      {/* Who to Follow */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-sm tracking-wide" style={{ color: "var(--text)" }}>
            Who to follow
          </h3>
          <Link
            to="/explore"
            className="text-xs font-semibold hover:underline transition"
            style={{ color: "var(--primary)" }}
          >
            Show more
          </Link>
        </div>

        <div
          className="rounded-2xl p-2 space-y-1"
          style={{
            background: "color-mix(in srgb, var(--surface) 60%, transparent)",
            border:     "1px solid var(--border-light)",
            backdropFilter: "blur(12px)",
          }}
        >
          {loading ? (
            renderSkeletons()
          ) : suggestions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-[var(--text-muted)] text-[13px]" style={{ color: "var(--muted)" }}>
                Follow more people to get better suggestions
              </p>
            </div>
          ) : (
            <>
              {suggestions.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--surface-2)] transition cursor-pointer group"
                >
                  {/* Clickable Avatar → goes to profile */}
                  <div onClick={() => navigate(`/profile/${user.username}`)}>
                    <Avatar
                      user={user}
                      size="sm"
                      showRing={false}
                    />
                  </div>

                  {/* Info column → clickable → profile */}
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => navigate(`/profile/${user.username}`)}
                  >
                    {/* Name row */}
                    <div className="flex items-center gap-1">
                      <p className="text-[var(--text)] text-[13px] font-semibold truncate hover:underline" style={{ color: "var(--text)" }}>
                        {user.name}
                      </p>
                      {user.isVerified && (
                        <span className="text-[#6C63FF] text-[10px]">✓</span>
                      )}
                    </div>

                    {/* Username */}
                    <p className="text-[var(--muted)] text-[11px] truncate" style={{ color: "var(--muted)" }}>
                      @{user.username}
                    </p>

                    {/* Mutual followers hint */}
                    {user.mutualFollowersCount > 0 && (
                      <p className="text-[#6C63FF] text-[10px] mt-0.5" style={{ color: "var(--primary)" }}>
                        {user.mutualFollowersCount} mutual follower
                        {user.mutualFollowersCount > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  {/* Follow button */}
                  <button
                    onClick={() => handleFollow(user._id)}
                    disabled={followingIds.has(user._id)}
                    className={`text-[12px] px-3 py-1.5 rounded-full font-medium transition flex-shrink-0 ${
                      followingIds.has(user._id)
                        ? "bg-[var(--surface-3)] text-[var(--muted)] cursor-default"
                        : "bg-gradient-to-r from-[#6C63FF] to-[#FF6584] text-white hover:shadow-[0_0_12px_#6C63FF44]"
                    }`}
                  >
                    {followingIds.has(user._id) ? "Following ✓" : "Follow"}
                  </button>
                </div>
              ))}

              <button
                onClick={refresh}
                className="text-[#6C63FF] text-[12px] font-medium hover:underline mt-1 w-full text-center py-1 bg-transparent border-none cursor-pointer"
                style={{ color: "var(--primary)" }}
              >
                Show more →
              </button>
            </>
          )}
        </div>
      </div>

      {/* Trending Tags / Platform card */}
      <div className="mb-6">
        <h3 className="font-bold text-sm tracking-wide mb-3" style={{ color: "var(--text)" }}>
          About LinkSphereAI
        </h3>
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: "var(--surface)",
            border:     "1px solid var(--border)",
            boxShadow:  "var(--shadow-sm)",
          }}
        >
          {[
            { icon: "🌍", title: "Global Community",    desc: "Connecting developers worldwide, growing daily." },
            { icon: "⚡", title: "Real-Time Sync",      desc: "Powered by Socket.io — instant likes, follows, comments." },
            { icon: "🚀", title: "MERN Stack",          desc: "MongoDB · Express · React · Node.js" },
            { icon: "🔒", title: "JWT Secure Auth",     desc: "Encrypted tokens, safe sessions." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="text-base mt-0.5 flex-shrink-0">{icon}</span>
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{title}</p>
                <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: "var(--muted)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-[10px] px-1 leading-relaxed space-y-1" style={{ color: "var(--muted-faint)" }}>
        <p className="hover:text-[var(--muted)] cursor-pointer transition">
          Terms · Privacy · About · CodeAlpha
        </p>
        <p className="font-mono" style={{ color: "color-mix(in srgb, var(--muted) 40%, transparent)" }}>
          © 2026 LinkSphereAI · v1.0.0
        </p>
      </div>
    </aside>
  );
};

export default RightPanel;
