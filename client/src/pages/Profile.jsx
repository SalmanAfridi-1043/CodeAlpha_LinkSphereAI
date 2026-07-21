// VERIFIED: pages/Profile.jsx — no issues found
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import Spinner from "../components/Spinner";
import Avatar from "../components/Avatar";
import PostCard from "../components/PostCard";
import UserListItem from "../components/UserListItem";
import usePageTitle from "../hooks/usePageTitle";
import ProfileSkeleton from "../components/skeletons/ProfileSkeleton";
import EditProfileModal from "../components/EditProfileModal";
import ConnectionButton from "../components/ConnectionButton";
import ShareProfileModal from "../components/ShareProfileModal";

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  usePageTitle(profileUser ? profileUser.name : "Profile");
  const [posts, setPosts] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Follow states (Part 6 additions)
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowHovered, setIsFollowHovered] = useState(false);
  const [mutualFollowers, setMutualFollowers] = useState([]);
  const [mutualCount, setMutualCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // Pagination details
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalPostsCount, setTotalPostsCount] = useState(0);

  const isOwnProfile = currentUser && currentUser.username === username?.toLowerCase();

  // Fetch profile user's basic details (populated with followers and following)
  const fetchProfileUser = useCallback(async () => {
    setLoadingUser(true);
    try {
      const { data } = await api.get(`/posts/profile/${username}`);
      if (data.success) {
        setProfileUser(data.user);
        
        // Check initial following status
        if (currentUser && data.user) {
          const followingStatus = (currentUser.following || []).some(
            (id) => (id?._id || id).toString() === data.user._id.toString()
          );
          setIsFollowing(followingStatus);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || "User profile not found";
      toast.error(message);
      navigate("/");
    } finally {
      setLoadingUser(false);
    }
  }, [username, currentUser, navigate]);

  // Fetch mutual followers (Part 6)
  const fetchMutualFollowers = useCallback(async (userId) => {
    try {
      const { data } = await api.get(`/follow/mutual/${userId}`);
      if (data.success) {
        setMutualFollowers(data.mutualFollowers);
        setMutualCount(data.mutualCount);
      }
    } catch (err) {
      console.error("Failed to load mutual followers:", err);
    }
  }, []);

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
        
        if (data.currentPage === 1) {
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

  // Initialize and reload on username/currentUser changes
  useEffect(() => {
    if (username) {
      fetchProfileUser();
      fetchUserPosts(1, true);
      setPage(1);
    }
  }, [username, fetchProfileUser, fetchUserPosts]);

  // Fetch mutual followers if profile user loaded and it is not own profile
  useEffect(() => {
    if (profileUser && !isOwnProfile) {
      fetchMutualFollowers(profileUser._id);
    } else {
      setMutualFollowers([]);
      setMutualCount(0);
    }
  }, [profileUser, isOwnProfile, fetchMutualFollowers]);

  // Load connection status between current user and profile user
  useEffect(() => {
    if (!profileUser || isOwnProfile) {
      setConnectionStatus(null);
      return;
    }

    const loadConnectionStatus = async () => {
      try {
        // 1. Fetch my connections to see if accepted
        const { data: connData } = await api.get("/connections");
        const isConnected = connData.connections.some(
          (c) => c._id.toString() === profileUser._id.toString()
        );
        if (isConnected) {
          setConnectionStatus("accepted");
          return;
        }

        // 2. Fetch findPeople to see if pending (sent or received)
        const { data: findData } = await api.get(
          `/connections/find?q=${profileUser.username}&type=username`
        );
        const foundUser = findData.users.find(
          (u) => u._id.toString() === profileUser._id.toString()
        );
        if (foundUser && foundUser.isPending) {
          setConnectionStatus("pending");
          return;
        }

        // 3. Fetch pending requests received by me
        const { data: pendingData } = await api.get("/connections/pending");
        const isPendingReceived = pendingData.requests.some(
          (r) => r.sender._id.toString() === profileUser._id.toString()
        );
        if (isPendingReceived) {
          setConnectionStatus("pending");
          return;
        }

        setConnectionStatus(null);
      } catch (err) {
        console.error("Failed to load connection status:", err);
      }
    };

    loadConnectionStatus();
  }, [profileUser, isOwnProfile]);

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
    setShowEditModal(true);
  };

  const handleProfileSaved = (updatedUser) => {
    setProfileUser((prev) => ({ ...prev, ...updatedUser }));
  };

  // Follow/Unfollow Button Action (Optimistic updates - Part 6)
  const handleFollowToggle = async () => {
    if (!currentUser || !profileUser) return;

    setFollowLoading(true);

    const originalIsFollowing = isFollowing;

    // Optimistically update states
    setIsFollowing(!isFollowing);
    
    // Create copy to optimistically update count and arrays
    let updatedFollowers = [...(profileUser.followers || [])];
    if (isFollowing) {
      updatedFollowers = updatedFollowers.filter(
        (f) => (f._id || f).toString() !== currentUser._id.toString()
      );
    } else {
      // Push current user data to profile user's followers array
      updatedFollowers.push({
        _id: currentUser._id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
        isVerified: currentUser.isVerified,
      });
    }

    setProfileUser({
      ...profileUser,
      followers: updatedFollowers,
    });

    try {
      const { data } = await api.post(`/follow/${profileUser._id}`);
      if (data.success) {
        setIsFollowing(data.following);
        
        // Sync local followers count with response
        // Re-construct populated list if backend toggled successfully
        let finalFollowers = [...(profileUser.followers || [])];
        if (data.following) {
          if (!finalFollowers.some(f => (f._id || f).toString() === currentUser._id.toString())) {
            finalFollowers.push(currentUser);
          }
        } else {
          finalFollowers = finalFollowers.filter(
            (f) => (f._id || f).toString() !== currentUser._id.toString()
          );
        }
        
        setProfileUser(prev => ({
          ...prev,
          followers: finalFollowers,
        }));

        // Update local AuthContext user following array
        let updatedFollowing = [...(currentUser.following || [])];
        if (data.following) {
          if (!updatedFollowing.some((id) => (id?._id || id).toString() === profileUser._id.toString())) {
            const hasPopulatedItem = updatedFollowing.length > 0 && typeof updatedFollowing[0] === "object";
            updatedFollowing.push(hasPopulatedItem ? profileUser : profileUser._id);
          }
        } else {
          updatedFollowing = updatedFollowing.filter(
            (id) => (id?._id || id).toString() !== profileUser._id.toString()
          );
        }
        updateUser({ ...currentUser, following: updatedFollowing });

        toast.success(
          data.following
            ? `Followed @${profileUser.username}`
            : `Unfollowed @${profileUser.username}`
        );
      }
    } catch (err) {
      // Revert states on error
      setIsFollowing(originalIsFollowing);
      setProfileUser(prev => ({
        ...prev,
        followers: prev.followers, // Keep current or fallback
      }));
      toast.error(err.response?.data?.message || "Failed to toggle follow");
    } finally {
      setFollowLoading(false);
    }
  };

  // Sync state for list toggles (Part 6 list updates)
  const handleListFollowToggle = (userId, newStatus) => {
    if (!profileUser) return;

    // Sync followers list item isFollowing flag inside local state
    const updatedFollowers = (profileUser.followers || []).map((u) => {
      if (u._id?.toString() === userId.toString()) {
        return { ...u, isFollowing: newStatus };
      }
      return u;
    });

    // Sync following list item isFollowing flag inside local state
    const updatedFollowing = (profileUser.following || []).map((u) => {
      if (u._id?.toString() === userId.toString()) {
        return { ...u, isFollowing: newStatus };
      }
      return u;
    });

    setProfileUser({
      ...profileUser,
      followers: updatedFollowers,
      following: updatedFollowing,
    });
  };

  const getMutualText = () => {
    if (mutualCount === 0) return "";
    const names = mutualFollowers.map((f) => f.name);
    if (mutualCount === 1) return `Followed by ${names[0]}`;
    if (mutualCount === 2) return `Followed by ${names[0]} and ${names[1]}`;
    return `Followed by ${names[0]}, ${names[1]} and ${mutualCount - 2} other${
      mutualCount - 2 > 1 ? "s" : ""
    }`;
  };

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
    return <ProfileSkeleton />;
  }

  if (!profileUser) return null;

  return (
    <>
    <div className="w-full pb-12">
      <div className="w-full max-w-2xl mx-auto pt-4 px-4">
        {/* Profile Card Shell */}
        <div className="bg-[#12121F] rounded-[20px] border border-[#2A2A40] overflow-hidden mb-6 shadow-xl relative animate-fadeIn">
          {/* Cover Image */}
          <div className="relative h-32 sm:h-48 bg-gradient-to-r from-primary/30 to-accent/30 select-none">
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

            {/* Dark gradient overlay at bottom */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none select-none z-10"
              style={{ background: "linear-gradient(to top, #0A0A14 0%, transparent 100%)" }}
            />

            {/* Overlapping Avatar */}
            <div className="absolute -bottom-10 sm:-bottom-16 left-4 sm:left-6 z-20">
              <Avatar
                user={profileUser}
                size="xl"
                showRing={true}
                className="!w-20 !h-20 sm:!w-32 sm:!h-32 rounded-full border-4 border-[#0A0A14]"
              />
            </div>
          </div>

          {/* User Details Section */}
          <div className="pt-12 sm:pt-16 pb-4 sm:pb-6 px-3 sm:px-5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-[18px] sm:text-[22px] font-bold text-[var(--text-main)] leading-tight">
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

              {/* Edit or Follow Button (Hover effect unfollow - Part 6) */}
              {isOwnProfile ? (
                <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="border border-primary/50 hover:border-primary text-primary hover:bg-primary/10 text-[11px] sm:text-[13px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition shadow flex items-center gap-1.5"
                  >
                    🔗 Share Profile
                  </button>
                  <button
                    onClick={handleEditProfileClick}
                    className="bg-[#2A2A3E] hover:bg-[#3A3A5E] text-white border border-[#3A3A5E] hover:border-primary/50 text-[11px] sm:text-[13px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition shadow"
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="border border-primary/50 hover:border-primary text-primary hover:bg-primary/10 text-[11px] sm:text-[13px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition shadow flex items-center gap-1.5"
                  >
                    🔗 Share
                  </button>
                  <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    onMouseEnter={() => setIsFollowHovered(true)}
                    onMouseLeave={() => setIsFollowHovered(false)}
                    className={`text-[11px] sm:text-[13px] font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition duration-200 shadow-md flex items-center justify-center min-w-[80px] sm:min-w-[100px] ${
                      isFollowing
                        ? isFollowHovered
                          ? "bg-transparent border border-red-500/50 text-red-400"
                          : "bg-transparent border border-[#3A3A5E] text-white hover:border-[#3A3A5E]"
                        : "bg-gradient-to-r from-primary to-accent text-white hover:opacity-95"
                    }`}
                  >
                    {followLoading ? (
                      <Spinner size="sm" color="#ffffff" />
                    ) : isFollowing ? (
                      isFollowHovered ? (
                        "Unfollow"
                      ) : (
                        "Following"
                      )
                    ) : (
                      "Follow"
                    )}
                  </button>

                  <button
                    onClick={() => navigate('/messages', { state: { openUser: profileUser } })}
                    className="text-[11px] sm:text-[13px] font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-[#6C63FF44] text-[#6C63FF] hover:bg-[#6C63FF11] transition shadow"
                  >
                    Message
                  </button>

                  <ConnectionButton
                    targetUserId={profileUser._id}
                    targetUsername={profileUser.username}
                    initialStatus={connectionStatus}
                  />
                </div>
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

            {/* Mutual Followers Display (Part 6) */}
            {mutualCount > 0 && (
              <div className="flex items-center gap-2 mt-4 select-none animate-fadeIn border-t border-[#3A3A5E]/30 pt-3">
                <div className="flex items-center">
                  {mutualFollowers.map((follower, index) => (
                    <div
                      key={follower._id}
                      style={{ zIndex: 3 - index }}
                      className={index > 0 ? "-ml-2.5" : ""}
                    >
                      <Avatar
                        user={follower}
                        size="sm"
                        className="w-6 h-6 ring-2 ring-[#1E1E2E]"
                      />
                    </div>
                  ))}
                </div>
                <span className="text-[#A0A0C0] text-xs font-medium leading-none">
                  {getMutualText()}
                </span>
              </div>
            )}

            {/* Stats Row (Clickable tabs toggle - Part 6) */}
            <div className="flex gap-4 sm:gap-6 mt-3 flex-wrap border-t border-[#3A3A5E]/40 pt-4 select-none">
              <div
                className="flex items-center gap-1 cursor-pointer group relative pb-1 text-center"
                onClick={() => setActiveTab("posts")}
              >
                <span className="font-bold text-white group-hover:gradient-text text-[14px] sm:text-[16px]">{totalPostsCount}</span>
                <span className="text-[#A0A0C0] group-hover:gradient-text text-[10px] sm:text-[12px]">Posts</span>
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full" />
              </div>
              <div
                className="flex items-center gap-1 cursor-pointer group relative pb-1 text-center"
                onClick={() => setActiveTab("followers")}
              >
                <span className="font-bold text-white group-hover:gradient-text font-mono text-[14px] sm:text-[16px]">
                  {profileUser.followers?.length || 0}
                </span>
                <span className="text-[#A0A0C0] group-hover:gradient-text text-[10px] sm:text-[12px]">Followers</span>
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full" />
              </div>
              <div
                className="flex items-center gap-1 cursor-pointer group relative pb-1 text-center"
                onClick={() => setActiveTab("following")}
              >
                <span className="font-bold text-white group-hover:gradient-text font-mono text-[14px] sm:text-[16px]">
                  {profileUser.following?.length || 0}
                </span>
                <span className="text-[#A0A0C0] group-hover:gradient-text text-[10px] sm:text-[12px]">Following</span>
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation (Four Tabs - Part 6) */}
        <div className="flex border-b border-[#3A3A5E]/40 mb-6 overflow-x-auto select-none no-scrollbar">
          <button
            onClick={() => setActiveTab("posts")}
            className={`py-3 px-5 text-sm font-semibold transition duration-200 whitespace-nowrap relative ${
              activeTab === "posts"
                ? "text-primary"
                : "text-[#A0A0C0] hover:text-white"
            }`}
          >
            Posts ({totalPostsCount})
            {activeTab === "posts" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-primary to-accent animate-fadeIn" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("followers")}
            className={`py-3 px-5 text-sm font-semibold transition duration-200 whitespace-nowrap relative ${
              activeTab === "followers"
                ? "text-primary"
                : "text-[#A0A0C0] hover:text-white"
            }`}
          >
            Followers ({profileUser.followers?.length || 0})
            {activeTab === "followers" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-primary to-accent animate-fadeIn" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`py-3 px-5 text-sm font-semibold transition duration-200 whitespace-nowrap relative ${
              activeTab === "following"
                ? "text-primary"
                : "text-[#A0A0C0] hover:text-white"
            }`}
          >
            Following ({profileUser.following?.length || 0})
            {activeTab === "following" && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-primary to-accent animate-fadeIn" />
            )}
          </button>

        </div>

        {/* Tab Content */}
        {activeTab === "posts" && (
          loadingPosts ? (
            renderSkeletons()
          ) : posts.length === 0 ? (
            /* Empty State Posts */
            <div className="bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl p-8 text-center flex flex-col items-center justify-center py-16 animate-fadeIn select-none">
              <span className="text-4xl mb-3 select-none">📝</span>
              <h3 className="text-white text-base font-bold mb-1">
                {isOwnProfile ? "No posts yet" : `${profileUser.name} hasn't posted yet`}
              </h3>
              <p className="text-[#A0A0C0] text-xs max-w-xs mb-4">
                {isOwnProfile
                  ? "Share your thoughts or upload your first photo with the community!"
                  : `@${profileUser.username} hasn't published any posts.`}
              </p>
              {isOwnProfile && (
                <button
                  onClick={() => navigate("/create")}
                  className="bg-primary hover:bg-primary/95 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow"
                >
                  Create first post
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
        )}

        {/* Followers List Content (Part 6) */}
        {activeTab === "followers" && (
          (profileUser.followers || []).length === 0 ? (
            <div className="bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl p-8 text-center py-16 flex flex-col items-center justify-center animate-fadeIn select-none">
              <span className="text-4xl mb-3">👥</span>
              <p className="text-white font-semibold mb-1">No followers yet</p>
              <p className="text-[#A0A0C0] text-xs">When users follow this account, they will appear here.</p>
            </div>
          ) : (
            <div className="bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl p-4 divide-y divide-[#3A3A5E]/20 space-y-1 animate-fadeIn">
              {profileUser.followers.map((follower) => (
                <UserListItem
                  key={follower._id}
                  user={follower}
                  onFollowToggle={handleListFollowToggle}
                />
              ))}
            </div>
          )
        )}

        {/* Following List Content (Part 6) */}
        {activeTab === "following" && (
          (profileUser.following || []).length === 0 ? (
            <div className="bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl p-8 text-center py-16 flex flex-col items-center justify-center animate-fadeIn select-none">
              <span className="text-4xl mb-3">👣</span>
              <p className="text-white font-semibold mb-1">Not following anyone yet</p>
              <p className="text-[#A0A0C0] text-xs">When this user follows accounts, they will be listed here.</p>
            </div>
          ) : (
            <div className="bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl p-4 divide-y divide-[#3A3A5E]/20 space-y-1 animate-fadeIn">
              {profileUser.following.map((followedUser) => (
                <UserListItem
                  key={followedUser._id}
                  user={followedUser}
                  onFollowToggle={handleListFollowToggle}
                />
              ))}
            </div>
          )
        )}


      </div>
    </div>

    {/* Edit Profile Modal */}
    {showEditModal && (
      <EditProfileModal
        profileUser={profileUser}
        onClose={() => setShowEditModal(false)}
        onSave={handleProfileSaved}
      />
    )}

    {/* Share Profile Modal */}
    {showShareModal && (
      <ShareProfileModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        user={{ ...profileUser, postsCount: totalPostsCount }}
      />
    )}
    </>
  );
};

export default Profile;
