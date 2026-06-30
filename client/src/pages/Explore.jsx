import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Spinner from "../components/Spinner";
import PostCard from "../components/PostCard";

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchExplorePosts = async (pageNumber, isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const { data } = await api.get(`/posts/explore?page=${pageNumber}&limit=12`);
      if (data.success) {
        if (isInitial) {
          setPosts(data.posts);
        } else {
          setPosts((prevPosts) => {
            const existingIds = new Set(prevPosts.map((p) => p._id));
            const newPosts = data.posts.filter((p) => !existingIds.has(p._id));
            return [...prevPosts, ...newPosts];
          });
        }
        setHasMore(data.hasMore);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load explore posts";
      toast.error(message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchExplorePosts(1, true);
    setPage(1);
  }, []);

  const handleDelete = (postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
  };

  const handleUpdate = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post))
    );
  };

  const renderSkeletons = () => (
    <div className="space-y-4">
      {[1, 2].map((n) => (
        <div
          key={n}
          className="bg-[#1E1E2E] rounded-2xl p-5 mb-4 border border-[#3A3A5E] animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#2A2A3E] rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#2A2A3E] rounded w-1/4" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-[#2A2A3E] rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-dark text-white pb-20">
      <div className="max-w-xl mx-auto pt-6 px-4">
        <div className="flex flex-col gap-1 mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent inline-block">
            Explore LinkSphere
          </h1>
          <p className="text-[#A0A0C0] text-sm">
            Discover what people are sharing across the sphere in real time
          </p>
        </div>

        {loading ? (
          renderSkeletons()
        ) : posts.length === 0 ? (
          <div className="bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl p-8 text-center flex flex-col items-center justify-center py-16 animate-fadeIn">
            <span className="text-5xl mb-4 select-none">🌐</span>
            <h2 className="text-white text-lg font-bold mb-2">No explore posts yet</h2>
            <p className="text-[#A0A0C0] text-sm max-w-sm mb-6 leading-relaxed">
              Be the first to post something and get featured on the explore page!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}

            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={() => {
                    const nextPage = page + 1;
                    fetchExplorePosts(nextPage);
                    setPage(nextPage);
                  }}
                  disabled={loadingMore}
                  className="bg-[#1E1E2E] border border-[#3A3A5E] text-[#A0A0C0] hover:text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#2A2A3E] transition flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                  {loadingMore && <Spinner size="sm" />}
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
