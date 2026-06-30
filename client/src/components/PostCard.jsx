import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import formatDate from "../utils/formatDate";
import Avatar from "./Avatar";

const PostCard = ({ post, onDelete, onUpdate }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showFullImage, setShowFullImage] = useState(false);
  const [isDeletingConfirm, setIsDeletingConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const menuRef = useRef(null);

  const isOwner = currentUser && post.user && (post.user._id === currentUser._id || post.user === currentUser._id);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleUserClick = (e) => {
    e.stopPropagation();
    if (post.user?.username) {
      navigate(`/profile/${post.user.username}`);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editContent.trim() && !post.image) {
      toast.error("Post must have text or an image");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.put(`/posts/${post._id}`, { content: editContent });
      if (data.success) {
        toast.success("Post updated!");
        setIsEditing(false);
        if (onUpdate) {
          onUpdate(data.post);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update post";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { data } = await api.delete(`/posts/${post._id}`);
      if (data.success) {
        toast.success("Post deleted successfully");
        if (onDelete) {
          onDelete(post._id);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete post";
      toast.error(message);
    } finally {
      setLoading(false);
      setIsDeletingConfirm(false);
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/profile/${post.user?.username || ""}`;
    navigator.clipboard.writeText(postUrl);
    toast.success("Profile link copied to clipboard!");
  };

  return (
    <div className="bg-[#1E1E2E] rounded-2xl p-4 mb-4 border border-[#3A3A5E] hover:border-primary/40 transition-colors duration-300 relative">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleUserClick}>
          <Avatar user={post.user} size="md" />
          <div>
            <div className="flex items-center gap-1">
              <span className="text-white font-semibold hover:underline">
                {post.user?.name || "Unknown User"}
              </span>
              {post.user?.isVerified && (
                <svg
                  className="w-4 h-4 text-primary fill-current"
                  viewBox="0 0 24 24"
                  aria-label="Verified User"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </div>
            <div className="text-[#A0A0C0] text-xs">
              @{post.user?.username || "deleted_user"} · {formatDate(post.createdAt)}
            </div>
          </div>
        </div>

        {/* Triple Dot Menu */}
        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-[#A0A0C0] hover:text-white p-1 rounded-full hover:bg-[#2A2A3E] transition"
              aria-label="Post Options"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-[#1A1A26] border border-[#3A3A5E] rounded-xl shadow-xl z-10 py-1">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#F5F5FF] hover:bg-[#2A2A3E] hover:text-primary transition"
                >
                  Edit Post
                </button>
                <button
                  onClick={() => {
                    setIsDeletingConfirm(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#FF6584] hover:bg-[#2A2A3E] transition"
                >
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Overlay / Banner */}
      {isDeletingConfirm && (
        <div className="bg-[#2A1F2D] border border-accent/30 rounded-xl p-3 mt-3 flex items-center justify-between animate-fadeIn">
          <span className="text-sm text-[#FF6584] font-medium">Delete this post?</span>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-accent hover:bg-accent/80 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition"
            >
              {loading ? "Deleting..." : "Yes"}
            </button>
            <button
              onClick={() => setIsDeletingConfirm(false)}
              disabled={loading}
              className="bg-[#2A2A3E] hover:bg-[#3A3A5E] text-[#A0A0C0] text-xs px-3 py-1.5 rounded-lg transition"
            >
              No
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mt-3">
        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={500}
              className="w-full min-h-[100px] bg-[#2A2A3E] border border-[#3A3A5E] text-white rounded-xl p-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 transition resize-none text-[15px]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(post.content);
                }}
                disabled={loading}
                className="bg-[#2A2A3E] text-[#A0A0C0] hover:bg-[#3A3A5E] text-xs px-3 py-1.5 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/80 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-white text-[15px] leading-relaxed whitespace-pre-wrap">
            {post.content}
            {post.isEdited && (
              <span className="text-xs text-[#A0A0C0] ml-1.5 inline-block select-none">
                (edited)
              </span>
            )}
          </p>
        )}
      </div>

      {/* Image */}
      {post.image && (
        <div className="mt-3 overflow-hidden rounded-xl bg-[#0F0F1A]">
          <img
            src={post.image}
            alt="Post media"
            onClick={() => setShowFullImage(true)}
            className="w-full max-h-[500px] object-cover cursor-pointer hover:opacity-90 transition-opacity duration-200"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 border-t border-[#3A3A5E] pt-3 mt-4 select-none">
        {/* Like Button */}
        <button
          className="flex items-center gap-2 text-[#A0A0C0] text-sm hover:scale-105 hover:text-[#FF6584] transition duration-200 group"
          aria-label="Like Post"
        >
          <svg
            className="w-5 h-5 fill-none stroke-current group-hover:fill-[#FF6584]/20"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span className="font-medium">{post.likesCount}</span>
        </button>

        {/* Comment Button */}
        <button
          className="flex items-center gap-2 text-[#A0A0C0] text-sm hover:scale-105 hover:text-primary transition duration-200"
          aria-label="Comment on Post"
        >
          <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span className="font-medium">{post.commentsCount}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-[#A0A0C0] text-sm hover:scale-105 hover:text-accent transition duration-200"
          aria-label="Share Post"
        >
          <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 10.742l4.632-2.316m0 0a3 3 0 10-2.684-4.632 3 3 0 002.684 4.632zM8.684 13.258l4.632 2.316m0 0a3 3 0 102.684-4.632 3 3 0 00-2.684 4.632z"
            />
          </svg>
          <span className="font-medium">Share</span>
        </button>
      </div>

      {/* Lightbox Modal */}
      {showFullImage && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setShowFullImage(false)}
        >
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-4 right-4 text-[#A0A0C0] hover:text-white bg-[#1E1E2E]/60 p-2 rounded-full border border-[#3A3A5E] hover:scale-105 transition"
            aria-label="Close Lightbox"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={post.image}
            alt="Expanded view"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default PostCard;
