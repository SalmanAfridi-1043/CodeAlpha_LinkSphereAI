// FIXED: client/src/components/EditProfileModal.jsx — wrapped in portal, fixed overlay z-index, body overflow, and proper modal constraints
import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import Avatar from "./Avatar";
import Spinner from "./Spinner";

const EditProfileModal = ({ isOpen = true, profileUser, onClose, onSave }) => {
  const { updateUser } = useAuth();

  const [form, setForm] = useState({
    name: profileUser?.name || "",
    bio: profileUser?.bio || "",
    location: profileUser?.location || "",
    website: profileUser?.website || "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profileUser?.avatar || "");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(profileUser?.coverImage || "");
  const [saving, setSaving] = useState(false);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Local helper aliases for matching the exact requested layout
  const name = form.name;
  const setName = (val) => setForm((prev) => ({ ...prev, name: val }));
  const bio = form.bio;
  const setBio = (val) => setForm((prev) => ({ ...prev, bio: val }));
  const website = form.website;
  const setWebsite = (val) => setForm((prev) => ({ ...prev, website: val }));
  const location = form.location;
  const setLocation = (val) => setForm((prev) => ({ ...prev, location: val }));
  const loading = saving;
  const currentUser = profileUser;
  const error = null;

  // Trap focus & close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar image must be under 5 MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Cover image must be under 8 MB");
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("bio", bio);
      formData.append("location", location);
      formData.append("website", website);
      if (avatarFile) formData.append("avatar", avatarFile);
      if (coverFile) formData.append("coverImage", coverFile);

      const { data } = await api.put("/users/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) {
        updateUser(data.user);
        onSave(data.user);
        toast.success("Profile updated successfully! ✨");
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* OVERLAY */}
      <div
        className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div
          className="relative w-full sm:max-w-lg bg-[var(--bg-card)] border border-[#6C63FF33] rounded-t-[24px] sm:rounded-[24px] shadow-[0_0_80px_#6C63FF22] flex flex-col pointer-events-auto max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* STICKY HEADER */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <h2 className="text-[var(--text-main)] font-bold text-[17px]">
              Edit Profile
            </h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-muted)] text-[18px] hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
            >
              ✕
            </button>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 flex flex-col gap-5">
            {/* COVER IMAGE */}
            <div
              className="relative h-32 rounded-2xl overflow-hidden cursor-pointer group"
              onClick={() => coverInputRef.current?.click()}
            >
              {coverPreview ? (
                <img src={coverPreview} className="w-full h-full object-cover" alt="Cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#6C63FF33] to-[#FF658422] flex items-center justify-center">
                  <span className="text-[var(--text-muted)] text-sm">
                    No cover image
                  </span>
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  📷 Change Cover
                </span>
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleCoverChange}
              />
            </div>

            {/* AVATAR */}
            <div className="flex items-center gap-4 -mt-8 ml-4">
              <div
                className="relative cursor-pointer group"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Avatar
                  user={{ ...currentUser, avatar: avatarPreview }}
                  size="xl"
                  showRing={true}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">📷</span>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarChange}
                />
              </div>
              <p className="text-[var(--text-muted)] text-xs mt-8">
                Click avatar to change photo
              </p>
            </div>

            {/* NAME FIELD */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">
                Full Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] text-[14px] focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF22] outline-none transition"
              />
            </div>

            {/* BIO FIELD */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                maxLength={200}
                rows={3}
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-main)] text-[14px] focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF22] outline-none transition resize-none"
              />
              <p
                className={`text-right text-[11px] mt-1 ${
                  bio.length > 160 ? "text-[#FF6584]" : "text-[var(--text-muted)]"
                }`}
              >
                {bio.length}/200
              </p>
            </div>

            {/* WEBSITE FIELD */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">
                Website
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  🔗
                </span>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-3 text-[var(--text-main)] text-[14px] focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF22] outline-none transition"
                />
              </div>
            </div>

            {/* LOCATION FIELD */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-1.5 block">
                Location
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  📍
                </span>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-3 text-[var(--text-main)] text-[14px] focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF22] outline-none transition"
                />
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-[13px]">
                {error}
              </div>
            )}
          </div>
          {/* END SCROLLABLE BODY */}

          {/* STICKY FOOTER */}
          <div className="flex-shrink-0 flex gap-3 justify-end px-6 py-4 border-t border-[var(--border)]">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-[14px] font-medium border border-[var(--border)] text-[var(--text-sub)] hover:border-[#6C63FF] hover:text-[#6C63FF] transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-7 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-gradient-to-r from-[#6C63FF] to-[#FF6584] shadow-[0_0_20px_#6C63FF44] hover:shadow-[0_0_32px_#6C63FF77] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner size="sm" /> Saving...
                </>
              ) : (
                "✓ Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default EditProfileModal;
