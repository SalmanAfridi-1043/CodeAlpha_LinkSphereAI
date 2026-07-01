import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import Avatar from "./Avatar";
import Spinner from "./Spinner";

const UserListItem = ({
  user,
  onFollowToggle,
  showFollowButton = true,
  size = "sm",
}) => {
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const [isFollowing, setIsFollowing] = useState(() => {
    if (!currentUser || !currentUser.following) return false;
    return currentUser.following.some(
      (id) => id.toString() === user._id.toString()
    );
  });
  const [loading, setLoading] = useState(false);

  // Sync state if currentUser following array changes
  useEffect(() => {
    if (!currentUser || !currentUser.following) {
      setIsFollowing(false);
      return;
    }
    setIsFollowing(
      currentUser.following.some(
        (id) => id.toString() === user._id.toString()
      )
    );
  }, [currentUser, user._id]);

  const handleUserClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${user.username}`);
  };

  const handleFollowToggle = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error("Please login to follow users");
      return;
    }

    setLoading(true);

    // Optimistic Update
    const originalIsFollowing = isFollowing;
    setIsFollowing(!isFollowing);

    try {
      const { data } = await api.post(`/follow/${user._id}`);
      if (data.success) {
        setIsFollowing(data.following);

        // Update local AuthContext user following array
        let updatedFollowing = [...(currentUser.following || [])];
        if (data.following) {
          if (!updatedFollowing.includes(user._id)) {
            updatedFollowing.push(user._id);
          }
        } else {
          updatedFollowing = updatedFollowing.filter(
            (id) => id.toString() !== user._id.toString()
          );
        }
        updateUser({ ...currentUser, following: updatedFollowing });

        if (onFollowToggle) {
          onFollowToggle(user._id, data.following);
        }

        toast.success(
          data.following
            ? `Followed @${user.username}`
            : `Unfollowed @${user.username}`
        );
      }
    } catch (err) {
      // Revert on error
      setIsFollowing(originalIsFollowing);
      toast.error(err.response?.data?.message || "Failed to update follow status");
    } finally {
      setLoading(false);
    }
  };

  const isSelf = currentUser && currentUser._id.toString() === user._id.toString();

  return (
    <div
      onClick={handleUserClick}
      className="flex items-center justify-between p-3 hover:bg-[#2A2A3E]/50 rounded-xl cursor-pointer transition duration-200 border border-transparent hover:border-[#3A3A5E]/40"
    >
      <div className="flex items-center gap-3">
        <Avatar user={user} size={size} userId={user._id} showOnlineStatus={true} />
        <div>
          <div className="flex items-center gap-1">
            <span className="text-white font-medium text-sm hover:underline">
              {user.name}
            </span>
            {user.isVerified && (
              <svg className="w-3.5 h-3.5 text-primary fill-current" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
          </div>
          <span className="text-[#A0A0C0] text-xs">@{user.username}</span>
        </div>
      </div>

      {showFollowButton && !isSelf && (
        <button
          onClick={handleFollowToggle}
          disabled={loading}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full transition duration-300 flex items-center justify-center min-w-[84px] h-[30px] ${
            isFollowing
              ? "bg-transparent border border-[#3A3A5E] text-white hover:text-red-400 hover:border-red-400"
              : "bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white shadow-md"
          }`}
        >
          {loading ? (
            <Spinner size="sm" color="#ffffff" />
          ) : isFollowing ? (
            "Following"
          ) : (
            "Follow"
          )}
        </button>
      )}
    </div>
  );
};

export default UserListItem;
