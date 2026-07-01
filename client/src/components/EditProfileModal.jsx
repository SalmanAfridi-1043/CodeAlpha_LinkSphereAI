import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import Avatar from "./Avatar";
import Spinner from "./Spinner";

const EditProfileModal = ({ profileUser, onClose, onSave }) => {
  const { updateUser } = useAuth();

  const [form, setForm] = useState({
    name: profileUser.name || "",
    bio: profileUser.bio || "",
    location: profileUser.location || "",
    website: profileUser.website || "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profileUser.avatar || "");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(profileUser.coverImage || "");
  const [saving, setSaving] = useState(false);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const modalRef = useRef(null);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("bio", form.bio);
      formData.append("location", form.location);
      formData.append("website", form.website);
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-[#12121F] border border-[#2A2A40] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        style={{ boxShadow: "0 0 60px rgba(108,99,255,0.12)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2A2A40] flex-shrink-0">
          <h2 className="text-white font-bold text-lg tracking-tight">Edit Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[#A0A0C0] hover:text-white hover:bg-[#2A2A40] transition duration-150"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 no-scrollbar">
          <form onSubmit={handleSubmit} id="edit-profile-form">

            {/* Cover Image Section */}
            <div className="relative h-36 bg-gradient-to-r from-primary/30 to-accent/30 group cursor-pointer select-none"
              onClick={() => coverInputRef.current?.click()}
            >
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Cover Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-40">
                  <span className="text-[#A0A0C0] text-sm">No cover image</span>
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white text-xs font-semibold">Change Cover</span>
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverChange}
              />
            </div>

            {/* Avatar + rest of form */}
            <div className="px-6 pb-6">
              {/* Avatar edit bubble */}
              <div className="relative -mt-10 mb-5 inline-block">
                <div
                  className="relative cursor-pointer group"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Avatar
                    user={{ ...profileUser, avatar: avatarPreview }}
                    size="xl"
                    showRing={true}
                    showOnlineStatus={false}
                    className="border-4 border-[#12121F]"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Form Fields */}
              <div className="space-y-4">

                {/* Name */}
                <div>
                  <label className="block text-[#A0A0C0] text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    Name <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    maxLength={50}
                    placeholder="Your display name"
                    className="input-field w-full bg-[#1A1A2E] border border-[#2A2A40] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition placeholder-[#A0A0C0]/50"
                    required
                  />
                  <p className="text-[#A0A0C0]/60 text-[11px] mt-1 text-right">{form.name.length}/50</p>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-[#A0A0C0] text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    maxLength={200}
                    rows={3}
                    placeholder="Tell people a little about yourself..."
                    className="input-field w-full bg-[#1A1A2E] border border-[#2A2A40] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition resize-none placeholder-[#A0A0C0]/50"
                  />
                  <p className="text-[#A0A0C0]/60 text-[11px] mt-1 text-right">{form.bio.length}/200</p>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[#A0A0C0] text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    Location
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0A0C0]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      maxLength={80}
                      placeholder="City, Country"
                      className="input-field w-full bg-[#1A1A2E] border border-[#2A2A40] text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition placeholder-[#A0A0C0]/50"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-[#A0A0C0] text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    Website
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0A0C0]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      maxLength={150}
                      placeholder="https://yourwebsite.com"
                      className="input-field w-full bg-[#1A1A2E] border border-[#2A2A40] text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition placeholder-[#A0A0C0]/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-[#2A2A40] flex items-center justify-end gap-3 flex-shrink-0 bg-[#12121F]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#A0A0C0] hover:text-white border border-[#2A2A40] hover:border-[#3A3A5E] hover:bg-[#1A1A2E] transition duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-profile-form"
            disabled={saving || !form.name.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed min-w-[100px] justify-center"
          >
            {saving ? (
              <>
                <Spinner size="sm" color="#ffffff" />
                <span>Saving...</span>
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
