import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import Spinner from "../components/Spinner";
import Avatar from "../components/Avatar";
import PostCard from "../components/PostCard";

const Profile = () => {
  const { id: username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  
  // Pagination details
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPostsCount, setTotalPostsCount] = useState(0);

  const isOwnProfile = currentUser && currentUser.username === username?.toLowerCase();

  // Fetch profile user's basic details (using our custom profile endpoint)
  const fetchProfileUser = useCallback(async () => {
    setLoadingUser(true);
    try {
      const { data } = await api.get(`/posts/profile/${username}`);
      if (data.success) {
        setProfileUser(data.user);
      }
    } catch (err) {
      const message = err.response?.data?.message || "User profile not found";
      toast.error(message);
      navigate("/");
    } finally {
      setLoadingUser(false);
    }
  }, [username, navigate]);

  // Fetch posts for the profile user
  const fetchUserPosts = useCallback(async (pageNumber, isInitial = false) => {
    if (isInitial) {
      setLoadingPosts(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const { data } = await api.get(`/posts/user/${username}?page=${pageNumber}&limit=10`);
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
        
        // Update stats posts count locally
        if (data.currentPage === 1) {
          // If server supports pagination, it returns total posts count or totalPages
          // If totalPosts is not returned, we can estimate or fallback
          setTotalPostsCount(data.totalPosts || data.posts.length);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load posts";
      toast.error(message);
    } finally {
      setLoadingPosts(false);
      setLoadingMore(false);
    }
  }, [username]);

  // Initialize and reload on username change
  useEffect(() => {
    if (username) {
      fetchProfileUser();
      fetchUserPosts(1, true);
      setPage(1);
    }
  }, [username, fetchProfileUser, fetchUserPosts]);

  const handlePostDelete = (postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
    setTotalPostsCount((prevCount) => Math.max(0, prevCount - 1));
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post))
    );
  };

  const handleEditProfileClick = () => {
    toast("Profile editing modal will be fully integrated in Part 8!", {
      icon: "⚙️",
      style: {
        background: "#1E1E2E",
        color: "#F5F5FF",
        border: "1px solid #3A3A5E",
      },
    });
  };

  const handleFollowClick = () => {
    toast.success(`You started following @${profileUser.username}!`);
  };

  // Skeletons rendering helper
  const renderSkeletons = () => (
    <div className="space-y-4">
      {[1, 2].map((n) => (
        <div
          key={n}
          className="bg-[#1E1E2E] rounded-2xl p-5 border border-[#3A3A5E] animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#2A2A3E] rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#2A2A3E] rounded w-1/4" />
              <div className="h-3 bg-[#2A2A3E] rounded w-1/6" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-[#2A2A3E] rounded w-full" />
            <div className="h-4 bg-[#2A2A3E] rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <Spinner size="lg" color="#6C63FF" />
      </div>
    );
  }

  if (!profileUser) return null;

  return (
    <div className="min-h-screen bg-dark text-white pb-20">
      <div className="max-w-2xl mx-auto pt-4 px-4">
        {/* Profile Card Shell */}
        <div className="bg-[#1E1E2E] rounded-2xl border border-[#3A3A5E] overflow-hidden mb-6 shadow-xl relative animate-fadeIn">
          {/* Cover Image */}
          <div className="h-48 md:h-56 bg-gradient-to-r from-primary/30 to-accent/30 relative select-none">
            {profileUser.coverImage ? (
              <img
                src={profileUser.coverImage}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-40">
                <span className="text-[#A0A0C0] text-sm">LinkSphereAI Space Banner</span>
              </div>
            )}

            {/* Overlapping Avatar */}
            <div className="absolute -bottom-12 left-6">
              <Avatar
                user={profileUser}
                size="lg"
                className="ring-4 ring-[#1E1E2E] w-24 h-24 md:w-28 md:h-28"
              />
            </div>
          </div>

          {/* User Details Section */}
          <div className="pt-16 pb-6 px-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-2xl font-bold text-white leading-tight">
                    {profileUser.name}
                  </h1>
                  {profileUser.isVerified && (
                    <svg
                      className="w-5 h-5 text-primary fill-current mt-0.5"
                      viewBox="0 0 24 24"
                      aria-label="Verified User"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </div>
                <p className="text-[#A0A0C0] text-sm">@{profileUser.username}</p>
              </div>

              {/* Edit or Follow Button */}
              {isOwnProfile ? (
                <button
                  onClick={handleEditProfileClick}
                  className="bg-[#2A2A3E] hover:bg-[#3A3A5E] text-white border border-[#3A3A5E] hover:border-primary/50 text-xs md:text-sm font-semibold px-4 py-2 rounded-xl transition shadow"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleFollowClick}
                  className="bg-primary hover:bg-primary/90 text-white text-xs md:text-sm font-bold px-5 py-2 rounded-xl transition shadow-lg"
                >
                  Follow
                </button>
              )}
            </div>

            {/* Bio Details */}
            {profileUser.bio && (
              <p className="text-white text-[15px] mt-4 leading-relaxed whitespace-pre-wrap">
                {profileUser.bio}
              </p>
            )}

            {/* Location / Website / Joined metadata */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-[#A0A0C0] text-xs">
              {profileUser.location && (
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{profileUser.location}</span>
                </div>
              )}
              {profileUser.website && (
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <a
                    href={
                      profileUser.website.startsWith("http")
                        ? profileUser.website
                        : `https://${profileUser.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-primary"
                  >
                    {profileUser.website}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Joined {new Date(profileUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex gap-6 mt-6 border-t border-[#3A3A5E] pt-4 select-none">
              <div className="flex items-center gap-1 text-sm">
                <span className="font-bold text-white">{totalPostsCount}</span>
                <span className="text-[#A0A0C0]">Posts</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="font-bold text-white">
                  {profileUser.followersCount || profileUser.followers?.length || 0}
                </span>
                <span className="text-[#A0A0C0]">Followers</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="font-bold text-white">
                  {profileUser.followingCount || profileUser.following?.length || 0}
                </span>
                <span className="text-[#A0A0C0]">Following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#3A3A5E] mb-6 select-none">
          <button
            onClick={() => setActiveTab("posts")}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition duration-200 ${
              activeTab === "posts"
                ? "border-primary text-primary"
                : "border-transparent text-[#A0A0C0] hover:text-white"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("likes")}
            className={`py-3 px-6 text-sm font-semibold border-b-2 transition duration-200 ${
              activeTab === "likes"
                ? "border-primary text-primary"
                : "border-transparent text-[#A0A0C0] hover:text-white"
            }`}
          >
            Likes
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "posts" ? (
          loadingPosts ? (
            renderSkeletons()
          ) : posts.length === 0 ? (
            /* Empty State */
            <div className="bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl p-8 text-center flex flex-col items-center justify-center py-12 animate-fadeIn">
              <span className="text-4xl mb-3 select-none">📝</span>
              <h3 className="text-white text-base font-bold mb-1">No posts yet</h3>
              <p className="text-[#A0A0C0] text-xs max-w-xs mb-4">
                {isOwnProfile
                  ? "Share your thoughts or upload your first photo!"
                  : `@${profileUser.username} hasn't posted anything yet.`}
              </p>
              {isOwnProfile && (
                <button
                  onClick={() => navigate("/create")}
                  className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow"
                >
                  Share your first post!
                </button>
              )}
            </div>
          ) : (
            /* User Posts List */
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onDelete={handlePostDelete}
                  onUpdate={handlePostUpdate}
                />
              ))}

              {hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={() => {
                      const nextPage = page + 1;
                      fetchUserPosts(nextPage);
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
          )
        ) : (
          /* Placeholder Likes Tab */
          <div className="bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl p-8 text-center py-12 text-[#A0A0C0] text-sm font-medium">
            Likes tab details will be wired in Part 5!
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
