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
  const { isUserOnline, pendingConnectionCount, setPendingConnectionCount, newConnectionRequest, setNewConnectionRequest } = useSocket();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("find"); // "find" | "pending" | "connections"
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("name"); // "username" | "github" | "name" | "website"
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

  const [myConnections, setMyConnections] = useState([]);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [loadingConnections, setLoadingConnections] = useState(false);

  // Clear connection and search states on user switch to prevent stale data display
  useEffect(() => {
    setSearchResults([]);
    setPendingRequests([]);
    setPendingConnectionCount(0);
    setMyConnections([]);
    setSearchQuery("");
  }, [currentUser]);

  // FIXED: State for "Connect via Profile Link" paste field
  const [pasteLink, setPasteLink] = useState("");

  const handlePasteLink = () => {
    const input = pasteLink.trim()
    if (!input) {
      toast.error('Please paste a profile link')
      return
    }

    // Must contain /profile/ to be valid
    if (!input.includes('/profile/')) {
      toast.error(
        'Please paste a valid profile link — ' +
        'e.g. linksphereai.vercel.app/profile/salman'
      )
      return
    }

    try {
      const url = new URL(
        input.startsWith('http')
          ? input
          : `https://${input}`
      )
      const parts = url.pathname.split('/')
      const idx = parts.indexOf('profile')
      const username = parts[idx + 1]

      if (!username) {
        toast.error('Could not find username in link')
        return
      }
      navigate(`/profile/${username}`)
    } catch {
      toast.error('Invalid link format')
    }
  };

  const fetchPending = async () => {
    setLoadingPending(true);
    try {
      const res = await api.get("/connections/pending");
      setPendingRequests(res?.data?.requests || []);
      setPendingConnectionCount(res?.data?.count || 0);
    } catch {
      setPendingRequests([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchConnections = async () => {
    setLoadingConnections(true);
    try {
      const res = await api.get("/connections");
      setMyConnections(res?.data?.connections || []);
      setConnectionsCount(res?.data?.count || 0);
    } catch (err) {
      console.error("Failed to fetch connections:", err);
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleSearch = async (query, searchType) => {
    if (!query || query.trim().length < 1) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await api.get(
        `/connections/find?q=${encodeURIComponent(query)}&type=${searchType}`
      )
      setSearchResults(res?.data?.users || [])
    } catch (err) {
      console.error('Search error:', err)
      setSearchResults([])
      toast.error('Search failed — try again')
    } finally {
      setSearching(false)
    }
  };

  // Trigger search on query/type change with debounce or simple submit
  useEffect(() => {
    if (searchQuery.trim()) {
      const delayDebounce = setTimeout(() => {
        handleSearch(searchQuery, searchType);
      }, 300);
      return () => clearTimeout(delayDebounce);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchType]);

  // Load content based on active tab
  useEffect(() => {
    if (activeTab === "pending") {
      fetchPending();
    } else if (activeTab === "connections") {
      fetchConnections();
    }
  }, [activeTab]);

  // Fetch initial pending requests count on tab mount
  useEffect(() => {
    fetchPending();
  }, []);

  // Re-fetch pending list whenever a new connection request arrives via socket
  useEffect(() => {
    if (newConnectionRequest) {
      fetchPending();
      setNewConnectionRequest(false); // reset flag after handling
    }
  }, [newConnectionRequest]);

  const handleRespond = async (connId, action) => {
    try {
      await api.put(
        `/connections/respond/${connId}`,
        { action }
      )
      toast.success(
        action === 'accept'
          ? 'Connection accepted! 🎉'
          : 'Request declined'
      )
      // Immediately re-fetch pending list
      fetchPending()
      // If accepted also re-fetch connections
      if (action === 'accept') {
        fetchConnections()
      }
    } catch (err) {
      toast.error('Action failed — try again')
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
              label: `Pending${pendingConnectionCount > 0 ? ` (${pendingConnectionCount})` : ""}`,
              badge: pendingConnectionCount,
            },
            { id: "connections", label: `Connections${connectionsCount > 0 ? ` (${connectionsCount})` : ""}` },
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

            {/* FIXED: Connect via Profile Link card */}
            <div className="flex flex-col gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <div>
                <p className="text-sm font-semibold text-white">Paste Profile Link</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Paste a LinkSphereAI profile link to visit and connect
                </p>
              </div>
              <div className="flex gap-2 flex-col">
                <div className="flex gap-2">
                  <input
                    value={pasteLink}
                    onChange={(e) => setPasteLink(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePasteLink()}
                    placeholder="https://linksphereai.vercel.app/profile/username"
                    className="flex-1 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                    }}
                  />
                  <button
                    onClick={handlePasteLink}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#FF6584] text-white text-xs font-semibold whitespace-nowrap hover:opacity-90 transition"
                  >
                    Go →
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  ℹ️ Only profile links work here.
                  Example: linksphereai.vercel.app/profile/salman
                </p>
              </div>
            </div>
            {/* Search inputs */}
            <div className="flex flex-col gap-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery, searchType); }} className="relative flex items-center">
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
                {searchResults.map(user => (
                  <div key={user._id}
                    className="flex items-center justify-between
                    p-3 rounded-xl hover:bg-[var(--bg-hover)]
                    transition">

                    {/* Left — avatar + info */}
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => navigate(`/profile/${user.username}`)}>
                      <Avatar
                        user={user}
                        src={user.avatar || ''}
                        name={user.name || 'U'}
                        size="md"
                      />
                      <div>
                        <p className="text-[var(--text-main)]
                          font-semibold text-[14px]">
                          {user.name || 'Unknown'}
                        </p>
                        <p className="text-[var(--text-muted)] text-[12px]">
                          @{user.username || 'unknown'}
                        </p>
                        {user.bio && (
                          <p className="text-[var(--text-muted)] text-[11px]
                            truncate max-w-[200px]">
                            {user.bio}
                          </p>
                        )}
                        {user.website && (
                          <p className="text-[#6C63FF] text-[11px]">
                            🔗 {user.website}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right — connect button */}
                    <ConnectionButton
                      targetUserId={user._id}
                      initialStatus={
                        user.isConnected ? 'accepted'
                        : user.isPending ? 'pending'
                        : null
                      }
                    />
                  </div>
                ))}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/messages');
                      }}
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
