import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import Spinner from "../components/Spinner";
import Avatar from "../components/Avatar";
import usePageTitle from "../hooks/usePageTitle";

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  usePageTitle("Create Post");

  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // Limit size to 5MB
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be smaller than 5MB");
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim() && !imageFile) {
      setError("Please add some text or an image to post");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("content", content.trim());
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const { data } = await api.post("/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.success) {
        toast.success("Post created! 🎉");
        setContent("");
        handleRemoveImage();
        navigate("/");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create post. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4 py-6">
      <div className="max-w-xl mx-auto bg-[#1E1E2E] rounded-2xl p-6 border border-[#3A3A5E] shadow-xl relative animate-fadeIn">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#3A3A5E] pb-4 mb-4">
          <Avatar user={user} size="sm" />
          <div>
            <h1 className="text-lg font-bold text-white">Create Post</h1>
            <p className="text-xs text-[#A0A0C0]">Share something with the LinkSphere</p>
          </div>
        </div>

        {error && (
          <div className="bg-[#2A1F2D] border border-accent/20 text-[#FF6584] text-sm rounded-xl p-3 mb-4 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Text Area */}
          <div className="relative">
            <textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              disabled={loading}
              className="w-full min-h-[140px] bg-[#2A2A3E] border border-[#3A3A5E] text-white rounded-xl p-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40 transition resize-none text-[15px]"
            />
            <div className="absolute bottom-3 right-4 text-[#A0A0C0] text-xs select-none">
              {content.length}/500
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            id="image-upload-input"
          />

          {/* Image Selection / Preview Area */}
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden bg-[#0F0F1A] border border-[#3A3A5E]">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="w-full max-h-[300px] object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={loading}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black text-[#A0A0C0] hover:text-white p-1.5 rounded-full border border-[#3A3A5E] transition"
                aria-label="Remove image"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div
              onClick={() => !loading && fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#3A3A5E] hover:border-primary/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-[#2A2A3E]/30 transition group"
            >
              <div className="bg-[#2A2A3E] group-hover:bg-[#3A3A5E] text-[#A0A0C0] group-hover:text-white p-3 rounded-full transition mb-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="text-[#A0A0C0] group-hover:text-white font-medium text-sm">
                📷 Add Photo
              </span>
              <span className="text-[#A0A0C0] text-xs mt-1">Supports PNG, JPG, JPEG, WEBP up to 5MB</span>
            </div>
          )}

          {/* Buttons Row */}
          <div className="flex items-center justify-between border-t border-[#3A3A5E] pt-4">
            <button
              type="button"
              onClick={() => !loading && fileInputRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-2 text-[#A0A0C0] hover:text-white bg-[#2A2A3E]/50 hover:bg-[#2A2A3E] px-4 py-2 rounded-xl border border-[#3A3A5E] transition text-sm font-medium"
              aria-label="Upload Image Button"
            >
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Photo
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/")}
                disabled={loading}
                className="bg-[#2A2A3E] hover:bg-[#3A3A5E] text-[#A0A0C0] hover:text-white px-5 py-2 rounded-xl transition text-sm font-semibold border border-[#3A3A5E]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (!content.trim() && !imageFile)}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white px-6 py-2 rounded-xl transition text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <Spinner size="sm" color="#ffffff" />}
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
