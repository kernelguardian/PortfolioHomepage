'use client'

import { useState, useEffect, useCallback } from 'react'

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ago`
}

function extractSender(payload) {
  // Try to extract sender ID from common SMS formats like "SWIGGY-S", "HDFCBK-S" etc.
  const match = payload.match(/^([A-Z0-9]+-[A-Z])\s/i)
  if (match) return match[1]
  return null
}

function MessageBubble({ message }) {
  const sender = extractSender(message.payload)
  const displayText = sender
    ? message.payload.slice(sender.length + 1)
    : message.payload

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-700">
        <svg
          className="h-5 w-5 text-zinc-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-white">
            {sender || 'Unknown'}
          </span>
          <span className="ml-2 flex-shrink-0 text-sm text-zinc-500">
            {timeAgo(message.timestamp)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-zinc-400">
          {displayText}
        </p>
      </div>
      <svg
        className="mt-1 h-4 w-4 flex-shrink-0 text-zinc-600"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  )
}

export default function SwiggyView() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/swiggy/messages')
      if (!res.ok) {
        if (res.status === 401) {
          setAuthenticated(false)
          setError('Session expired. Please re-enter password.')
        }
        return
      }
      const data = await res.json()
      setMessages(data.messages)
    } catch {
      // silently retry on next interval
    }
  }, [])

  useEffect(() => {
    if (!authenticated) return
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [authenticated, fetchMessages])

  // Update relative timestamps every second
  useEffect(() => {
    if (!authenticated || messages.length === 0) return
    const interval = setInterval(() => setMessages((m) => [...m]), 1000)
    return () => clearInterval(interval)
  }, [authenticated, messages.length])

  // Check if already authenticated via cookie on mount
  useEffect(() => {
    fetch('/api/swiggy/messages')
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true)
          return res.json()
        }
      })
      .then((data) => {
        if (data) setMessages(data.messages)
      })
      .catch(() => {})
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/swiggy/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setAuthenticated(true)
      } else {
        setError('Wrong password')
      }
    } catch {
      setError('Connection error')
    }
    setLoading(false)
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <h1 className="text-center text-xl font-semibold text-white">
            Messages
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-white placeholder-zinc-500 outline-none focus:border-blue-500"
          />
          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'View Messages'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-black/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-base text-blue-500">Edit</span>
          <h1 className="text-lg font-semibold text-white">Messages</h1>
          <svg
            className="h-6 w-6 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
            />
          </svg>
        </div>
        {/* Search bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 rounded-xl bg-zinc-800 px-3 py-2">
            <svg
              className="h-4 w-4 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-base text-zinc-500">Search</span>
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div className="divide-y divide-zinc-800">
        {messages.length === 0 ? (
          <div className="px-4 py-16 text-center text-zinc-500">
            <p className="text-base">No messages in the last 5 minutes</p>
            <p className="mt-1 text-sm">Send a POST to /api/swiggy</p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
      </div>
    </div>
  )
}
