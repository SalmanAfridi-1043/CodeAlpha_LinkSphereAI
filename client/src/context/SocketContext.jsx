import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io as socketIOClient } from "socket.io-client";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import api from "../api/axios";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const socketRef = useRef(null);
  
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Setup/Tear down Socket connection based on auth token
  useEffect(() => {
    if (token) {
      // Connect to the socket server
      const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
      const newSocket = socketIOClient(socketUrl, {
        auth: { token },
      });

      socketRef.current = newSocket;

      // Request current list of online users once connected
      newSocket.on("connect", () => {
        console.log("Socket connected:", newSocket.id);
        newSocket.emit("get_online_users");
      });

      // Handle receiving list of online users
      newSocket.on("online_users_list", (users) => {
        setOnlineUsers(users);
      });

      // Handle a user coming online
      newSocket.on("user_online", ({ userId }) => {
        setOnlineUsers((prev) => {
          if (prev.includes(userId)) return prev;
          return [...prev, userId];
        });
      });

      // Handle a user going offline
      newSocket.on("user_offline", ({ userId }) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      // Handle receiving a live notification
      newSocket.on("new_notification", (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Construct customized toast alert message
        const senderName = notification.sender?.name || "Someone";
        let message = "";
        if (notification.type === "like") {
          message = `${senderName} liked your post`;
        } else if (notification.type === "comment") {
          message = `${senderName} commented on your post`;
        } else if (notification.type === "follow") {
          message = `${senderName} started following you`;
        }

        toast(message, {
          icon: "🔔",
          style: {
            background: "#1E1E2E",
            color: "#F5F5FF",
            border: "1px solid #3A3A5E",
          },
        });
      });

      return () => {
        console.log("Disconnecting socket connection...");
        newSocket.disconnect();
        socketRef.current = null;
      };
    } else {
      // Token is empty (logout), clean up
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setOnlineUsers([]);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [token]);

  // Check if a specific user is currently online
  const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.some((id) => id.toString() === userId.toString());
  };

  // Fetch recent notifications list from API
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const { data } = await api.get("/notifications?page=1&limit=30");
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  // Mark a single notification as read
  const markNotificationRead = async (notificationId) => {
    try {
      const { data } = await api.put(`/notifications/${notificationId}/read`);
      if (data.success) {
        // Toggle notification isRead in local state
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        // Decrement unread badge count
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Mark all notifications as read
  const markAllRead = async () => {
    try {
      const { data } = await api.put("/notifications/read-all");
      if (data.success) {
        // Mark all local list notifications read
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
        toast.success("All notifications marked as read", {
          style: {
            background: "#1E1E2E",
            color: "#F5F5FF",
            border: "1px solid #3A3A5E",
          },
        });
      }
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        onlineUsers,
        notifications,
        unreadCount,
        isUserOnline,
        fetchNotifications,
        markNotificationRead,
        markAllRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
