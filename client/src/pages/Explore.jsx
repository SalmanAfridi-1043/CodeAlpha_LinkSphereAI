// VERIFIED: pages/Explore.jsx — no issues found
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Spinner from "../components/Spinner";
import PostCard from "../components/PostCard";
import UserListItem from "../components/UserListItem";
import Avatar from "../components/Avatar";
import usePageTitle from "../hooks/usePageTitle";
import UserItemSkeleton from "../components/skeletons/UserItemSkeleton";
import useSuggestions from "../hooks/useSuggestions";

const Explore = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  usePageTitle("Explore");
  const [posts, setPosts] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const { suggestions: suggestedUsers, loading: loadingSuggestions } = useSuggestions();
  const [followingIds, setFollowingIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync search input with URL query param q if present
  useEffect(() => {
    const query = searchParams.get("q");
    if (query !== null) {
      setSearchQuery(query);
    }
  }, [searchParams]);
  
  // Pagination & scrolling
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const observer = useRef();

  // Post detail modal popup state
  const [selectedPost, setSelectedPost] = useState(null);

  // Debouncing query state updates (exactly 400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle actual API search when debounced value updates
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const { data } = await api.get(`/users/search?q=${debouncedQuery.trim()}`);
        if (data.success) {
          setSearchResults(data.users);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Search request failed");
      } finally {
        setSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Fetch initial posts on mount
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    pageRef.current = 1;
    try {
      const { data } = await api.get("/posts/explore?page=1&limit=12");
      if (data.success) {
        setPosts(data.posts);
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load initial explore feed data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Fetch more posts on scroll
  const fetchMorePosts = async (pageNumber) => {
    setLoadingMore(true);
    try {
      const { data } = await api.get(`/posts/explore?page=${pageNumber}&limit=12`);
      if (data.success) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));
          const newPosts = data.posts.filter((p) => !existingIds.has(p._id));
          return [...prev, ...newPosts];
        });
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load more posts");
    } finally {
      setLoadingMore(false);
    }
  };

  // Scroll sentinel observer callback
  const lastPostRef = useCallback(
    (node) => {
      if (loading || loadingMore || searchQuery.trim()) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          const nextPage = pageRef.current + 1;
          pageRef.current = nextPage;
          fetchMorePosts(nextPage);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore, searchQuery]
  );

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

  const handleSearchFollowToggle = (userId, newStatus) => {
    setSearchResults((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, isFollowing: newStatus } : u))
    );
  };

  const renderSkeletons = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-pulse mt-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="aspect-square bg-[#1E1E2E] rounded-xl border border-[#3A3A5E]" />
      ))}
    </div>
  );

