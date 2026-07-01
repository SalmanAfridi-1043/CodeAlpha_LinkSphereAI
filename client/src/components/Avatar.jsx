import React from "react";
import useSocket from "../hooks/useSocket";

const sizeClasses = {
  xs: "w-6 h-6 text-[10px] font-semibold",
  sm: "w-8 h-8 text-xs font-semibold",
  md: "w-11 h-11 text-sm font-semibold",
  lg: "w-20 h-20 text-lg font-bold",
  xl: "w-32 h-32 text-2xl font-bold",
};

// DEBUGGED: Added showRing gradient border, isVerified top-right badge, and defensive try/catch on useSocket.

const Avatar = ({
  user,
  size = "md",
  className = "",
  showOnlineStatus = false,
  userId = null,
  showRing = false,
}) => {
  let socketContext = null;
  try {
    socketContext = useSocket();
  } catch (err) {
    console.warn("useSocket context not available in Avatar:", err);
  }

  const avatarUrl = user?.avatar;
  const name = user?.name || "?";

  // Get initials (up to 2 letters)
  const getInitials = (nameStr) => {
    if (!nameStr) return "?";
    const parts = nameStr.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;
  const isOnline =
    showOnlineStatus &&
    userId &&
    socketContext &&
    socketContext.isUserOnline(userId);

  // Extract dimensions and style styles separately to allow showing the dot badge on the edge
  const dimensionClasses = currentSizeClass.split(" ").slice(0, 2).join(" ");
  const textStyleClasses = currentSizeClass.split(" ").slice(2).join(" ");

  return (
    <div
      className={`relative inline-flex flex-shrink-0 select-none ${dimensionClasses} ${className}`}
    >
      <div
        className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary to-accent text-white ${
          showRing ? "p-[2px]" : ""
        }`}
      >
        <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[#1E1E2E] ${showRing ? "" : "bg-transparent"}`}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className={`uppercase ${textStyleClasses}`}>
              {getInitials(name)}
            </div>
          )}
        </div>
      </div>

      {isOnline && (
        <span
          className={`absolute bottom-0 right-0 bg-green-500 border-2 border-[#1E1E2E] rounded-full ${
            size === "lg" || size === "xl" ? "w-3.5 h-3.5" : "w-2.5 h-2.5"
          }`}
          title="Online"
        />
      )}

      {user?.isVerified && (
        <span
          className={`absolute top-0 right-0 bg-primary text-white rounded-full flex items-center justify-center border border-[#1E1E2E] ${
            size === "lg" || size === "xl" ? "w-4 h-4 text-[8px]" : "w-3 h-3 text-[6px]"
          }`}
          title="Verified"
        >
          ✓
        </span>
      )}
    </div>
  );
};

export default Avatar;
