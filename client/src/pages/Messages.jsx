import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../hooks/useAuth";
import { useSocket } from "../context/SocketContext";
import Avatar from "../components/Avatar";
import Spinner from "../components/Spinner";

const Messages = () => {
  const { username: routeUsername } = useParams();
  const { user: currentUser } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [conversationsSearch, setConversationsSearch] = useState("");

  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");

  const [isTyping, setIsTyping] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch all conversations
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConversations(true);
    try {
      const { data } = await api.get("/messages");
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOtherTyping]);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [routeUsername]);

  // Handle active user lookup/change when route param username updates
  useEffect(() => {
    if (!routeUsername) {
      setActiveUser(null);
      setMessages([]);
      return;
    }

    const loadActiveUser = async () => {
      setLoadingMessages(true);
      try {
        // Fetch target user profile details
        const { data: profileData } = await api.get(`/posts/profile/${routeUsername}`);
        if (profileData.success && profileData.user) {
          const targetUser = profileData.user;
          setActiveUser(targetUser);

          // Fetch messages
          const { data: msgData } = await api.get(`/messages/${targetUser._id}`);
          if (msgData.success) {
            setMessages(msgData.messages);

            // Mark read locally and trigger conversation reload to clear badge counts
            setConversations((prev) =>
              prev.map((c) =>
                c.user._id.toString() === targetUser._id.toString()
                  ? { ...c, unreadCount: 0 }
                  : c
              )
            );
          }
        }
      } catch (err) {
        console.error("Failed to load active conversation:", err);
        toast.error("Failed to load conversation details");
        navigate("/messages");
      } finally {
        setLoadingMessages(false);
      }
    };

    loadActiveUser();
  }, [routeUsername, navigate]);

  // Handle real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      // If the message is for the currently open conversation
      if (
        activeUser &&
        (message.sender._id.toString() === activeUser._id.toString() ||
          message.receiver._id.toString() === activeUser._id.toString())
      ) {
        setMessages((prev) => [...prev, message]);
        // Call API to mark as read immediately
        api.get(`/messages/${activeUser._id}`).catch(console.error);
      } else {
        // Show message notification toast
        toast(`New message from ${message.sender.name}`, {
          icon: "💬",
          onClick: () => navigate(`/messages/${message.sender.username}`),
          style: {
            background: "#1E1E2E",
            color: "#F5F5FF",
            border: "1px solid #3A3A5E",
            cursor: "pointer",
          },
        });
        // Reload conversations to update unread badge in side pane
        fetchConversations(true);
      }
    };

    const handleMessagesRead = ({ conversationId }) => {
      // If the active conversation matches, update isRead for all of my sent messages in state
      if (activeUser) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender._id.toString() === currentUser._id.toString() ? { ...m, isRead: true } : m
          )
        );
      }
    };

    const handleUserTyping = ({ senderId }) => {
      if (activeUser && activeUser._id.toString() === senderId.toString()) {
        setIsOtherTyping(true);
      }
    };

    const handleUserStopTyping = ({ senderId }) => {
      if (activeUser && activeUser._id.toString() === senderId.toString()) {
        setIsOtherTyping(false);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("messages_read", handleMessagesRead);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("messages_read", handleMessagesRead);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
    };
  }, [socket, activeUser, currentUser, navigate]);

  // Send message action
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeUser) return;

    const rawText = messageText.trim();
    setMessageText("");

    // Stop typing socket notification
    if (socket) {
      socket.emit("stop_typing", { receiverId: activeUser._id });
      setIsTyping(false);
    }

    // Optimistic message object
    const tempId = Date.now().toString();
    const optimisticMessage = {
      _id: tempId,
      conversationId: [currentUser._id, activeUser._id].sort().join("_"),
      sender: {
        _id: currentUser._id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      receiver: activeUser,
      text: rawText,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { data } = await api.post(`/messages/${activeUser._id}`, { text: rawText });
      if (data.success) {
        // Replace optimistic message with actual backend populated message
        setMessages((prev) =>
          prev.map((msg) => (msg._id === tempId ? data.message : msg))
        );
        fetchConversations(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
    }
  };

  // Keyboard typing handlers
  const handleKeyDown = () => {
    if (!socket || !activeUser) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { receiverId: activeUser._id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { receiverId: activeUser._id });
      setIsTyping(false);
    }, 1500);
  };

  // Filter local conversation list by name/username search
  const filteredConversations = conversations.filter((c) => {
    const q = conversationsSearch.toLowerCase();
    return (
      c.user.name.toLowerCase().includes(q) ||
      c.user.username.toLowerCase().includes(q)
    );
  });

  // Date formatting helpers
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateSeparator = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="w-full h-[calc(100vh-6rem)] min-h-[400px] flex rounded-3xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xl select-none">
      
      {/* ── Left Pane: Conversation List ── */}
      <div
        className={`w-full md:w-80 border-r border-[var(--border)] flex flex-col ${
          routeUsername ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Pane Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">Messages</h2>
          <button
            onClick={() => navigate("/connect")}
            title="Find new people to message"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--surface-2)] transition"
            style={{ color: "var(--primary)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        {/* Conversation List Search */}
        <div className="p-3">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search chats..."
              value={conversationsSearch}
              onChange={(e) => setConversationsSearch(e.target.value)}
              className="input-field w-full text-[11px] rounded-full pl-8 pr-3 py-2 focus:outline-none"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
            />
            <span className="absolute left-2.5 text-[var(--muted)]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
              </svg>
            </span>
          </div>
        </div>

        {/* Conversations Scroll Box */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]/20">
          {loadingConversations ? (
            <div className="flex justify-center py-10">
              <Spinner size="sm" color="var(--primary)" />
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conn) => {
              const isActive = routeUsername && routeUsername.toLowerCase() === conn.user.username.toLowerCase();
              return (
                <div
                  key={conn.user._id}
                  onClick={() => navigate(`/messages/${conn.user.username}`)}
                  className={`flex items-center gap-3 p-3.5 cursor-pointer relative transition ${
                    isActive
                      ? "bg-gradient-to-r from-[#6C63FF]/15 to-[#FF6584]/5"
                      : "hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {/* Left accent line for active chat */}
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#6C63FF] to-[#FF6584]" />
                  )}

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <Avatar
                      user={conn.user}
                      size="sm"
                      showOnlineStatus={isUserOnline(conn.user._id)}
                      showRing={true}
                    />
                  </div>

                  {/* Text previews */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white truncate max-w-[120px]">
                        {conn.user.name}
                      </span>
                      {conn.lastMessage && (
                        <span className="text-[9px] text-[var(--muted-faint)]">
                          {formatTime(conn.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11px] truncate mt-0.5 leading-tight ${
                        conn.unreadCount > 0
                          ? "font-bold text-white"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      {conn.lastMessage ? conn.lastMessage.text : "No messages yet"}
                    </p>
                  </div>

                  {/* Unread badge & online indicators */}
                  {conn.unreadCount > 0 && (
                    <span className="flex-shrink-0 w-4 h-4 bg-primary text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {conn.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 px-4 text-xs font-medium text-[var(--muted)] leading-relaxed">
              No conversations found.
              <br />
              Go to <Link to="/connect" className="text-primary hover:underline font-semibold">Connect</Link> to find friends.
            </div>
          )}
        </div>
      </div>

      {/* ── Right Pane: Chat Window ── */}
      <div
        className={`flex-1 flex flex-col h-full bg-[#0E0E1A]/40 relative ${
          !routeUsername ? "hidden md:flex" : "flex"
        }`}
      >
        {loadingMessages ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner size="md" color="var(--primary)" />
          </div>
        ) : activeUser ? (
          <>
            {/* Chat Window Header */}
            <div
              className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between z-10"
              style={{ background: "var(--glass-bg)", backdropFilter: "blur(12px)" }}
            >
              {/* Back button (Mobile only) */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/messages")}
                  className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--surface-2)] transition text-[var(--muted)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                {/* Avatar & User meta */}
                <div className="flex items-center gap-2.5">
                  <Avatar
                    user={activeUser}
                    size="sm"
                    showOnlineStatus={isUserOnline(activeUser._id)}
                    showRing={true}
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-xs text-white">
                        {activeUser.name}
                      </span>
                      {activeUser.isVerified && (
                        <span className="text-[#6C63FF] text-[10px]">✓</span>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--muted)]">@{activeUser.username}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <Link
                to={`/profile/${activeUser.username}`}
                className="px-3.5 py-1.5 text-[11px] font-bold text-[var(--primary)] border border-primary/20 hover:border-primary/40 rounded-xl hover:bg-primary/5 transition"
              >
                View Profile
              </Link>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length > 0 ? (
                messages.map((msg, index) => {
                  const isMe = msg.sender._id.toString() === currentUser._id.toString();
                  const showSeparator =
                    index === 0 ||
                    formatDateSeparator(msg.createdAt) !==
                      formatDateSeparator(messages[index - 1].createdAt);

                  return (
                    <div key={msg._id} className="flex flex-col">
                      {/* Date Separator */}
                      {showSeparator && (
                        <div className="text-center my-3 text-[10px] uppercase font-bold tracking-widest text-[var(--muted-faint)]">
                          {formatDateSeparator(msg.createdAt)}
                        </div>
                      )}

                      {/* Message Bubble Alignment Wrapper */}
                      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] px-4 py-2.5 shadow-sm relative group`}
                          style={{
                            background: isMe
                              ? "linear-gradient(135deg, #6C63FF, #8B5CF6)"
                              : "var(--surface-2)",
                            color: isMe ? "#FFFFFF" : "var(--text)",
                            border: isMe ? "none" : "1px solid var(--border)",
                            borderRadius: isMe
                              ? "20px 20px 4px 20px"
                              : "20px 20px 20px 4px",
                          }}
                        >
                          {/* Message Text */}
                          <p className="text-[12px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                          {/* Hover Timestamp / Status info */}
                          <div className={`absolute bottom-full mb-1 text-[9px] text-[var(--muted-faint)] opacity-0 group-hover:opacity-100 transition duration-150 whitespace-nowrap ${
                            isMe ? "right-0" : "left-0"
                          }`}>
                            {formatTime(msg.createdAt)}
                            {isMe && ` · ${msg.isRead ? "Read ✓" : "Sent"}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[var(--muted)]">
                  <span className="text-3xl mb-2">👋</span>
                  <p className="font-semibold text-xs text-white">Start the conversation</p>
                  <p className="text-[11px] mt-1">Send a message to start sharing ideas and collaboration.</p>
                </div>
              )}

              {/* Typing indicator */}
              {isOtherTyping && (
                <div className="flex justify-start">
                  <div
                    className="px-4 py-3 rounded-2xl flex items-center gap-1 border border-[var(--border)]"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Sticky Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-[var(--border)] flex items-center gap-3 z-10"
              style={{ background: "var(--surface)" }}
            >
              <input
                type="text"
                placeholder={`Message @${activeUser.username}...`}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="input-field flex-1 text-xs rounded-full px-5 py-3 focus:outline-none"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              />
              <button
                type="submit"
                disabled={!messageText.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center btn-primary disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex-shrink-0 transition"
              >
                <svg className="w-4.5 h-4.5 transform rotate-90" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none">
            <span className="text-4xl mb-4">💬</span>
            <h3 className="text-white font-bold text-sm">Select a Conversation</h3>
            <p className="text-[var(--muted)] text-xs mt-1 max-w-xs leading-relaxed">
              Choose a developer from the sidebar list or click connect on their profile to start chat.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Messages;
