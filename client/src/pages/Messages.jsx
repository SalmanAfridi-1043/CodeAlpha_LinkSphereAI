import React, { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useSocket } from '../context/SocketContext'
import Avatar from '../components/Avatar'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

const Messages = () => {
  const { user } = useContext(AuthContext)
  const { socket } = useSocket()
  const location = useLocation()
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const activeRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  // Load conversation list
  useEffect(() => {
    api.get('/messages/conversations')
      .then(res => setConversations(res?.data?.conversations || []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false))
  }, [])

  // Auto-open chat when navigated from Profile page
  useEffect(() => {
    const incomingUser = location.state?.openUser
    if (incomingUser) {
      openChat(incomingUser)
    }
  }, [location.state])

  // Open a conversation
  const openChat = async (convoUser) => {
    setActive(convoUser)
    activeRef.current = convoUser
    setMessages([])
    try {
      const res = await api.get(`/messages/${convoUser._id}`)
      setMessages(res?.data?.messages || [])
    } catch {
      setMessages([])
    }
  }

  // Socket — receive messages
  useEffect(() => {
    if (!socket) return
    const handler = (msg) => {
      const otherId = msg.sender._id.toString()
      if (activeRef.current && otherId === activeRef.current._id.toString()) {
        setMessages(prev => [...prev, msg])
      }
      // refresh sidebar list
      api.get('/messages/conversations')
        .then(res => setConversations(res?.data?.conversations || []))
        .catch(() => {})
    }
    socket.on('new_message', handler)
    return () => socket.off('new_message', handler)
  }, [socket])

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message
  const sendMessage = async () => {
    if (!text.trim() || !active) return
    const body = text.trim()
    setText('')
    try {
      const res = await api.post(`/messages/${active._id}`, { text: body })
      setMessages(prev => [...prev, res.data.message])
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Message failed to send')
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[var(--bg-main)] overflow-hidden">

      {/* LEFT — conversation list */}
      <div className="w-[300px] flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-card)] flex flex-col">
        <div className="px-4 py-4 border-b border-[var(--border)]">
          <h2 className="text-[var(--text-main)] font-bold text-[16px]">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-[var(--text-muted)] text-[13px]">No conversations yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-2">
              {conversations.map(c => (
                <div
                  key={c.user._id}
                  onClick={() => openChat(c.user)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition border ${
                    active?._id === c.user._id
                      ? 'bg-gradient-to-r from-[#6C63FF22] to-[#8B5CF622] border-[#6C63FF44]'
                      : 'border-transparent hover:bg-[var(--bg-main)]'
                  }`}
                >
                  <Avatar src={c.user.avatar} name={c.user.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-main)] font-semibold text-[13.5px] truncate">
                      {c.user.name || c.user.username}
                    </p>
                    <p className="text-[var(--text-muted)] text-[12px] truncate">{c.lastMessage}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — chat window */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-main)]">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <p className="text-4xl">💬</p>
            <p className="text-[var(--text-muted)] text-[14px]">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* header */}
            <div className="flex-shrink-0 flex items-center gap-3 px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
              <Avatar src={active.avatar} name={active.name} size="md" />
              <div>
                <p className="text-[var(--text-main)] font-bold text-[15px]">{active.name || active.username}</p>
                <p className="text-[var(--text-muted)] text-[12px]">@{active.username}</p>
              </div>
            </div>

            {/* messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
              {messages.map(msg => {
                const isMine = msg.sender._id.toString() === user._id.toString()
                return (
                  <div
                    key={msg._id}
                    className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar
                      src={isMine ? user?.avatar : active.avatar}
                      name={isMine ? user?.name : active.name}
                      size="xs"
                    />
                    <div className={`max-w-[65%] px-4 py-2.5 rounded-2xl text-[14px] ${
                      isMine
                        ? 'bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] text-white rounded-br-none'
                        : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-main)] rounded-bl-none'
                    }`}>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* input bar */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-card)] flex items-center gap-3">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={`Message ${active.name || active.username}...`}
                className="flex-1 bg-[var(--bg-main)] border border-[var(--border)] rounded-full px-5 py-3 text-[var(--text-main)] text-[14px] focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF22] outline-none transition min-w-0"
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim()}
                className="flex-shrink-0 w-12 h-12 rounded-full text-white text-xl bg-gradient-to-br from-[#6C63FF] to-[#FF6584] shadow-[0_0_20px_#6C63FF55] flex items-center justify-center hover:shadow-[0_0_28px_#6C63FF88] hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
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
