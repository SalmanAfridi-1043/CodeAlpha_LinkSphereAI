import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import formatDate from "../utils/formatDate";
import Avatar from "./Avatar";
import Spinner from "./Spinner";
import useSocket from "../hooks/useSocket";
import MentionInput from "./MentionInput";

const PostCard = ({ post, onDelete, onUpdate }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { socket: _socket } = useSocket();

  const renderTextWithMentions = (text) => {
    if (!text) return "";

    const regex = /(@[a-zA-Z0-9_]+)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <span
            key={index}
            className="text-[#6C63FF] font-medium hover:underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${part.slice(1)}`);
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  useEffect(() => {
    // Real-time per-post like/comment sync via socket rooms is a possible future enhancement — for now, the notification system handles cross-user awareness, and optimistic updates handle the acting user's own UI
  }, []);

  // Post Card core states
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showFullImage, setShowFullImage] = useState(false);
  const [isDeletingConfirm, setIsDeletingConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Likes and Comments dynamic states (Part 5 additions)
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [commentDeletingId, setCommentDeletingId] = useState(null);
  
  const [loadingCommentsMore, setLoadingCommentsMore] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsHasMore, setCommentsHasMore] = useState(false);

  const menuRef = useRef(null);

  const isOwner = currentUser && post.user && (post.user._id === currentUser._id || post.user === currentUser._id);

  // Sync state values if props change
  useEffect(() => {
    setIsLiked(post.isLiked);
    setLikesCount(post.likesCount);
    setCommentsCount(post.commentsCount);
    setEditContent(post.content);
  }, [post]);

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

  // Like Action (Optimistic toggle - Part 5)
  const handleLike = async () => {
    const originalIsLiked = isLiked;
    const originalLikesCount = likesCount;

    // Optimistic Update
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? Math.max(0, likesCount - 1) : likesCount + 1);

    try {
      const { data } = await api.post(`/likes/${post._id}`);
      if (data.success) {
        // Sync states with server response
        setIsLiked(data.liked);
        setLikesCount(data.likesCount);
      }
    } catch (err) {
      // Revert on failure
      setIsLiked(originalIsLiked);
      setLikesCount(originalLikesCount);
      toast.error(err.response?.data?.message || "Something went wrong");
    }
  };

  // Fetch comments (Part 5)
  const fetchComments = async (pageNumber = 1, isInitial = false) => {
    if (isInitial) {
      setCommentsLoading(true);
    } else {
      setLoadingCommentsMore(true);
    }

    try {
      const { data } = await api.get(`/comments/${post._id}?page=${pageNumber}&limit=20`);
      if (data.success) {
        if (isInitial) {
          setComments(data.comments);
        } else {
          setComments((prev) => {
            const existingIds = new Set(prev.map((c) => c._id));
            const newComments = data.comments.filter((c) => !existingIds.has(c._id));
            return [...prev, ...newComments];
          });
        }
        setCommentsHasMore(data.hasMore);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load comments");
    } finally {
      setCommentsLoading(false);
      setLoadingCommentsMore(false);
    }
  };

  // Toggle comments drawer view (Part 5)
  const handleCommentToggle = () => {
    const newShow = !showComments;
    setShowComments(newShow);
    if (newShow && comments.length === 0) {
      fetchComments(1, true);
      setCommentsPage(1);
    }
  };

  // Submit a comment (Part 5)
  const handleAddCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (newComment.trim().length > 300) {
      toast.error("Comment cannot exceed 300 characters");
      return;
    }

    setPostingComment(true);
    try {
      const { data } = await api.post(`/comments/${post._id}`, { text: newComment.trim() });
      if (data.success) {
        setComments((prev) => [data.comment, ...prev]);
        setNewComment("");
        setCommentsCount(data.commentsCount);
        toast.success("Comment added");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add comment");
    } finally {
      setPostingComment(false);
    }
  };

  // Save modified comment (Part 5)
  const handleSaveCommentEdit = async (commentId) => {
    if (!editingCommentText.trim()) return;
    
    if (editingCommentText.trim().length > 300) {
      toast.error("Comment cannot exceed 300 characters");
      return;
    }

    try {
      const { data } = await api.put(`/comments/${commentId}`, { text: editingCommentText.trim() });
      if (data.success) {
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? data.comment : c))
        );
        setEditingCommentId(null);
        setEditingCommentText("");
        toast.success("Comment updated");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to edit comment");
    }
  };

  // Delete comment (Part 5)
  const handleDeleteComment = async (commentId) => {
    try {
      const { data } = await api.delete(`/comments/${commentId}`);
      if (data.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        setCommentsCount(data.commentsCount);
        setCommentDeletingId(null);
        toast.success("Comment deleted");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete comment");
    }
  };

  const loadMoreComments = () => {
    const nextPage = commentsPage + 1;
    fetchComments(nextPage);
    setCommentsPage(nextPage);
  };

  // UI UPGRADED: PostCard
  return (
    <div className="bg-[#12121F] border border-[#2A2A40] rounded-[20px] p-4 mb-4 hover:border-[#3D3D60] hover:shadow-[0_0_30px_rgba(108,99,255,0.11)] transition-all duration-200 relative">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleUserClick}>
          <Avatar user={post.user} size="md" userId={post.user?._id || post.user} showOnlineStatus={true} />
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
            {renderTextWithMentions(post.content)}
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
        <div className="mt-3 overflow-hidden rounded-[16px] bg-[#0F0F1A]">
          <img
            src={post.image}
            alt="Post media"
            onClick={() => setShowFullImage(true)}
            className="w-full max-h-[500px] object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 border-t border-[#3A3A5E]/40 pt-3 mt-4 select-none">
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm transition-all duration-200 group active:scale-[0.97] hover:text-[#FF6584] hover:shadow-[0_0_15px_rgba(255,101,132,0.25)] rounded-lg px-2.5 py-1 ${
            isLiked ? "text-[#FF6584]" : "text-[#A0A0C0]"
          }`}
          aria-label="Like Post"
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${
              isLiked 
                ? "fill-[#FF6584] stroke-[#FF6584] animate-[heartPop_0.3s_ease]" 
                : "fill-none stroke-current group-hover:fill-[#FF6584]/20"
            }`}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span className="font-medium">{likesCount}</span>
        </button>

        {/* Comment Button */}
        <button
          onClick={handleCommentToggle}
          className={`flex items-center gap-2 text-sm transition-all duration-200 hover:text-primary hover:shadow-[0_0_15px_rgba(108,99,255,0.25)] rounded-lg px-2.5 py-1 ${
            showComments ? "text-primary animate-[heartPop_0.3s_ease]" : "text-[#A0A0C0]"
          }`}
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
          <span className="font-medium">{commentsCount}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-[#A0A0C0] text-sm transition duration-200 hover:text-accent hover:shadow-[0_0_15px_rgba(255,101,132,0.25)] rounded-lg px-2.5 py-1"
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

      {/* Comments Drawer (Part 5) */}
      <div 
        className={`border-t border-[#3A3A5E]/40 pt-3 mt-3 space-y-3 overflow-hidden transition-all duration-300 ease-in-out ${
          showComments ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
          {/* Comment Form */}
          <form onSubmit={handleAddCommentSubmit} className="flex gap-2.5 items-center">
            <Avatar user={currentUser} size="sm" className="w-8 h-8" />
            <MentionInput
              placeholder="Write a comment..."
              value={newComment}
              onChange={setNewComment}
              className="bg-[#2A2A3E] text-white placeholder-[#A0A0C0] rounded-[18px] px-4 py-2 text-sm flex-1 border border-[#3A3A5E] focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              style={{ minHeight: "38px", height: "38px", overflow: "hidden", lineHeight: "1.4" }}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || postingComment}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 text-white rounded-full p-2 w-9 h-9 flex items-center justify-center flex-shrink-0 transition duration-200 shadow-md"
              aria-label="Submit Comment"
            >
              {postingComment ? (
                <Spinner size="sm" color="#ffffff" />
              ) : (
                <svg className="w-4 h-4 text-white transform rotate-45 -translate-x-[1px] translate-y-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>

          {/* Comments Loading Skeletons */}
          {commentsLoading ? (
            <div className="space-y-3 mt-4 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <div className="w-8 h-8 bg-[#2A2A3E] rounded-full flex-shrink-0" />
                  <div className="bg-[#2A2A3E] rounded-2xl p-3 h-10 w-2/3" />
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-[#A0A0C0] text-xs select-none">
              No comments yet. Be the first!
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {comments.map((comment) => (
                <div key={comment._id} className="flex gap-2.5 items-start mt-2 group/comment relative">
                  <Avatar user={comment.user} size="sm" className="w-8 h-8" userId={comment.user?._id || comment.user} showOnlineStatus={true} />
                  <div className="flex-1">
                    {editingCommentId === comment._id ? (
                      <div className="space-y-2 bg-[#2A2A3E] rounded-2xl p-3 border border-[#3A3A5E]">
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          maxLength={300}
                          className="w-full bg-[#1E1E2E] border border-[#3A3A5E] text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none text-[13px]"
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditingCommentText("");
                            }}
                            className="bg-[#1E1E2E] text-[#A0A0C0] hover:text-white px-3 py-1 rounded-lg border border-[#3A3A5E] transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveCommentEdit(comment._id)}
                            className="bg-primary text-white px-3 py-1 rounded-lg font-semibold transition"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="bg-[#2A2A3E] rounded-2xl px-3.5 py-2 inline-block max-w-[95%] border border-[#2A2A3E] group-hover/comment:border-[#3A3A5E] transition-colors duration-200">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="font-semibold text-white text-xs leading-none">
                              {comment.user?.name || "User"}
                            </span>
                            {comment.user?.isVerified && (
                              <svg className="w-3 h-3 text-primary fill-current" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                            )}
                            <span className="text-[#A0A0C0] text-[10px]">
                              @{comment.user?.username || "user"}
                            </span>
                          </div>
                          <p className="text-white text-sm break-all leading-relaxed whitespace-pre-wrap">
                            {renderTextWithMentions(comment.text)}
                          </p>
                        </div>

                        {/* Comment action footer metadata */}
                        <div className="flex items-center gap-3 mt-1 ml-1.5 text-[11px] text-[#A0A0C0] select-none">
                          <span>{formatDate(comment.createdAt)}</span>
                          {comment.isEdited && <span>(edited)</span>}

                          {currentUser && comment.user && (comment.user._id === currentUser._id || comment.user === currentUser._id) && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment._id);
                                  setEditingCommentText(comment.text);
                                }}
                                className="hover:text-primary transition font-semibold"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setCommentDeletingId(comment._id)}
                                className="hover:text-accent transition font-semibold"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>

                        {/* Inline delete confirmation banner */}
                        {commentDeletingId === comment._id && (
                          <div className="mt-2 p-2 bg-[#2A1F2D] border border-accent/20 rounded-xl flex items-center justify-between text-xs max-w-xs animate-fadeIn">
                            <span className="text-[#FF6584] font-medium">Delete comment?</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="bg-accent text-white px-2.5 py-1 rounded-lg font-semibold hover:bg-accent/80 transition"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setCommentDeletingId(null)}
                                className="bg-[#2A2A3E] text-[#A0A0C0] px-2.5 py-1 rounded-lg hover:bg-[#3A3A5E] transition"
                              >
                                No
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Load more comments link */}
              {commentsHasMore && (
                <div className="text-center pt-2">
                  <button
                    onClick={loadMoreComments}
                    disabled={loadingCommentsMore}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1.5 mx-auto disabled:opacity-50"
                  >
                    {loadingCommentsMore && <Spinner size="sm" />}
                    {loadingCommentsMore ? "Loading..." : "Load More Comments"}
                  </button>
                </div>
              )}
            </div>
          )}
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
