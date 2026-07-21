import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'
import useSocket from '../hooks/useSocket'
import Avatar from '../components/Avatar'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'

const Connect = () => {
  const { user } = useAuth()
  const { newConnectionRequest,
    setNewConnectionRequest,
    setPendingConnectionCount } = useSocket()
  const navigate = useNavigate()

  // Tabs: find | pending | connections
  const [tab, setTab] = useState('find')

  // Find People
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  // Pending
  const [pending, setPending] = useState([])
  const [loadingPending, setLoadingPending]
    = useState(false)

  // Connections
  const [connections, setConnections] = useState([])
  const [loadingConns, setLoadingConns]
    = useState(false)

  // ── SEARCH ───────────────────────────
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([])
        return
      }
      setSearching(true)
      try {
        const res = await api.get(
          `/connections/find?q=${encodeURIComponent(query)}`
        )
        setResults(res?.data?.users || [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  // ── FETCH PENDING ─────────────────────
  const fetchPending = useCallback(async () => {
    setLoadingPending(true)
    try {
      const res = await api.get(
        '/connections/pending'
      )
      setPending(res?.data?.requests || [])
      setPendingConnectionCount(res?.data?.count || 0)
    } catch {
      setPending([])
    } finally {
      setLoadingPending(false)
    }
  }, [setPendingConnectionCount])

  // ── FETCH CONNECTIONS ─────────────────
  const fetchConnections = useCallback(
    async () => {
    setLoadingConns(true)
    try {
      const res = await api.get('/connections')
      setConnections(
        res?.data?.connections || []
      )
    } catch {
      setConnections([])
    } finally {
      setLoadingConns(false)
    }
  }, [])

  // Fetch on tab change
  useEffect(() => {
    if (tab === 'pending') fetchPending()
    if (tab === 'connections') fetchConnections()
  }, [tab, fetchPending, fetchConnections])

  // Refresh pending when socket fires
  useEffect(() => {
    if (newConnectionRequest) {
      fetchPending()
      setNewConnectionRequest(false)
    }
  }, [newConnectionRequest, fetchPending, setNewConnectionRequest])

  // Fetch pending on mount
  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  // ── SEND REQUEST ──────────────────────
  const sendRequest = async (userId) => {
    try {
      await api.post(
        `/connections/request/${userId}`
      )
      toast.success('Request sent! 🤝')
      // Update result status locally
      setResults(prev => prev.map(u =>
        u._id === userId
          ? { ...u, isPending: true }
          : u
      ))
    } catch (err) {
      toast.error(
        err?.response?.data?.message
        || 'Failed to send request'
      )
    }
  }

  // ── RESPOND TO REQUEST ────────────────
  const respond = async (connId, action) => {
    try {
      await api.put(
        `/connections/respond/${connId}`,
        { action }
      )
      toast.success(
        action === 'accept'
          ? '🎉 Connected!'
          : 'Request declined'
      )
      fetchPending()
      fetchConnections()
      setPendingConnectionCount(prev =>
        Math.max(0, prev - 1)
      )
    } catch {
      toast.error('Action failed')
    }
  }

  // ── TABS UI ───────────────────────────
  const tabs = [
    { id: 'find',        label: '🔍 Find People' },
    { id: 'pending',     label: `⏳ Pending` },
    { id: 'connections', label: '🤝 Connections' }
  ]

  return (
    <div className="max-w-[620px] mx-auto
      px-4 py-6">

      {/* Page Title */}
      <h1 className="text-[22px] font-bold
        text-[var(--text-main)] mb-1">
        Connect
      </h1>
      <p className="text-[var(--text-muted)]
        text-[13px] mb-5">
        Find and connect with people on
        LinkSphereAI
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[12px] sm:text-[13px] font-medium transition
              ${tab === t.id
                ? 'bg-gradient-to-r from-[#6C63FF] to-[#FF6584] text-white'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[#6C63FF]'
              }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── FIND PEOPLE TAB ── */}
      {tab === 'find' && (
        <div>
          {/* Search Input */}
          <div className="relative mb-4">
            <span className="absolute left-4
              top-1/2 -translate-y-1/2
              text-[var(--text-muted)]">
              🔍
            </span>
            <input
              value={query}
              onChange={e =>
                setQuery(e.target.value)}
              placeholder="Search by name or @username..."
              className="w-full bg-[var(--bg-card)]
                border border-[var(--border)]
                rounded-2xl pl-10 pr-4 py-3
                text-[var(--text-main)] text-[14px]
                focus:border-[#6C63FF]
                focus:ring-2 focus:ring-[#6C63FF22]
                outline-none transition"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('')
                  setResults([])
                }}
                className="absolute right-4
                  top-1/2 -translate-y-1/2
                  text-[var(--text-muted)]
                  hover:text-[var(--text-main)]">
                ✕
              </button>
            )}
          </div>

          {/* Results */}
          {searching ? (
            <div className="flex justify-center
              py-8">
              <Spinner size="md" />
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col gap-2">
              {results.map(u => (
                <div key={u._id}
                  className="flex items-center
                    justify-between p-3
                    bg-[var(--bg-card)]
                    border border-[var(--border)]
                    rounded-2xl hover:border-[#6C63FF44]
                    transition">

                  {/* User info */}
                  <div
                    className="flex items-center
                      gap-3 cursor-pointer flex-1
                      min-w-0"
                    onClick={() => navigate(
                      `/profile/${u.username}`
                    )}>
                    <Avatar
                      user={u}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="text-[var(--text-main)]
                        font-semibold text-[14px]
                        truncate">
                        {u.name}
                      </p>
                      <p className="text-[var(--text-muted)]
                        text-[12px]">
                        @{u.username}
                      </p>
                    </div>
                  </div>

                  {/* Action button */}
                  {u.isConnected ? (
                    <span className="px-4 py-1.5
                      rounded-full text-[12px]
                      font-medium border
                      border-[var(--border)]
                      text-[var(--text-muted)]">
                      Connected ✓
                    </span>
                  ) : u.isPending ? (
                    <span className="px-4 py-1.5
                      rounded-full text-[12px]
                      font-medium border
                      border-[var(--border)]
                      text-[var(--text-muted)]">
                      Requested ✓
                    </span>
                  ) : (
                    <button
                      onClick={() =>
                        sendRequest(u._id)}
                      className="px-4 py-1.5
                        rounded-full text-[12px]
                        font-medium text-white
                        bg-gradient-to-r
                        from-[#6C63FF] to-[#FF6584]
                        hover:shadow-[0_0_12px_#6C63FF44]
                        transition">
                      Connect +
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : query.length > 0 && !searching ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-[var(--text-main)]
                font-semibold">
                No results for "{query}"
              </p>
              <p className="text-[var(--text-muted)]
                text-[13px] mt-1">
                Try a different name or username
              </p>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-[var(--text-muted)]
                text-[13px]">
                Search for people by their
                name or @username
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── PENDING TAB ── */}
      {tab === 'pending' && (
        <div>
          {loadingPending ? (
            <div className="flex justify-center
              py-8">
              <Spinner size="md" />
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-[var(--text-main)]
                font-semibold">
                No pending requests
              </p>
              <p className="text-[var(--text-muted)]
                text-[13px] mt-1">
                Connection requests will
                appear here
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {pending.map(req => (
                <div key={req._id}
                  className="flex items-center
                    justify-between p-3
                    bg-[var(--bg-card)]
                    border border-[var(--border)]
                    rounded-2xl">

                  <div
                    className="flex items-center
                      gap-3 cursor-pointer flex-1"
                    onClick={() => navigate(
                      `/profile/${req.sender?.username}`
                    )}>
                    <Avatar
                      user={req.sender}
                      size="md"
                    />
                    <div>
                      <p className="text-[var(--text-main)]
                        font-semibold text-[14px]">
                        {req.sender?.name}
                      </p>
                      <p className="text-[var(--text-muted)]
                        text-[12px]">
                        @{req.sender?.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        respond(req._id, 'accept')}
                      className="px-4 py-1.5
                        rounded-full text-[12px]
                        font-semibold text-white
                        bg-gradient-to-r
                        from-[#6C63FF] to-[#FF6584]">
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        respond(req._id, 'reject')}
                      className="px-4 py-1.5
                        rounded-full text-[12px]
                        font-semibold border
                        border-[var(--border)]
                        text-[var(--text-muted)]
                        hover:border-red-400
                        hover:text-red-400
                        transition">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CONNECTIONS TAB ── */}
      {tab === 'connections' && (
        <div>
          {loadingConns ? (
            <div className="flex justify-center
              py-8">
              <Spinner size="md" />
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">🤝</p>
              <p className="text-[var(--text-main)]
                font-semibold">
                No connections yet
              </p>
              <button
                onClick={() => setTab('find')}
                className="mt-3 px-5 py-2
                  rounded-xl text-[13px]
                  font-medium text-white
                  bg-gradient-to-r
                  from-[#6C63FF] to-[#FF6584]">
                Find People
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {connections.map(person => (
                <div
                  key={person._id}
                  onClick={() => navigate(
                    `/profile/${person.username}`
                  )}
                  className="flex items-center
                    gap-3 p-3 bg-[var(--bg-card)]
                    border border-[var(--border)]
                    rounded-2xl cursor-pointer
                    hover:border-[#6C63FF44]
                    transition">
                  <Avatar
                    user={person}
                    size="md"
                  />
                  <div>
                    <p className="text-[var(--text-main)]
                      font-semibold text-[14px]">
                      {person.name}
                    </p>
                    <p className="text-[var(--text-muted)]
                      text-[12px]">
                      @{person.username}
                    </p>
                  </div>
                  <span className="ml-auto
                    text-[12px] text-[#6C63FF]
                    border border-[#6C63FF44]
                    px-3 py-1 rounded-full">
                    View Profile →
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Connect
