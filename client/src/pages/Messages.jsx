import React, { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import { useLocation } from 'react-router-dom'
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
      alert(err?.response?.data?.message || 'Message failed to send')
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-black text-green-400 font-mono text-[13px] overflow-hidden">

      {/* LEFT — conversation list */}
      <div className="w-[260px] flex-shrink-0 border-r border-green-800 flex flex-col">
        <div className="px-3 py-2 border-b border-green-800 text-green-500">
          &gt; contacts
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="px-3 py-2 text-green-700">loading...</p>
          ) : conversations.length === 0 ? (
            <p className="px-3 py-2 text-green-700">no conversations yet</p>
          ) : (
            conversations.map(c => (
              <div
                key={c.user._id}
                onClick={() => openChat(c.user)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-green-900 hover:bg-green-950 ${
                  active?._id === c.user._id ? 'bg-green-950' : ''
                }`}
              >
                <Avatar src={c.user.avatar} name={c.user.name} size="xs" />
                <div className="truncate">
                  <p className="text-green-300 truncate">{c.user.username}</p>
                  <p className="text-green-700 text-[11px] truncate">{c.lastMessage}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT — chat window */}
      <div className="flex-1 flex flex-col min-w-0">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-green-700">
            &gt; select a contact to start chat_
          </div>
        ) : (
          <>
            {/* header */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-green-800">
              <Avatar src={active.avatar} name={active.name} size="xs" />
              <p className="text-green-300">@{active.username}</p>
            </div>

            {/* messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-1">
              {messages.map(msg => {
                const isMine = msg.sender._id.toString() === user._id.toString()
                return (
                  <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-3 py-1.5 rounded ${
                      isMine
                        ? 'bg-green-900 text-green-200'
                        : 'bg-green-950 text-green-400 border border-green-800'
                    }`}>
                      <span className="text-green-600 mr-1">
                        {isMine ? 'you>' : `${active.username}>`}
                      </span>
                      {msg.text}
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* input */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-green-800">
              <span className="text-green-600">$</span>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="type message..."
                className="flex-1 bg-transparent outline-none text-green-300 placeholder-green-800"
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim()}
                className="text-green-400 border border-green-700 px-3 py-1 rounded hover:bg-green-900 disabled:opacity-30"
              >
                send
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  )
}

export default Messages
