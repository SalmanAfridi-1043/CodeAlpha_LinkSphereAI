import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Spinner from "../components/Spinner";
import PostCard from "../components/PostCard";
import UserListItem from "../components/UserListItem";
import usePageTitle from "../hooks/usePageTitle";
import UserItemSkeleton from "../components/skeletons/UserItemSkeleton";

const Explore = () => {
  const [searchParams] = useSearchParams();
  usePageTitle("Explore");
  const [posts, setPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
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

  // Fetch initial posts and suggestions on mount
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    pageRef.current = 1;
    try {
      const [exploreData, suggestionsData] = await Promise.all([
        api.get("/posts/explore?page=1&limit=12"),
        api.get("/users/suggestions"),
      ]);

      if (exploreData.data.success) {
        setPosts(exploreData.data.posts);
        setHasMore(exploreData.data.hasMore);
      }
      if (suggestionsData.data.success) {
        setSuggestedUsers(suggestionsData.data.users);
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

  const handleSuggestionFollowToggle = (userId, newStatus) => {
    // If follow state changes, remove the user from suggestions list dynamically
    if (newStatus) {
      setSuggestedUsers((prev) => prev.filter((u) => u._id !== userId));
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

  return (
    <div className="w-full pb-12">
      <div className="w-full max-w-2xl mx-auto pt-4 px-4">
        {/* Sticky Search Input Bar */}
        <div className="sticky top-0 bg-[#0F0F1A]/95 z-20 pb-4 backdrop-blur-md select-none">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-[#A0A0C0]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#1E1E2E] border border-[#3A3A5E] text-white rounded-full pl-12 pr-4 py-3 w-full focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all text-sm shadow-md"
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
            {loading ? (
              <div>
                <h2 className="text-white font-semibold text-base mb-3 flex items-center gap-2 select-none">
                  <span>Suggested for you</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                </h2>
                <div className="bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl p-3 divide-y divide-[#3A3A5E]/10 space-y-1 shadow-lg">
                  {[1, 2, 3].map((n) => (
                    <UserItemSkeleton key={n} />
                  ))}
                </div>
              </div>
            ) : suggestedUsers.length > 0 ? (
              <div>
                <h2 className="text-white font-semibold text-base mb-3 flex items-center gap-2 select-none">
                  <span>Suggested for you</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                </h2>
                <div className="bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl p-3 divide-y divide-[#3A3A5E]/10 space-y-1 shadow-lg">
                  {suggestedUsers.map((user) => (
                    <UserListItem
                      key={user._id}
                      user={user}
                      onFollowToggle={handleSuggestionFollowToggle}
                    />
                  ))}
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
                          className="aspect-square bg-[#1E1E2E] border border-[#3A3A5E] rounded-xl overflow-hidden cursor-pointer relative group flex-shrink-0"
                        >
                          {elementContent}
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
