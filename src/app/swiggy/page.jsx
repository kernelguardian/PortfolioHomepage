'use client'

import { useState, useEffect, useCallback } from 'react'

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ago`
}

function extractSender(payload) {
  const match = payload.match(/^([A-Z0-9]+-[A-Z])\s/i)
  if (match) return match[1]
  return null
}

function MessageBubble({ message, onSelect }) {
  const sender = extractSender(message.payload)
  const displayText = sender
    ? message.payload.slice(sender.length + 1)
    : message.payload

  return (
    <div
      className="flex cursor-pointer items-start gap-3 px-4 py-3 active:bg-zinc-100 dark:active:bg-zinc-800/50"
      onClick={() => onSelect(message)}
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-200 dark:bg-zinc-700">
        <svg
          className="h-5 w-5 text-zinc-500 dark:text-zinc-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-zinc-900 dark:text-white">
            {sender || 'Unknown'}
          </span>
          <span className="ml-2 flex-shrink-0 text-sm text-zinc-400 dark:text-zinc-500">
            {timeAgo(message.timestamp)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-zinc-500 dark:text-zinc-400">
          {displayText}
        </p>
      </div>
      <svg
        className="mt-1 h-4 w-4 flex-shrink-0 text-zinc-300 dark:text-zinc-600"
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

function MessageDetail({ message, onBack }) {
  const sender = extractSender(message.payload)
  const displayText = sender
    ? message.payload.slice(sender.length + 1)
    : message.payload

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-black/80">
        <div className="flex items-center gap-2 px-4 pb-3 pt-6">
          <button onClick={onBack} className="flex items-center gap-1 text-blue-500">
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-base">Messages</span>
          </button>
        </div>
      </div>

      {/* Sender info */}
      <div className="flex flex-col items-center border-b border-zinc-200 px-4 py-6 dark:border-zinc-800">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
          <svg
            className="h-8 w-8 text-zinc-500 dark:text-zinc-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" />
          </svg>
        </div>
        <span className="mt-3 text-lg font-semibold text-zinc-900 dark:text-white">
          {sender || 'Unknown'}
        </span>
        <span className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
          {timeAgo(message.timestamp)}
        </span>
      </div>

      {/* Full message content */}
      <div className="px-4 py-4">
        <div className="rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
          <p className="whitespace-pre-wrap text-base leading-relaxed text-zinc-900 dark:text-white">
            {displayText}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SwiggyView() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)

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
      <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-black">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <h1 className="text-center text-xl font-semibold text-zinc-900 dark:text-white">
            Messages
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            className="w-full rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-base text-zinc-900 placeholder-zinc-400 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500"
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

  if (selectedMessage) {
    return (
      <MessageDetail
        message={selectedMessage}
        onBack={() => setSelectedMessage(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Expiry banner */}
      <div className="mt-4 overflow-hidden border-b border-red-200 bg-red-50 py-2 dark:border-zinc-800 dark:bg-red-950/40">
        <div className="animate-marquee whitespace-nowrap">
          <span className="mx-8 text-sm font-medium text-red-500 dark:text-red-400">
            Messages will expire in 2 minutes
          </span>
          <span className="mx-8 text-sm font-medium text-red-500 dark:text-red-400">
            Messages will expire in 2 minutes
          </span>
          <span className="mx-8 text-sm font-medium text-red-500 dark:text-red-400">
            Messages will expire in 2 minutes
          </span>
        </div>
      </div>

      {/* Messages list */}
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {(messages.length === 0
          ? [
              {
                id: 'dummy-1',
                payload:
                  'SWIGGY-S Your order #1234 has been picked up by the delivery partner and is on the way. Expected delivery in 15 minutes. Track your order on the Swiggy app for live updates.',
                timestamp: Date.now() - 120000,
              },
              {
                id: 'dummy-2',
                payload:
                  'HDFCBK-S INR 549.00 debited from A/c **1234 on 15-Mar-26. Info: SWIGGY. Avl Bal: INR 12,345.67. Not you? Call 18002586161.',
                timestamp: Date.now() - 180000,
              },
              {
                id: 'dummy-3',
                payload:
                  'SWIGGY-S Yay! Your food has been delivered. We hope you enjoy your meal! Rate your experience on the app.',
                timestamp: Date.now() - 60000,
              },
            ]
          : messages
        ).map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onSelect={setSelectedMessage}
          />
        ))}
      </div>
    </div>
  )
}
