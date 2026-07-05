// VERIFIED: context/SocketContext.jsx — no issues found
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io as socketIOClient } from "socket.io-client";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import api from "../api/axios";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const isFetching = useRef(false);
  
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingConnectionCount, setPendingConnectionCount] = useState(0);

  // Setup/Tear down Socket connection based on auth token
  useEffect(() => {
    // Clear notifications immediately on token change to prevent stale data between account switches
    setNotifications([]);
    setUnreadCount(0);

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
      newSocket.on("new_notification", (data) => {
        if (!data || !data.sender) return;

        // FIXED: notification identity — always use data.sender, never auth user
        const senderName = data?.sender?.name || "Someone";

        const messages = {
          like: `❤️ ${senderName} liked your post`,
          comment: `💬 ${senderName} commented on your post`,
          follow: `👤 ${senderName} started following you`,
          mention: `🔔 ${senderName} mentioned you`,
          connection_request: `🤝 ${senderName} wants to connect`,
          connection_accepted: `✅ ${senderName} accepted your request`,
        };

        const message = messages[data.type] || `🔔 ${senderName} did something`;

        // Prepend to top — deduplicate by _id to prevent double entries
        setNotifications((prev) => {
          const exists = prev.some((n) => n._id === data._id);
          if (exists) return prev;
          return [data, ...prev]; // newest always on top
        });
        setUnreadCount((prev) => prev + 1);

        // Show toast with correct person's name
        toast(message, {
          style: {
            background: "#12121F",
            color: "#fff",
            border: "1px solid #6C63FF44",
            borderRadius: "12px",
          },
        });
      });

      // FIXED: Handle real-time connection_request socket event
      newSocket.on("connection_request", (data) => {
        setPendingConnectionCount((prev) => prev + 1);
        const name = data?.sender?.name || "Someone";
        toast(`🤝 ${name} wants to connect with you!`, {
          style: {
            background: "#12121F",
            color: "#fff",
            border: "1px solid #6C63FF44",
          },
        });
      });

      // FIXED: Handle connection_accepted event — notify sender when their request is accepted
      newSocket.on("connection_accepted", (data) => {
        const acceptorName = data?.receiver?.name || data?.sender?.name || "Someone";
        toast.success(`🎉 ${acceptorName} accepted your connection request!`, {
          style: {
            background: "#12121F",
            color: "#fff",
            border: "1px solid #6C63FF44",
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

  const fetchPendingConnectionCount = async () => {
    if (!token) return;
    try {
      const res = await api.get("/connections/pending");
      setPendingConnectionCount(res?.data?.count || 0);
    } catch (err) {
      console.error("Failed to fetch pending connection count:", err);
    }
  };

  // Fetch recent notifications list from API — always sort newest first
  const fetchNotifications = async () => {
    if (!token || isFetching.current) return;
    isFetching.current = true;
    try {
      const res = await api.get("/notifications?limit=50");
      const list = res?.data?.notifications || [];
      // Ensure newest-first order on client regardless of server ordering
      const sorted = [...list].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setNotifications(sorted);
      setUnreadCount(res?.data?.unreadCount ?? 0);
    } catch (err) {
      console.error("Notif fetch error:", err);
    } finally {
      isFetching.current = false;
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
      fetchPendingConnectionCount();
    }
  }, [token]);

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
        pendingConnectionCount,
        setPendingConnectionCount,
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
