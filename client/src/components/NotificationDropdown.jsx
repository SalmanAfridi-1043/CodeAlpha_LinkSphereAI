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

// UI UPGRADED: NotificationDropdown
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
          notifications.map((notification, index) => {
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
                className={`flex items-start justify-between gap-3 p-3 hover:bg-[#2A2A3E]/40 cursor-pointer transition duration-150 relative animate-[slideIn_0.3s_ease-out]`}
                style={{ animationDelay: `${index * 0.04}s`, animationFillMode: "both" }}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Sender Avatar */}
                  <div className="flex-shrink-0 relative">
                    <Avatar user={sender} size="sm" showOnlineStatus={false} />
                    {!notification.isRead && (
                      <span className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full bg-primary ring-2 ring-[#12121F]" />
                    )}
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
                </div>

                {/* Type Icon Indicator Circle */}
                <div className="flex-shrink-0 self-center ml-2">
                  {notification.type === "like" && (
                    <div className="w-7 h-7 rounded-full bg-[#FF6584]/15 flex items-center justify-center border border-[#FF6584]/30 shadow-[0_0_10px_rgba(255,101,132,0.15)]">
                      <span className="text-xs">❤️</span>
                    </div>
                  )}
                  {notification.type === "comment" && (
                    <div className="w-7 h-7 rounded-full bg-[#6C63FF]/15 flex items-center justify-center border border-[#6C63FF]/30 shadow-[0_0_10px_rgba(108,99,255,0.15)]">
                      <span className="text-xs">💬</span>
                    </div>
                  )}
                  {notification.type === "follow" && (
                    <div className="w-7 h-7 rounded-full bg-[#00D9A3]/15 flex items-center justify-center border border-[#00D9A3]/30 shadow-[0_0_10px_rgba(0,217,163,0.15)]">
                      <span className="text-xs">👤</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
