// VERIFIED: pages/NotificationsPage.jsx — no issues found
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useSocket from "../hooks/useSocket";
import Avatar from "../components/Avatar";
import formatDate from "../utils/formatDate";
import usePageTitle from "../hooks/usePageTitle";

const NotificationsPage = () => {
  usePageTitle("Notifications");
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markNotificationRead,
    markAllRead,
  } = useSocket();

  const navigate = useNavigate();

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = async (notification) => {
    await markNotificationRead(notification._id);

    if (notification.type === "follow") {
      navigate(`/profile/${notification.sender?.username}`);
    } else {
      // For likes and comments, navigate to home feed
      navigate("/");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#3A3A5E] pb-4 mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full border border-primary/30">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-semibold text-primary hover:text-[#5B54DF] hover:underline transition duration-150 focus:outline-none"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List Container */}
      <div className="bg-[#1E1E2E] border border-[#3A3A5E] rounded-2xl overflow-hidden divide-y divide-[#3A3A5E]/40 shadow-xl">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center select-none animate-fadeIn">
            <span className="text-5xl mb-4 select-none">🔔</span>
            <h2 className="text-white text-lg font-semibold mb-1">You're all caught up!</h2>
            <p className="text-xs text-[#A0A0C0] max-w-xs leading-relaxed">
              Notifications will appear here when someone interacts with your posts, comments, or follows you.
            </p>
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
                className={`flex items-start gap-4 p-4 hover:bg-[#2A2A3E]/40 cursor-pointer transition duration-150 relative ${
                  !notification.isRead
                    ? "border-l-4 border-primary bg-[#6C63FF]/5"
                    : "border-l-4 border-transparent"
                }`}
              >
                {/* Sender Avatar */}
                <div className="flex-shrink-0">
                  <Avatar user={sender} size="sm" showOnlineStatus={false} />
                </div>

                {/* Content text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#F5F5FF] leading-snug break-words">
                    <span className="font-semibold text-white hover:underline">
                      {senderName}
                    </span>{" "}
                    {actionText}
                  </p>
                  <span className="text-xs text-[#A0A0C0] block mt-1.5 font-mono">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>

                {/* Unread circle indicator */}
                {!notification.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 self-center shadow-lg shadow-primary/45" />
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default NotificationsPage;
