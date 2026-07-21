import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Avatar from '../components/Avatar'
import PostCard from '../components/PostCard'
import Spinner from '../components/Spinner'
import usePageTitle from '../hooks/usePageTitle'

const Explore = () => {
  usePageTitle('Explore')
  const navigate = useNavigate()

  // Search
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('people') // people | posts
  const [peopleResults, setPeopleResults] = useState([])
  const [postResults, setPostResults] = useState([])
  const [searching, setSearching] = useState(false)

  // Default content
  const [suggestions, setSuggestions] = useState([])
  const [explorePosts, setExplorePosts] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(true)

  const debounceRef = useRef(null)

  // ── LOAD DEFAULT CONTENT ──────────────
  useEffect(() => {
    // Suggested people
    api.get('/users/suggestions')
      .then(res => {
        setSuggestions(
          res?.data?.users || []
        )
      })
      .catch(() => setSuggestions([]))
      .finally(() =>
        setLoadingSuggestions(false))

    // Explore posts
    api.get('/posts/explore?limit=12')
      .then(res => {
        setExplorePosts(
          res?.data?.posts || []
        )
      })
      .catch(() => setExplorePosts([]))
      .finally(() => setLoadingPosts(false))
  }, [])

  // ── SEARCH WITH DEBOUNCE ──────────────
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setPeopleResults([])
      setPostResults([])
      return
    }
    debounceRef.current = setTimeout(
      async () => {
        setSearching(true)
        try {
          if (searchType === 'people') {
            const res = await api.get(
              `/users/search?q=${encodeURIComponent(query)}`
            )
            setPeopleResults(
              res?.data?.users || []
            )
          } else {
            const res = await api.get(
              `/posts/search?q=${encodeURIComponent(query)}`
            )
            setPostResults(
              res?.data?.posts || []
            )
          }
        } catch {
          setPeopleResults([])
          setPostResults([])
        } finally {
          setSearching(false)
        }
      }, 300)

    return () =>
      clearTimeout(debounceRef.current)
  }, [query, searchType])

  const isSearching = query.trim().length > 0

  return (
    <div className="max-w-[620px] mx-auto
      px-4 py-6">

      {/* ── SEARCH BAR ── */}
      <div className="relative mb-4">
        <span className="absolute left-4
          top-1/2 -translate-y-1/2
          text-[var(--text-muted)] text-lg">
          🔍
        </span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search people or posts..."
          className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl pl-10 pr-10 py-3 text-[14px] sm:text-[15px] focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF22] outline-none transition"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setPeopleResults([])
              setPostResults([])
            }}
            className="absolute right-4
              top-1/2 -translate-y-1/2
              text-[var(--text-muted)]
              hover:text-[var(--text-main)]
              text-lg transition">
            ✕
          </button>
        )}
      </div>

      {/* ── SEARCH TYPE PILLS ── */}
      {isSearching && (
        <div className="flex gap-2 mb-4">
          {['people', 'posts'].map(type => (
            <button
              key={type}
              onClick={() => setSearchType(type)}
              className={`px-4 py-1.5 rounded-full
                text-[13px] font-medium capitalize
                transition
                ${searchType === type
                  ? 'bg-gradient-to-r from-[#6C63FF] to-[#FF6584] text-white'
                  : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)]'
                }`}>
              {type === 'people' ? '👥 People' : '📝 Posts'}
            </button>
          ))}
        </div>
      )}

      {/* ── SEARCH RESULTS ── */}
      {isSearching ? (
        <div>
          {searching ? (
            <div className="flex justify-center
              py-8">
              <Spinner size="md" />
            </div>
          ) : searchType === 'people' ? (
            peopleResults.length > 0 ? (
              <div className="flex flex-col gap-2">
                {peopleResults.map(u => (
                  <div
                    key={u._id}
                    onClick={() => navigate(
                      `/profile/${u.username}`
                    )}
                    className="flex items-center
                      gap-3 p-3
                      bg-[var(--bg-card)]
                      border border-[var(--border)]
                      rounded-2xl cursor-pointer
                      hover:border-[#6C63FF44]
                      transition">
                    <Avatar
                      user={u}
                      size="md"
                    />
                    <div>
                      <p className="text-[var(--text-main)]
                        font-semibold text-[14px]">
                        {u.name}
                      </p>
                      <p className="text-[var(--text-muted)]
                        text-[12px]">
                        @{u.username}
                      </p>
                      {u.bio && (
                        <p className="text-[var(--text-muted)]
                          text-[11px] mt-0.5
                          truncate max-w-[300px]">
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">
                  👥
                </p>
                <p className="text-[var(--text-main)]
                  font-semibold">
                  No people found
                </p>
                <p className="text-[var(--text-muted)]
                  text-[13px] mt-1">
                  Try a different name
                  or @username
                </p>
              </div>
            )
          ) : (
            postResults.length > 0 ? (
              <div className="flex flex-col gap-3">
                {postResults.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">
                  📝
                </p>
                <p className="text-[var(--text-main)]
                  font-semibold">
                  No posts found
                </p>
                <p className="text-[var(--text-muted)]
                  text-[13px] mt-1">
                  Try a different keyword
                </p>
              </div>
            )
          )}
        </div>

      ) : (
        /* ── DEFAULT VIEW ── */
        <div>

          {/* Suggested People */}
          <div className="mb-6">
            <h2 className="text-[var(--text-main)]
              font-bold text-[16px] mb-3">
              👥 Suggested for You
            </h2>
            {loadingSuggestions ? (
              <div className="flex justify-center
                py-4">
                <Spinner size="sm" />
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-[var(--text-muted)]
                text-[13px] text-center py-4">
                No suggestions yet —
                follow more people
              </p>
            ) : (
              <div className="flex gap-3
                overflow-x-auto pb-2
                scrollbar-hide">
                {suggestions.map(u => (
                  <div
                    key={u._id}
                    onClick={() => navigate(
                      `/profile/${u.username}`
                    )}
                    className="flex-shrink-0 flex flex-col items-center gap-2 p-3 sm:p-4 w-[110px] sm:w-[130px] bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl cursor-pointer hover:border-[#6C63FF44] hover:shadow-[0_0_16px_#6C63FF11] transition"
                  >
                    <Avatar
                      user={u}
                      size="lg"
                      showRing={true}
                    />
                    <p className="text-[var(--text-main)]
                      text-[12px] font-semibold
                      truncate w-full text-center">
                      {u.name}
                    </p>
                    <p className="text-[var(--text-muted)]
                      text-[11px] truncate
                      w-full text-center">
                      @{u.username}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trending Posts Grid */}
          <div>
            <h2 className="text-[var(--text-main)]
              font-bold text-[16px] mb-3">
              🔥 Trending Posts
            </h2>
            {loadingPosts ? (
              <div className="flex justify-center
                py-4">
                <Spinner size="sm" />
              </div>
            ) : explorePosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">
                  🔭
                </p>
                <p className="text-[var(--text-muted)]
                  text-[13px]">
                  Nothing to explore yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {explorePosts.map(post => (
                  <div
                    key={post._id}
                    onClick={() => navigate('/')}
                    className="relative
                      aspect-square overflow-hidden
                      rounded-xl cursor-pointer
                      group">
                    {post.image ? (
                      <img
                        src={post.image}
                        alt="post"
                        className="w-full h-full
                          object-cover
                          group-hover:scale-105
                          transition duration-300"
                      />
                    ) : (
                      <div className="w-full
                        h-full bg-gradient-to-br
                        from-[#6C63FF22]
                        to-[#FF658422]
                        flex items-center
                        justify-center p-3">
                        <p className="text-[var(--text-main)]
                          text-[12px] line-clamp-4
                          text-center">
                          {post.content}
                        </p>
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute
                      inset-0 bg-black/50
                      opacity-0
                      group-hover:opacity-100
                      transition flex items-center
                      justify-center gap-3">
                      <span className="text-white
                        text-[13px] font-medium">
                        ❤️ {post.likesCount || 0}
                      </span>
                      <span className="text-white
                        text-[13px] font-medium">
                        💬 {post.commentsCount || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Explore