// UI UPGRADED: Explore
  return (
    <div className="w-full pb-12">
      <div className="w-full max-w-2xl mx-auto pt-4 px-4">
        {/* Sticky Search Input Bar */}
        <div className="sticky top-0 bg-[#0A0A14]/95 z-20 pb-4 backdrop-blur-md select-none">
          <div className="relative flex items-center">
            <span className={`absolute left-4 text-[#A0A0C0] transition-transform duration-500 z-10 ${isFocused ? "rotate-[360deg] text-primary" : ""}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass input-field text-white rounded-full pl-12 pr-4 w-full h-[52px] text-sm shadow-md"
            />
          </div>
        </div>

        {/* Searching Results View */}
        {searchQuery.trim().length > 0 ? (
          <div className="animate-fadeIn">
            <h2 className="text-[#A0A0C0] text-xs font-semibold uppercase tracking-wider mb-3">
              Search Results
            </h2>
            {searching ? (
              <div className="flex items-center justify-center py-10">
                <Spinner size="md" color="#6C63FF" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl p-8 text-center py-16 animate-fadeIn select-none">
                <span className="text-4xl mb-3 block select-none">🔍</span>
                <p className="text-white font-semibold mb-1">No users found for '{searchQuery}'</p>
                <p className="text-[#A0A0C0] text-xs">Try searching for another name or username</p>
              </div>
            ) : (
              <div className="bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl p-4 divide-y divide-[#3A3A5E]/20 space-y-1">
                {searchResults.map((user) => (
                  <UserListItem
                    key={user._id}
                    user={user}
                    onFollowToggle={handleSearchFollowToggle}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Explore Dashboard View */
          <div className="space-y-6 animate-fadeIn">
            {/* Suggested users panel */}
            {loadingSuggestions ? (
              <div>
                <h2 className="text-white font-semibold text-base mb-3 flex items-center gap-2 select-none">
                  <span>Suggested for you</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                </h2>
                <div className="bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl p-3 divide-y divide-[#3A3A5E]/10 space-y-1 shadow-lg">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-3 p-2.5 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-[var(--surface-3)]" />
                      <div className="flex-1">
                        <div className="h-3 w-24 rounded mb-1.5 bg-[var(--surface-3)]" />
                        <div className="h-2 w-16 rounded bg-[var(--surface-3)]" />
                      </div>
                      <div className="h-7 w-16 rounded-full bg-[var(--surface-3)]" />
                    </div>
                  ))}
                </div>
              </div>
            ) : suggestedUsers.length > 0 ? (
              <div>
                <h2 className="text-white font-semibold text-base mb-3 flex items-center gap-2 select-none">
                  <span>Suggested for you</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                </h2>
                <div
                  className="rounded-2xl p-3 space-y-1"
                  style={{
                    background: "var(--surface)",
                    border:     "1px solid var(--border)",
                    boxShadow:  "var(--shadow-md)",
                  }}
                >
                  <div className="flex md:grid md:grid-cols-3 gap-3 overflow-x-auto pb-3 md:pb-0 scroll-smooth no-scrollbar select-none">
                    {suggestedUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--surface-2)] transition cursor-pointer group min-w-[200px] md:min-w-0 flex-shrink-0"
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
                  </div>
                </div>
              </div>
            ) : null}

            {/* Explore posts list */}
            <div>
              <h2 className="text-white font-semibold text-base mb-3 select-none">
                Explore Posts
              </h2>

              {loading ? (
                renderSkeletons()
              ) : posts.length === 0 ? (
                <div className="bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl p-8 text-center py-16 animate-fadeIn select-none">
                  <span className="text-4xl mb-3 block select-none">🔭</span>
                  <p className="text-white font-semibold mb-1">Nothing to explore yet</p>
                  <p className="text-[#A0A0C0] text-xs">Check back later for new posts from the community</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Aspect Square Images/Gradients Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {posts.map((post, index) => {
                      const isLastElement = posts.length === index + 1;
                      
                      const elementContent = post.image ? (
                        <img
                          src={post.image}
                          alt="Explore grid thumbnail"
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 p-4 flex flex-col justify-between transition duration-300 group-hover:from-primary/30 group-hover:to-accent/30">
                          <p className="text-white text-xs leading-normal font-medium break-words overflow-hidden line-clamp-4">
                            {post.content}
                          </p>
                          <div className="flex justify-between items-center text-[10px] text-[#A0A0C0] select-none">
                            <span>@{post.user?.username || "user"}</span>
                            <span className="flex items-center gap-0.5">
                              ❤️ {post.likesCount}
                            </span>
                          </div>
                        </div>
                      );

                      return (
                        <div
                          key={post._id}
                          ref={isLastElement ? lastPostRef : null}
                          onClick={() => setSelectedPost(post)}
                          className="aspect-square bg-[#12121F] border border-[#2A2A40] rounded-[16px] overflow-hidden cursor-pointer relative group transition-all duration-300 hover:scale-[1.03] hover:border-primary/50 shadow-md flex-shrink-0"
                        >
                          {elementContent}
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 text-white font-bold select-none pointer-events-none z-10">
                            <div className="flex items-center gap-1.5 animate-[heartPop_0.3s_ease]">
                              <span>❤️</span>
                              <span className="font-mono text-sm">{post.likesCount}</span>
                            </div>
                            <div className="flex items-center gap-1.5 animate-[heartPop_0.3s_ease]" style={{ animationDelay: "0.05s" }}>
                              <span>💬</span>
                              <span className="font-mono text-sm">{post.commentsCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Load more spinner */}
                  {loadingMore && (
                    <div className="flex justify-center py-2">
                      <Spinner size="sm" color="#6C63FF" />
                    </div>
                  )}

                  {/* Caught up banner */}
                  {!hasMore && posts.length > 0 && (
                    <div className="text-center text-[#A0A0C0] text-xs py-4 font-medium select-none">
                      Finished loading all explore posts 🌍
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Interactive Post Card Overlay Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <PostCard
              post={selectedPost}
              onDelete={(postId) => {
                setPosts((prev) => prev.filter((p) => p._id !== postId));
                setSelectedPost(null);
              }}
              onUpdate={(updatedPost) => {
                setPosts((prev) =>
                  prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
                );
                setSelectedPost(updatedPost);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;
