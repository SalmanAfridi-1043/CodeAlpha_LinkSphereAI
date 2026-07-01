// VERIFIED: pages/Home.jsx — no issues found
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import Spinner from "../components/Spinner";
import Avatar from "../components/Avatar";
import PostCard from "../components/PostCard";
import usePageTitle from "../hooks/usePageTitle";
import PostCardSkeleton from "../components/skeletons/PostCardSkeleton";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  usePageTitle("Home");

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const observer = useRef();
  const pageRef = useRef(1);

  const fetchPosts = useCallback(async (pageNumber, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const { data } = await api.get(`/posts/feed?page=${pageNumber}&limit=10`);
      if (data.success) {
        if (isInitial) {
          setPosts(data.posts);
        } else {
          setPosts((prevPosts) => {
            // Filter duplicates if any
            const existingIds = new Set(prevPosts.map((p) => p._id));
            const newPosts = data.posts.filter((p) => !existingIds.has(p._id));
            return [...prevPosts, ...newPosts];
          });
        }
        setHasMore(data.hasMore);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load posts";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Fetch initial posts on mount
  useEffect(() => {
    fetchPosts(1, true);
    pageRef.current = 1;
  }, [fetchPosts]);

  // Infinite scroll trigger callback
  const lastPostElementRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          const nextPage = pageRef.current + 1;
          pageRef.current = nextPage;
          fetchPosts(nextPage);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore, fetchPosts]
  );

  const handleDelete = (postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
  };

  const handleUpdate = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post))
    );
  };

  // Skeleton loaders helper
  const renderSkeletons = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((n) => (
        <PostCardSkeleton key={n} />
      ))}
    </div>
  );

  return (
    <div className="w-full pb-12">
        {/* Quick create post bar */}
        <div
          onClick={() => navigate("/create")}
          className="flex items-center gap-3 rounded-2xl p-4 mb-6 cursor-pointer transition-all duration-300"
          style={{
            background:   "var(--surface)",
            border:       "1px solid var(--border)",
            boxShadow:    "0 2px 12px rgba(0,0,0,0.08)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "rgba(108,99,255,0.3)";
            e.currentTarget.style.boxShadow   = "0 4px 20px rgba(108,99,255,0.1)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow   = "0 2px 12px rgba(0,0,0,0.08)";
          }}
        >
          <Avatar user={user} size="sm" />
          <div
            className="flex-1 rounded-full px-5 py-2.5 text-[14px] select-none transition-all duration-200"
            style={{
              background: "var(--surface-2)",
              color:      "var(--muted)",
              border:     "1px solid var(--border)",
            }}
          >
            What's on your mind?
          </div>
        </div>

        {/* Loading Initial Posts */}
        {loading ? (
          renderSkeletons()
        ) : error && posts.length === 0 ? (
          <div className="bg-[#2A1F2D] border border-accent/20 text-[#FF6584] text-sm rounded-xl p-4 text-center font-medium my-6">
            <p>{error}</p>
            <button
              onClick={() => fetchPosts(1, true)}
              className="mt-2 text-primary hover:underline font-semibold"
            >
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          /* Empty State */
          <div className="bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl p-8 text-center flex flex-col items-center justify-center py-16 animate-fadeIn">
            <span className="text-5xl mb-4 select-none" role="img" aria-label="Seedling">
              🌱
            </span>
            <h2 className="text-white text-xl font-bold mb-2">Your feed is empty</h2>
            <p className="text-[#A0A0C0] text-sm max-w-sm mb-6 leading-relaxed">
              Follow people to see their posts
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate("/explore")}
                className="bg-primary hover:bg-primary/95 text-white font-semibold px-5 py-2.5 rounded-xl transition shadow-lg text-sm"
              >
                Explore
              </button>
            </div>
          </div>
        ) : (
          /* Posts List */
          <div className="space-y-4">
            {posts.map((post, index) => {
              if (posts.length === index + 1) {
                return (
                  <div ref={lastPostElementRef} key={post._id}>
                    <PostCard
                      post={post}
                      onDelete={handleDelete}
                      onUpdate={handleUpdate}
                    />
                  </div>
                );
              } else {
                return (
                  <PostCard
                    key={post._id}
                    post={post}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                );
              }
            })}

            {/* Load More Loader */}
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Spinner size="md" color="#6C63FF" />
              </div>
            )}

            {/* End of Feed message */}
            {!hasMore && posts.length > 0 && (
              <div className="text-center text-[#A0A0C0] text-xs py-8 font-medium select-none">
                You're all caught up! 🎉
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default Home;
