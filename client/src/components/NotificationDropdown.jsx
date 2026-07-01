// VERIFIED: components/NotificationDropdown.jsx — no issues found
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
  }, [isOpen, fetchNotifications]);

  if (!isOpen) return null;

  const handleNotificationClick = async (notification) => {
    await markNotificationRead(notification._id);
    onClose();

    if (notification.type === "follow") {
      navigate(`/profile/${notification.sender?.username}`);
    } else {
      // For likes and comments, navigate back to home feed or dashboard
      navigate("/");
    }
  };

  return (
    <div className="absolute top-12 right-0 w-80 max-h-96 overflow-y-auto bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl shadow-2xl z-50 animate-fadeIn no-scrollbar flex flex-col select-none">
      {/* Dropdown Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-[#3A3A5E]/60">
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
      <div className="divide-y divide-[#3A3A5E]/40 overflow-y-auto max-h-[320px] no-scrollbar">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <span className="text-3xl mb-2 select-none">🔔</span>
            <p className="text-xs text-[#A0A0C0] font-medium">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const sender = notification.sender || {};
            const senderName = sender.name || "Someone";
            
            let actionText = "";
            if (notification.type === "like") {
              actionText = "liked your post";
            } else if (notification.type === "comment") {
              actionText = "commented on your post";
            } else if (notification.type === "follow") {
              actionText = "started following you";
            }

            return (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex items-start gap-3 p-3 hover:bg-[#2A2A3E] cursor-pointer transition duration-150 relative ${
                  !notification.isRead
                    ? "border-l-2 border-primary bg-[#6C63FF]/5"
                    : ""
                }`}
              >
                {/* Sender Avatar */}
                <div className="flex-shrink-0">
                  <Avatar user={sender} size="sm" showOnlineStatus={false} />
                </div>

                {/* Content text */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#F5F5FF] leading-snug break-words">
                    <span className="font-semibold text-white hover:underline">
                      {senderName}
                    </span>{" "}
                    {actionText}
                  </p>
                  <span className="text-[10px] text-[#A0A0C0] block mt-1">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>

                {/* Unread circle indicator */}
                {!notification.isRead && (
                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 self-center" />
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
