import React from "react";

const sizeClasses = {
  sm: "w-8 h-8 text-xs font-semibold",
  md: "w-11 h-11 text-sm font-semibold",
  lg: "w-20 h-20 text-lg font-bold",
  xl: "w-32 h-32 text-2xl font-bold",
};

const Avatar = ({ user, size = "md", className = "" }) => {
  const avatarUrl = user?.avatar;
  const name = user?.name || "?";
  
  // Get initials (up to 2 letters)
  const getInitials = (nameStr) => {
    if (!nameStr) return "?";
    const parts = nameStr.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`relative inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 select-none ${currentSizeClass} ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // If image fails to load, clear src to trigger fallback initials
            e.target.style.display = "none";
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center uppercase">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

export default Avatar;
