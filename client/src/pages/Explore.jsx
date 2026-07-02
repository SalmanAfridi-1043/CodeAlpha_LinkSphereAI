// FIXED: client/src/pages/Explore.jsx — TikTok style fuzzy search + ranking relevance + Suggestions + Explore posts grid
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Spinner from "../components/Spinner";
import PostCard from "../components/PostCard";
import UserListItem from "../components/UserListItem";
import Avatar from "../components/Avatar";
import usePageTitle from "../hooks/usePageTitle";

const Explore = () => {
  usePageTitle("Explore");
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ users: [], posts: [] });
  const [searching, setSearching] = useState(false);
  const [searchType, setSearchType] = useState("all"); // 'all' | 'people' | 'posts'
  const [suggestions, setSuggestions] = useState([]);
  const [explorePosts, setExplorePosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [selectedPost, setSelectedPost] = useState(null);

  // Sync initial following IDs from currentUser
  useEffect(() => {
    if (currentUser?.following) {
      const ids = currentUser.following.map((id) => (id?._id || id).toString());
      setFollowingIds(new Set(ids));
    }
  }, [currentUser]);

  // Fetch Suggestions and Explore posts on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [suggestionsRes, exploreRes] = await Promise.all([
          api.get("/users/suggestions"),
          api.get("/posts/explore?page=1&limit=15"),
        ]);
        if (suggestionsRes.data.success) {
          // Fallback to data.suggestions or data.users
          setSuggestions(suggestionsRes.data.suggestions || suggestionsRes.data.users || []);
        }
        if (exploreRes.data.success) {
          setExplorePosts(exploreRes.data.posts || []);
        }
      } catch (err) {
        console.error("Failed to load suggestions/explore posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // TikTok-style fuzzy search trigger: 300ms debounce, starts on 1 character
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ users: [], posts: [] });
      setSearching(false);
      return;
    }

    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const usersPromise = api.get(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const postsPromise = (searchType === "all" || searchType === "posts")
          ? api.get(`/posts/search?q=${encodeURIComponent(searchQuery.trim())}`)
          : Promise.resolve({ data: { success: true, posts: [] } });

        const [usersRes, postsRes] = await Promise.all([usersPromise, postsPromise]);

        if (usersRes.data.success && postsRes.data.success) {
          setSearchResults({
            users: usersRes.data.users || [],
            posts: postsRes.data.posts || [],
          });
        }
      } catch (err) {
        console.error("Explore Search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchType]);

  const handleFollow = async (userId) => {
    const isCurrentlyFollowing = followingIds.has(userId.toString());

    // Optimistic UI updates
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyFollowing) {
        next.delete(userId.toString());
      } else {
        next.add(userId.toString());
      }
      return next;
    });

    try {
      const { data } = await api.post(`/follow/${userId}`);
      if (data.success) {
        setFollowingIds((prev) => {
          const next = new Set(prev);
          if (data.following) {
            next.add(userId.toString());
          } else {
            next.delete(userId.toString());
          }
          return next;
        });

        // Update local AuthContext following list so other pages sync
        let updatedFollowing = [...(currentUser.following || [])];
        if (data.following) {
          if (!updatedFollowing.some((id) => (id?._id || id).toString() === userId.toString())) {
            const hasPopulatedItem = updatedFollowing.length > 0 && typeof updatedFollowing[0] === "object";
            // Find user details from suggestions list
            const foundUser = suggestions.find((s) => s._id.toString() === userId.toString());
            updatedFollowing.push(hasPopulatedItem ? (foundUser || { _id: userId }) : userId);
          }
        } else {
          updatedFollowing = updatedFollowing.filter(
            (id) => (id?._id || id).toString() !== userId.toString()
          );
        }
        updateUser({ ...currentUser, following: updatedFollowing });

        toast.success(data.following ? "Followed successfully!" : "Unfollowed successfully!");
      }
    } catch (err) {
      // Revert state
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) {
          next.add(userId.toString());
        } else {
          next.delete(userId.toString());
        }
        return next;
      });
      toast.error("Failed to toggle follow status");
    }
  };

  return (
    <div className="w-full pb-12">
      <div className="w-full max-w-2xl mx-auto pt-4 px-4">
        {/* Sticky Search bar (prominent) */}
        <div className="sticky top-0 z-10 bg-[var(--bg-main)] pt-2 pb-3">
          {/* Big search input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-lg">
              🔍
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people, posts..."
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl pl-11 pr-4 py-3.5 text-[var(--text-main)] text-[15px] focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF22] outline-none transition"
            />
            {/* Clear button */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] text-lg"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search type pills */}
          {searchQuery && (
            <div className="flex gap-2 mt-3">
              {["all", "people", "posts"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSearchType(type)}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-medium capitalize transition ${
                    searchType === type
                      ? "bg-gradient-to-r from-[#6C63FF] to-[#FF6584] text-white"
                      : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)]"
                  }`}
                >
                  {type === "all"
                    ? "✨ All"
                    : type === "people"
                    ? "👥 People"
                    : "📝 Posts"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* DEFAULT VIEW (searchQuery is empty) */}
        {!searchQuery && (
          <div className="space-y-6">
            {/* Suggested Profiles */}
            {loading ? (
              <div className="flex justify-center py-6">
                <Spinner size="md" color="var(--primary)" />
              </div>
            ) : suggestions.length > 0 ? (
              <section>
                <h2 className="text-[var(--text-main)] font-bold text-[15px] mb-3">
                  👥 Suggested for You
                </h2>
                {/* Horizontal scroll row — TikTok style suggestions */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                  {suggestions.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => navigate(`/profile/${user.username}`)}
                      className="flex-shrink-0 flex flex-col items-center gap-2 p-4 w-32 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl cursor-pointer hover:border-[#6C63FF44] hover:shadow-[0_0_20px_#6C63FF11] transition group"
                    >
                      <Avatar
                        user={user}
                        size="lg"
                        showRing={true}
                      />
                      <p className="text-[var(--text-main)] text-[12px] font-semibold truncate w-full text-center">
                        {user.name}
                      </p>
                      <p className="text-[var(--text-muted)] text-[11px] truncate w-full text-center">
                        @{user.username}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow(user._id);
                        }}
                        disabled={followingIds.has(user._id)}
                        className="w-full py-1.5 rounded-full text-[11px] font-medium bg-gradient-to-r from-[#6C63FF] to-[#FF6584] text-white hover:shadow-[0_0_10px_#6C63FF44] transition disabled:opacity-60 disabled:cursor-default"
                      >
                        {followingIds.has(user._id) ? "Following" : "Follow"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Explore Posts Grid */}
            <section className="mt-6">
              <h2 className="text-[var(--text-main)] font-bold text-[15px] mb-3">
                🔥 Trending Posts
              </h2>
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square bg-[var(--bg-card)] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : explorePosts.length === 0 ? (
                <div className="text-center py-10 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
                  <p className="text-white font-medium text-sm">No trending posts yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {explorePosts.map((post) => (
                    <div
                      key={post._id}
                      onClick={() => setSelectedPost(post)}
                      className="relative aspect-square overflow-hidden rounded-xl cursor-pointer group bg-[var(--bg-card)]"
                    >
                      {post.image ? (
                        <img
                          src={post.image}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          alt="Explore grid post"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#6C63FF22] to-[#FF658422] flex items-center justify-center p-3">
                          <p className="text-[var(--text-main)] text-[12px] line-clamp-4 text-center">
                            {post.content}
                          </p>
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                        <span className="text-white text-[13px]">
                          ❤️ {post.likesCount || 0}
                        </span>
                        <span className="text-white text-[13px]">
                          💬 {post.commentsCount || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* SEARCH RESULTS VIEW (searchQuery is not empty) */}
        {searchQuery && (
          <div className="space-y-4">
            {/* Searching indicator */}
            {searching && (
              <div className="flex items-center gap-2 py-4 text-[var(--text-muted)] text-[13px]">
                <Spinner size="sm" />
                Searching for "{searchQuery}"...
              </div>
            )}

            {/* People results */}
            {(searchType === "all" || searchType === "people") &&
              searchResults.users?.length > 0 && (
                <section className="mb-4">
                  <h3 className="text-[var(--text-muted)] text-[12px] uppercase tracking-wider font-semibold mb-2">
                    People
                  </h3>
                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 divide-y divide-[var(--border)]/20 space-y-1">
                    {searchResults.users.map((user) => (
                      <UserListItem
                        key={user._id}
                        user={user}
                        showFollowButton={true}
                      />
                    ))}
                  </div>
                </section>
              )}

            {/* Posts results */}
            {(searchType === "all" || searchType === "posts") &&
              searchResults.posts?.length > 0 && (
                <section>
                  <h3 className="text-[var(--text-muted)] text-[12px] uppercase tracking-wider font-semibold mb-2">
                    Posts
                  </h3>
                  <div className="space-y-4">
                    {searchResults.posts.map((post) => (
                      <PostCard key={post._id} post={post} />
                    ))}
                  </div>
                </section>
              )}

            {/* No results */}
            {!searching &&
              searchResults.users?.length === 0 &&
              searchResults.posts?.length === 0 && (
                <div className="text-center py-12 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-[var(--text-main)] font-semibold">
                    No results for "{searchQuery}"
                  </p>
                  <p className="text-[var(--text-muted)] text-[13px] mt-1">
                    Try a shorter name or check spelling
                  </p>
                </div>
              )}
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
                setExplorePosts((prev) => prev.filter((p) => p._id !== postId));
                setSelectedPost(null);
              }}
              onUpdate={(updatedPost) => {
                setExplorePosts((prev) =>
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
