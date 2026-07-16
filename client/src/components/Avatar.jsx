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
  src,
  name: nameProp,
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

  // Accept either direct src/name props OR a user object — direct props take priority
  const avatarUrl = src ?? user?.avatar ?? "";
  const name = nameProp ?? user?.name ?? "?";

  // Get initials (up to 2 letters) — safe for null/empty
  const getInitials = (nameStr) => {
    if (!nameStr || typeof nameStr !== "string" || !nameStr.trim()) return "?";
    const parts = nameStr.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  };

  // Only treat src as valid if it's a non-empty string
  const hasValidSrc = avatarUrl && typeof avatarUrl === "string" && avatarUrl.trim() !== "";

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;
  const isOnline =
    showOnlineStatus &&
    userId &&
    socketContext &&
    socketContext.isUserOnline(userId);

  // Extract dimensions and style styles separately to allow showing the dot badge on the edge
  const dimensionClasses = currentSizeClass.split(" ").slice(0, 2).join(" ");
  const textStyleClasses = currentSizeClass.split(" ").slice(2).join(" ");

// UI UPGRADED: Avatar
  return (
    <div
      className={`relative inline-flex flex-shrink-0 select-none ${dimensionClasses} ${className}`}
    >
      {/* Conic rotating gradient ring */}
      {showRing && (
        <div className="absolute inset-0 rounded-full p-[2px] bg-gradient-to-tr from-primary via-accent to-primary animate-[ringRotate_4s_linear_infinite]" />
      )}

      <div
        className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center text-white z-10 ${
          showRing ? "p-[2px]" : "bg-gradient-to-br from-primary to-accent"
        }`}
      >
        <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center ${
          hasValidSrc
            ? "bg-[#1E1E2E]" 
            : "bg-gradient-to-br from-primary to-accent text-white font-bold"
        }`}>
          {hasValidSrc ? (
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
          className={`absolute bottom-0 right-0 bg-green-500 border-2 border-[#1E1E2E] rounded-full z-20 animate-[onlinePulse_2s_infinite] ${
            size === "lg" || size === "xl" ? "w-3.5 h-3.5" : "w-2.5 h-2.5"
          }`}
          title="Online"
        />
      )}

      {(user?.isVerified) && (
        <span
          className={`absolute top-0 right-0 bg-primary text-white rounded-full flex items-center justify-center border border-[#1E1E2E] z-20 ${
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
