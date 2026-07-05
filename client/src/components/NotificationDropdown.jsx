// FIXED: notification identity — correct sender info display and click triggers
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useSocket from "../hooks/useSocket";
import Avatar from "./Avatar";
import formatDate from "../utils/formatDate";

const NotificationDropdown = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markNotificationRead,
    markAllRead,
  } = useSocket();

  const navigate = useNavigate();

  // Load latest notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNotificationClick = async (notification) => {
    await markNotificationRead(notification._id);
    onClose();

    if (
      notification.type === "follow" ||
      notification.type === "connection_request" ||
      notification.type === "connection_accepted"
    ) {
      // Navigate to sender's profile
      navigate(`/profile/${notification.sender?.username}`);
    } else {
      // For likes, comments, and mentions, navigate back to home feed
      navigate("/");
    }
  };

  const getNotificationText = (notification) => {
    // Always use notification.sender — never auth user
    const name = notification?.sender?.name || "Someone";

    const texts = {
      like: `${name} liked your post`,
      comment: `${name} commented on your post`,
      follow: `${name} started following you`,
      mention: `${name} mentioned you in a post`,
      connection_request: `${name} sent you a connection request`,
      connection_accepted: `${name} accepted your connection request`,
    };

    return texts[notification.type] || `${name} interacted with you`;
  };

  const getNotificationIcon = (type) => {
    const icons = {
      like: "❤️",
      comment: "💬",
      follow: "👤",
      mention: "🔔",
      connection_request: "🤝",
      connection_accepted: "✅",
    };
    return icons[type] || "🔔";
  };

  return (
    <div className="absolute top-12 right-0 w-80 max-h-96 overflow-y-auto glass rounded-2xl shadow-2xl z-50 animate-fadeIn no-scrollbar flex flex-col select-none">
      {/* Dropdown Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-[#3A3A5E]/40">
        <span className="text-sm font-semibold text-white">Notifications</span>
        {unreadCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              markAllRead();
            }}
            className="text-xs font-semibold text-primary hover:text-[#5B54DF] hover:underline transition duration-150 focus:outline-none"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-[#3A3A5E]/30 overflow-y-auto max-h-[320px] no-scrollbar">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <span className="text-3xl mb-2 select-none">🔔</span>
            <p className="text-xs text-[#A0A0C0] font-medium">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const sender = notification.sender || {};
            const senderName = sender.name || "Someone";

            return (
              <div
                key={notification._id}
                className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-[var(--bg-hover)] transition rounded-xl ${
                  !notification.isRead
                    ? "border-l-2 border-[#6C63FF] bg-[#6C63FF08]"
                    : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Sender Avatar — NOT current user avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar
                    user={sender}
                    size="sm"
                    showOnlineStatus={false}
                  />
                  <span className="absolute -bottom-1 -right-1 text-[12px]">
                    {getNotificationIcon(notification.type)}
                  </span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text-main)] text-[13px] leading-snug break-words text-[#F5F5FF]">
                    <span className="font-semibold text-white hover:underline">
                      {senderName}
                    </span>{" "}
                    {getNotificationText(notification)
                      .replace(senderName, "")
                      .trim()}
                  </p>
                  <p className="text-[var(--text-muted)] text-[11px] mt-1 text-[#A0A0C0]">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>

                {/* Unread dot */}
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-[#6C63FF] flex-shrink-0 mt-1" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
