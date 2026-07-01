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
            <div className="flex justify-center py-6">
              <Spinner size="sm" color="var(--primary)" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-6 text-xs font-medium" style={{ color: "var(--muted)" }}>
              No suggestions found
            </div>
          ) : (
            suggestions.map((user) => (
              <UserListItem
                key={user._id}
                user={user}
                size="sm"
              />
            ))
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
