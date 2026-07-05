import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  const typingTimer = useRef(null)
  const myIdRef = useRef('')  // server truth — never use user._id for isMine

  // ── STATE ───────────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [myId, setMyId] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  // ── FETCH CONVERSATIONS ─────────────────────────────────────────────────────
  const fetchConvos = useCallback(async () => {
    try {
      const res = await api.get('/messages')
      setConversations(res?.data?.conversations || [])
    } catch {
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConvos() }, [fetchConvos])

  // ── OPEN CONVERSATION ───────────────────────────────────────────────────────
  const openConvo = async (convo) => {
    setActive(convo)
    setMessages([])
    setIsTyping(false)
    try {
      const res = await api.get(`/messages/${convo.user._id}`)
      // myId from SERVER — this is the ground truth for isMine checks
      const serverMyId = res?.data?.myId || ''
      setMyId(serverMyId)
      myIdRef.current = serverMyId
      setMessages(res?.data?.messages || [])
      // Mark conversation as read in sidebar
      setConversations(prev => prev.map(c =>
        c.user._id === convo.user._id
          ? { ...c, unreadCount: 0 }
          : c
      ))
    } catch {
      setMessages([])
    }
  }

  // ── SEND MESSAGE ────────────────────────────────────────────────────────────
  const sendMsg = async () => {
    if (!text.trim() || !active || sending) return
    setSending(true)
    const msgText = text.trim()
    setText('')

    try {
      const res = await api.post(`/messages/${active.user._id}`, { text: msgText })
      const saved = res?.data?.message
      if (!saved) return
      // Sender adds message ONCE via API response only
      // Socket emits to receiver only — no duplicate here
      setMessages(prev => [...prev, saved])
      fetchConvos()
    } catch (err) {
      setText(msgText) // restore on fail
      toast.error(err?.response?.data?.message || 'Send failed')
    } finally {
      setSending(false)
    }
  }

  // ── TYPING HANDLER ──────────────────────────────────────────────────────────
  const handleTyping = (e) => {
    setText(e.target.value)
    if (!socket || !active) return
    socket.emit('typing', { receiverId: active.user._id })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      socket.emit('stop_typing', { receiverId: active.user._id })
    }, 1000)
  }

  // ── SOCKET LISTENERS ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    // RECEIVER gets new message via socket only
    const onNewMessage = (incoming) => {
      if (!active) { fetchConvos(); return }

      const otherId = active.user._id?.toString()
      const fromId =
        incoming.sender?._id?.toString() ||
        incoming.sender?.toString() || ''

      // Only add if from the active conversation partner
      if (fromId !== otherId) { fetchConvos(); return }

      setMessages(prev => {
        const exists = prev.some(m =>
          m._id?.toString() === incoming._id?.toString()
        )
        if (exists) return prev
        return [...prev, incoming]
      })
      fetchConvos()
    }

    // Typing dots — only from active conversation partner
    const onTyping = ({ senderId }) => {
      if (active && senderId === active.user._id?.toString()) {
        setIsTyping(true)
      }
    }

    const onStopTyping = ({ senderId }) => {
      if (active && senderId === active.user._id?.toString()) {
        setIsTyping(false)
      }
    }

    socket.on('new_message', onNewMessage)
    socket.on('user_typing', onTyping)
    socket.on('user_stop_typing', onStopTyping)

    return () => {
      socket.off('new_message', onNewMessage)
      socket.off('user_typing', onTyping)
      socket.off('user_stop_typing', onStopTyping)
    }
  }, [socket, active])

  // ── AUTO SCROLL ─────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ── IS MINE — uses myIdRef (server truth, never wrong) ──────────────────────
  const checkIsMine = (msg) => {
    const sid =
      msg.sender?._id?.toString() ||
      msg.sender?.toString() || ''
    return sid === myIdRef.current
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">

      {/* ══ LEFT — Conversation List (30%) ══ */}
      <div className="w-[280px] flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-card)] flex flex-col">

        {/* Header */}
        <div className="px-4 py-4 border-b border-[var(--border)]">
          <h2 className="font-bold text-[18px] text-[var(--text-main)]">Messages</h2>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
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
              <p className="text-[var(--text-main)] font-semibold text-[14px]">No conversations</p>
              <p className="text-[var(--text-muted)] text-[12px] mt-1">Connect with people first</p>
              <button
                onClick={() => navigate('/connect')}
                className="mt-3 px-4 py-2 rounded-xl text-[12px] font-medium text-white bg-gradient-to-r from-[#6C63FF] to-[#FF6584]"
              >
                Find People
              </button>
            </div>
          ) : (
            conversations.map(convo => (
              <div
                key={convo.user._id}
                onClick={() => openConvo(convo)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-l-[3px] transition
                  ${active?.user._id === convo.user._id
                    ? 'bg-[#6C63FF11] border-[#6C63FF]'
                    : 'border-transparent hover:bg-[var(--bg-hover)]'
                  }`}
              >
                <Avatar
                  src={convo.user.avatar}
                  name={convo.user.name}
                  size="md"
                  showOnlineStatus={true}
                  userId={convo.user._id}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className={`text-[14px] truncate text-[var(--text-main)] ${convo.unreadCount > 0 ? 'font-bold' : 'font-medium'}`}>
                      {convo.user.name}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] flex-shrink-0 ml-1">
                      {convo.lastMessage ? formatDate(convo.lastMessage.createdAt) : ''}
                    </p>
                  </div>
                  <p className={`text-[12px] truncate ${convo.unreadCount > 0 ? 'text-[var(--text-main)] font-medium' : 'text-[var(--text-muted)]'}`}>
                    {convo.lastMessage
                      ? convo.lastMessage.sender?._id?.toString() === user?._id?.toString()
                        ? `You: ${convo.lastMessage.text}`
                        : convo.lastMessage.text
                      : 'No messages yet'
                    }
                  </p>
                </div>
                {convo.unreadCount > 0 && (
                  <span className="bg-[#6C63FF] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {convo.unreadCount}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ══ RIGHT — Chat Window (70%) ══ */}
      <div className="flex-1 flex flex-col bg-[var(--bg-main)] min-w-0">

        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <p className="text-5xl">💬</p>
            <p className="font-semibold text-[18px] text-[var(--text-main)]">Your Messages</p>
            <p className="text-[var(--text-muted)] text-[14px] text-center max-w-xs">
              Select a conversation to start
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex-shrink-0 flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
              <Avatar
                src={active.user.avatar}
                name={active.user.name}
                size="md"
                showOnlineStatus={true}
                userId={active.user._id}
              />
              <div className="flex-1">
                <p className="font-bold text-[15px] text-[var(--text-main)]">{active.user.name}</p>
                <p className="text-[12px] text-[var(--text-muted)]">@{active.user.username}</p>
              </div>
              <button
                onClick={() => navigate(`/profile/${active.user.username}`)}
                className="text-[12px] font-medium text-[#6C63FF] border border-[#6C63FF44] px-4 py-1.5 rounded-full hover:bg-[#6C63FF11] transition"
              >
                View Profile →
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
              {messages
                .filter(m => m.text?.trim() !== '')
                .map((msg, i) => {
                  const isMine = checkIsMine(msg)
                  return (
                    <div
                      key={msg._id || i}
                      className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* MY message → MY avatar | THEIR message → THEIR populated avatar */}
                      <Avatar
                        src={isMine ? user?.avatar : msg.sender?.avatar || ''}
                        name={isMine ? user?.name : msg.sender?.name || 'User'}
                        size="xs"
                      />
                      {/* Bubble */}
                      <div className={`max-w-[60%] px-4 py-2.5 rounded-2xl text-[14px]
                        ${isMine
                          ? 'bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] text-white rounded-br-none'
                          : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-main)] rounded-bl-none'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60 text-right' : 'text-[var(--text-muted)]'}`}>
                          {formatDate(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              }

              {/* Typing dots — shows only when OTHER person is typing */}
              {isTyping && (
                <div className="flex items-end gap-2 flex-row">
                  <Avatar src={active.user.avatar} name={active.user.name} size="xs" />
                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl rounded-bl-none px-4 py-3 flex gap-1.5 items-center">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input Bar */}
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-card)]">
              <input
                value={text}
                onChange={handleTyping}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMsg()
                  }
                }}
                placeholder={`Message ${active.user.name}...`}
                className="flex-1 min-w-0 bg-[var(--bg-input)] border border-[var(--border)] rounded-full px-5 py-3 text-[var(--text-main)] text-[14px] focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF22] outline-none transition"
              />
              <button
                onClick={sendMsg}
                disabled={!text.trim() || sending}
                className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#6C63FF] to-[#FF6584] text-white text-xl flex items-center justify-center shadow-[0_0_20px_#6C63FF55] hover:scale-105 hover:shadow-[0_0_28px_#6C63FF88] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
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
