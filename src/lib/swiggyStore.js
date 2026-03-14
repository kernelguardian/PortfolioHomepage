// In-memory message store for Swiggy endpoint
// Messages auto-expire after 5 minutes

const messages = []

export function addMessage(payload) {
  messages.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    payload,
    timestamp: Date.now(),
  })
  // Cleanup old messages
  pruneMessages()
}

export function getRecentMessages() {
  pruneMessages()
  return [...messages].reverse()
}

function pruneMessages() {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  while (messages.length > 0 && messages[0].timestamp < fiveMinutesAgo) {
    messages.shift()
  }
}
