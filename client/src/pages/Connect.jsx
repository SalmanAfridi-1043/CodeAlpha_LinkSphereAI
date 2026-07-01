import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import { useSocket } from "../context/SocketContext";
import Avatar from "../components/Avatar";
import ConnectionButton from "../components/ConnectionButton";
import Spinner from "../components/Spinner";

const Connect = () => {
  const { user: currentUser } = useAuth();
  const { isUserOnline } = useSocket();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("find"); // "find" | "pending" | "connections"
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("name"); // "username" | "github" | "name" | "website"
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingPending, setLoadingPending] = useState(false);

  const [myConnections, setMyConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

  // Fetch pending requests count on mount/interval
  const fetchPendingRequests = async (silent = false) => {
    if (!silent) setLoadingPending(true);
    try {
      const { data } = await api.get("/connections/pending");
      if (data.success) {
        setPendingRequests(data.requests);
        setPendingCount(data.count);
      }
    } catch (err) {
      console.error("Failed to fetch pending requests:", err);
    } finally {
      if (!silent) setLoadingPending(false);
    }
  };

  const fetchConnections = async () => {
    setLoadingConnections(true);
    try {
      const { data } = await api.get("/connections");
      if (data.success) {
        setMyConnections(data.connections);
      }
    } catch (err) {
      console.error("Failed to fetch connections:", err);
    } finally {
      setLoadingConnections(false);
    }
  };

  // Perform search
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await api.get(
        `/connections/find?q=${encodeURIComponent(searchQuery.trim())}&type=${searchType}`
      );
      if (data.success) {
        setSearchResults(data.users);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to search people");
    } finally {
      setSearching(false);
    }
  };

  // Trigger search on query/type change with debounce or simple submit
  useEffect(() => {
    if (searchQuery.trim()) {
      const delayDebounce = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(delayDebounce);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchType]);

  // Load content based on active tab
  useEffect(() => {
    if (activeTab === "pending") {
      fetchPendingRequests();
    } else if (activeTab === "connections") {
      fetchConnections();
    }
  }, [activeTab]);

  // Fetch initial pending requests count on tab mount
  useEffect(() => {
    fetchPendingRequests(true);
  }, []);

  const handleRespond = async (connectionId, action) => {
    try {
      const { data } = await api.put(`/connections/respond/${connectionId}`, { action });
      if (data.success) {
        toast.success(action === "accept" ? "Connection request accepted!" : "Request declined");
        fetchPendingRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to respond to request");
    }
  };

  return (
    <div className="w-full min-h-screen pb-12 select-none">
      <div className="flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Connect with People</h1>
          <p className="text-xs text-[var(--muted)]">
            Grow your professional network, search developers, and coordinate messages.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] max-w-md">
          {[
            { id: "find", label: "Find People" },
            {
              id: "pending",
              label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ""}`,
              badge: pendingCount,
            },
            { id: "connections", label: "Connections" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all duration-300 relative ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                  : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {tab.label}
              {tab.badge > 0 && activeTab !== tab.id && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>
          ))}
        </div>

        {/* Tab 1: Find People */}
        {activeTab === "find" && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            {/* Search inputs */}
            <div className="flex flex-col gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <form onSubmit={handleSearch} className="relative flex items-center">
                <input
                  type="text"
                  placeholder={`Search by ${searchType}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field w-full text-[var(--text)] text-xs rounded-full pl-10 pr-4 py-3 focus:outline-none"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }}
                />
                <span className="absolute left-3.5 text-[var(--muted)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
                  </svg>
                </span>
              </form>

              {/* Type selector pills */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted-faint)] mr-1">
                  Search By:
                </span>
                {[
                  { id: "name", label: "Name" },
                  { id: "username", label: "Username" },
                  { id: "github", label: "GitHub" },
                  { id: "website", label: "Website" },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSearchType(type.id);
                      setSearchResults([]);
                    }}
                    className={`px-3.5 py-1.5 text-[11px] font-bold rounded-full transition-all duration-200 border ${
                      searchType === type.id
                        ? "border-[#6C63FF] bg-gradient-to-r from-[#6C63FF]/20 to-[#FF6584]/10 text-[var(--primary)] shadow-[0_0_10px_var(--primary-glow)]"
                        : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            {searching ? (
              <div className="flex justify-center py-12">
                <Spinner size="md" color="var(--primary)" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="flex flex-col gap-3">
                {searchResults.map((user) => {
                  const hasGitHub = user.website && user.website.includes("github.com");
                  const shortWebsite = user.website
                    ? user.website.replace(/^https?:\/\/(www\.)?/, "")
                    : "";

                  return (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-primary/30 transition-all duration-300 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          user={user}
                          size="md"
                          showOnlineStatus={isUserOnline(user._id)}
                          showRing={true}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-sm text-white hover:underline cursor-pointer" onClick={() => navigate(`/profile/${user.username}`)}>
                              {user.name}
                            </span>
                            {user.isVerified && (
                              <span className="text-[#6C63FF] text-[10px]">✓</span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--muted)]">@{user.username}</p>
                          {user.bio && (
                            <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-1">
                              {user.bio}
                            </p>
                          )}
                          {user.website && (
                            <a
                              href={user.website.startsWith("http") ? user.website : `https://${user.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-primary hover:underline"
                            >
                              <span>🔗</span>
                              <span className="truncate max-w-[150px]">{hasGitHub ? `GitHub: ${shortWebsite}` : shortWebsite}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0 ml-3">
                        <ConnectionButton
                          targetUserId={user._id}
                          targetUsername={user.username}
                          initialStatus={user.isConnected ? "accepted" : (user.isPending ? "pending" : null)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : searchQuery.trim() ? (
              <div className="text-center py-12 p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                <span className="text-3xl mb-3 block">🔍</span>
                <p className="text-white font-semibold text-sm">No results found</p>
                <p className="text-[var(--muted)] text-xs mt-1">Try expanding your search query or change search filters.</p>
              </div>
            ) : (
              <div className="text-center py-16 p-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/30">
                <span className="text-3xl mb-3 block">🌐</span>
                <p className="text-white font-semibold text-sm">Search For People</p>
                <p className="text-[var(--muted)] text-xs mt-1 max-w-xs mx-auto">
                  Find developers and connections using their name, username, GitHub link, or website.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pending Requests */}
        {activeTab === "pending" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {loadingPending ? (
              <div className="flex justify-center py-12">
                <Spinner size="md" color="var(--primary)" />
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="flex flex-col gap-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar user={req.sender} size="md" showRing={true} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span
                            onClick={() => navigate(`/profile/${req.sender.username}`)}
                            className="font-semibold text-sm text-white hover:underline cursor-pointer"
                          >
                            {req.sender.name}
                          </span>
                          {req.sender.isVerified && (
                            <span className="text-[#6C63FF] text-[10px]">✓</span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--muted)]">@{req.sender.username}</p>
                        {req.sender.bio && (
                          <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-1">
                            {req.sender.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleRespond(req._id, "accept")}
                        className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:opacity-90 shadow-sm transition"
                      >
                        Accept ✓
                      </button>
                      <button
                        onClick={() => handleRespond(req._id, "reject")}
                        className="px-4 py-2 text-xs font-semibold text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-xl hover:bg-red-500/5 transition"
                      >
                        Decline ✗
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 p-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/30">
                <span className="text-3xl mb-3 block">🤝</span>
                <p className="text-white font-semibold text-sm">No Pending Requests</p>
                <p className="text-[var(--muted)] text-xs mt-1">
                  Incoming connection invitations will show up here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: My Connections */}
        {activeTab === "connections" && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {loadingConnections ? (
              <div className="flex justify-center py-12">
                <Spinner size="md" color="var(--primary)" />
              </div>
            ) : myConnections.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myConnections.map((user) => (
                  <div
                    key={user._id}
                    className="flex flex-col items-center justify-between p-5 text-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-primary/30 hover:shadow-[0_0_15px_var(--primary-glow)] transition-all duration-300 gap-4"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Avatar
                        user={user}
                        size="lg"
                        showOnlineStatus={isUserOnline(user._id)}
                        showRing={true}
                      />
                      <div className="mt-1">
                        <div className="flex items-center justify-center gap-1">
                          <span
                            onClick={() => navigate(`/profile/${user.username}`)}
                            className="font-semibold text-sm text-white hover:underline cursor-pointer"
                          >
                            {user.name}
                          </span>
                          {user.isVerified && (
                            <span className="text-[#6C63FF] text-[10px]">✓</span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--muted)]">@{user.username}</p>
                      </div>
                      {user.bio && (
                        <p className="text-[11px] text-[var(--muted)] line-clamp-2 mt-1 leading-relaxed px-2">
                          {user.bio}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => navigate(`/messages/${user.username}`)}
                      className="w-full btn-primary py-2 px-4 text-xs font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <span>Message</span>
                      <span>💬</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 p-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/30">
                <span className="text-3xl mb-3 block">👥</span>
                <p className="text-white font-semibold text-sm">No Connections Yet</p>
                <p className="text-[var(--muted)] text-xs mt-1">
                  Connect with other users to start messaging and sharing ideas.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Connect;
