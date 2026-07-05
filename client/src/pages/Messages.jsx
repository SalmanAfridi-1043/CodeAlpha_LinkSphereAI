import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'
import useSocket from '../hooks/useSocket'
import Avatar from '../components/Avatar'
import Spinner from '../components/Spinner'
import formatDate from '../utils/formatDate'
import toast from 'react-hot-toast'

const Messages = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const bottomRef = useRef(null)

  const [conversations, setConversations] = useState([])
  const [activeConvo, setActiveConvo] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimer = useRef(null)

  // Fetch conversation list on mount
  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages')
      setConversations(res?.data?.conversations || [])
    } catch {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  // Open a conversation
  const openConversation = async (convo) => {
    setActiveConvo(convo)
    try {
      const res = await api.get(
        `/messages/${convo.user._id}`
      )
      setMessages(res?.data?.messages || [])
      // Mark as read
      setConversations(prev => prev.map(c =>
        c.user._id === convo.user._id
          ? { ...c, unreadCount: 0 }
          : c
      ))
    } catch {
      setMessages([])
    }
  }

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth'
    })
  }, [messages])

  // Socket listeners
  useEffect(() => {
    if (!socket) return

    socket.on('new_message', (msg) => {
      // If message is for active conversation
      if (
        activeConvo &&
        (msg.sender._id === activeConvo.user._id ||
         msg.receiver._id === activeConvo.user._id)
      ) {
        setMessages(prev => [...prev, msg])
      }
      // Update conversation list
      fetchConversations()
    })

    socket.on('user_typing', ({ senderId }) => {
      if (activeConvo?.user._id === senderId) {
        setIsTyping(true)
      }
    })

    socket.on('user_stop_typing', ({ senderId }) => {
      if (activeConvo?.user._id === senderId) {
        setIsTyping(false)
      }
    })

    return () => {
      socket.off('new_message')
      socket.off('user_typing')
      socket.off('user_stop_typing')
    }
  }, [socket, activeConvo])

  // Send message
  const sendMessage = async () => {
    if (!newMsg.trim() || !activeConvo) return
    setSending(true)

    // Optimistic update
    const optimistic = {
      _id: Date.now().toString(),
      sender: { _id: user._id },
      receiver: { _id: activeConvo.user._id },
      text: newMsg,
      createdAt: new Date(),
      isOptimistic: true
    }
    setMessages(prev => [...prev, optimistic])
    const msgText = newMsg
    setNewMsg('')

    try {
      const res = await api.post(
        `/messages/${activeConvo.user._id}`,
        { text: msgText }
      )
      // Replace optimistic with real
      setMessages(prev => prev.map(m =>
        m._id === optimistic._id
          ? res.data.message
          : m
      ))
      fetchConversations()
    } catch (err) {
      // Revert on fail
      setMessages(prev =>
        prev.filter(m => m._id !== optimistic._id)
      )
      toast.error(err?.response?.data?.message
        || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  // Typing events
  const handleTyping = (e) => {
    setNewMsg(e.target.value)
    if (!socket || !activeConvo) return
    socket.emit('typing', {
      receiverId: activeConvo.user._id
    })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      socket.emit('stop_typing', {
        receiverId: activeConvo.user._id
      })
    }, 1000)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]
      bg-[var(--bg-main)] overflow-hidden">

      {/* ═══ LEFT — Chat List (30% width) ═══ */}
      <div className="w-[300px] flex-shrink-0
        border-r border-[var(--border)]
        bg-[var(--bg-card)]
        flex flex-col">

        {/* Header */}
        <div className="px-4 py-4
          border-b border-[var(--border)]">
          <h2 className="text-[var(--text-main)]
            font-bold text-[18px]">
            Messages
          </h2>
          <p className="text-[var(--text-muted)]
            text-[12px] mt-0.5">
            {conversations.length} conversation
            {conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-[var(--text-main)]
                font-semibold text-[14px]">
                No conversations yet
              </p>
              <p className="text-[var(--text-muted)]
                text-[12px] mt-1">
                Connect with people first to message them
              </p>
              <button
                onClick={() => navigate('/connect')}
                className="mt-3 px-4 py-2 rounded-xl
                  text-[12px] font-medium
                  bg-gradient-to-r from-[#6C63FF]
                  to-[#FF6584] text-white">
                Find People
              </button>
            </div>
          ) : (
            conversations.map(convo => (
              <div
                key={convo.user._id}
                onClick={() => openConversation(convo)}
                className={`flex items-center gap-3
                  px-4 py-3 cursor-pointer transition
                  border-l-[3px]
                  ${activeConvo?.user._id ===
                    convo.user._id
                    ? 'bg-[#6C63FF11] border-[#6C63FF]'
                    : 'border-transparent hover:bg-[var(--bg-hover)]'
                  }`}>

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar
                    user={convo.user}
                    src={convo.user.avatar}
                    name={convo.user.name}
                    size="md"
                    userId={convo.user._id}
                    showOnlineStatus={true}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center
                    justify-between">
                    <p className={`text-[14px] truncate
                      ${convo.unreadCount > 0
                        ? 'font-bold text-[var(--text-main)]'
                        : 'font-medium text-[var(--text-main)]'
                      }`}>
                      {convo.user.name}
                    </p>
                    {convo.lastMessage && (
                      <p className="text-[10px]
                        text-[var(--text-muted)]
                        flex-shrink-0 ml-1">
                        {formatDate(
                          convo.lastMessage.createdAt
                        )}
                      </p>
                    )}
                  </div>
                  <p className={`text-[12px] truncate
                    ${convo.unreadCount > 0
                      ? 'text-[var(--text-main)] font-medium'
                      : 'text-[var(--text-muted)]'
                    }`}>
                    {convo.lastMessage
                      ? convo.lastMessage.sender?.toString()
                          === user._id?.toString()
                        ? `You: ${convo.lastMessage.text}`
                        : convo.lastMessage.text
                      : 'No messages yet'
                    }
                  </p>
                </div>

                {/* Unread badge */}
                {convo.unreadCount > 0 && (
                  <span className="flex-shrink-0
                    bg-[#6C63FF] text-white text-[10px]
                    font-bold rounded-full w-5 h-5
                    flex items-center justify-center">
                    {convo.unreadCount}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═══ RIGHT — Chat Window (70% width) ═══ */}
      <div className="flex-1 flex flex-col
        bg-[var(--bg-main)] min-w-0">

        {!activeConvo ? (
          /* Empty state */
          <div className="flex-1 flex flex-col
            items-center justify-center gap-3">
            <p className="text-5xl">💬</p>
            <p className="text-[var(--text-main)]
              font-semibold text-[18px]">
              Your Messages
            </p>
            <p className="text-[var(--text-muted)]
              text-[14px] text-center max-w-xs">
              Select a conversation from the left
              to start chatting
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3
              px-5 py-3.5
              border-b border-[var(--border)]
              bg-[var(--bg-card)]">
              <Avatar
                user={activeConvo.user}
                src={activeConvo.user.avatar}
                name={activeConvo.user.name}
                size="md"
                userId={activeConvo.user._id}
                showOnlineStatus={true}
              />
              <div>
                <p className="text-[var(--text-main)]
                  font-semibold text-[15px]">
                  {activeConvo.user.name}
                </p>
                <p className="text-[var(--text-muted)]
                  text-[12px]">
                  @{activeConvo.user.username}
                </p>
              </div>
              <button
                onClick={() => navigate(
                  `/profile/${activeConvo.user.username}`
                )}
                className="ml-auto text-[12px]
                  text-[#6C63FF] hover:underline">
                View Profile →
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto
              px-5 py-4 flex flex-col gap-2">
              {messages.map((msg, i) => {
                const isMine = (() => {
                  // Handle both: populated object OR raw ObjectId
                  const sid =
                    typeof msg.sender === 'object'
                      ? msg.sender?._id?.toString()
                      : msg.sender?.toString()
                  return sid === user?._id?.toString()
                })()

                return (
                  <div
                    key={msg._id || i}
                    className={`flex items-end gap-2 mb-1
                      ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <Avatar
                      user={isMine ? user : activeConvo?.user}
                      src={isMine
                        ? user?.avatar
                        : activeConvo?.user?.avatar}
                      name={isMine
                        ? user?.name
                        : activeConvo?.user?.name}
                      size="xs"
                    />

                    {/* Bubble */}
                    <div className={`
                      max-w-[60%] px-4 py-2.5 rounded-2xl
                      text-[14px] leading-relaxed
                      ${isMine
                        ? `bg-gradient-to-br from-[#6C63FF]
                           to-[#8B5CF6] text-white
                           rounded-br-none`
                        : `bg-[var(--bg-card)]
                           text-[var(--text-main)]
                           border border-[var(--border)]
                           rounded-bl-none`
                      }`}>
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1
                        ${isMine
                          ? 'text-white/60 text-right'
                          : 'text-[var(--text-muted)]'}`}>
                        {formatDate(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2">
                  <Avatar
                    user={activeConvo.user}
                    src={activeConvo.user.avatar}
                    name={activeConvo.user.name}
                    size="xs"
                  />
                  <div className="bg-[var(--bg-card)]
                    border border-[var(--border)]
                    rounded-2xl rounded-bl-sm
                    px-4 py-2.5 flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i}
                        className="w-2 h-2 rounded-full
                          bg-[var(--text-muted)]
                          animate-bounce"
                        style={{
                          animationDelay: `${i*0.15}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input Bar */}
            <div className="px-5 py-3
              border-t border-[var(--border)]
              bg-[var(--bg-card)]
              flex items-center gap-3">
              <input
                value={newMsg}
                onChange={handleTyping}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder={`Message ${activeConvo.user.name}...`}
                className="flex-1 bg-[var(--bg-input)]
                  border border-[var(--border)]
                  rounded-full px-5 py-2.5
                  text-[var(--text-main)] text-[14px]
                  focus:border-[#6C63FF]
                  focus:ring-2 focus:ring-[#6C63FF22]
                  outline-none transition"
              />
              <button
                onClick={sendMessage}
                disabled={!newMsg.trim() || sending}
                className="w-10 h-10 rounded-full
                  bg-gradient-to-br from-[#6C63FF]
                  to-[#FF6584] text-white
                  flex items-center justify-center
                  hover:shadow-[0_0_16px_#6C63FF55]
                  disabled:opacity-40 transition
                  flex-shrink-0">
                ➤
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Messages
