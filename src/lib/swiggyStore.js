import { createClient } from '@vercel/edge-config'

const EDGE_CONFIG_KEY = 'swiggy_messages'
const EDGE_CONFIG_ID = 'ecfg_zwz4hjqj3njpihol6fsquctuzcyh'

const edgeConfig = createClient(process.env.EDGE_CONFIG)

export async function addMessage(payload) {
  const messages = await getRecentMessages()

  messages.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    payload,
    timestamp: Date.now(),
  })

  // Keep only messages from last 5 minutes
  const fiveMinutesAgo = Date.now() - 2 * 60 * 1000
  const filtered = messages.filter((m) => m.timestamp >= fiveMinutesAgo)

  // Write via Vercel REST API (Edge Config SDK is read-only)
  const res = await fetch(
    `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ operation: 'upsert', key: EDGE_CONFIG_KEY, value: filtered }],
      }),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Edge Config write failed: ${err}`)
  }
}

export async function getRecentMessages() {
  try {
    const messages = await edgeConfig.get(EDGE_CONFIG_KEY)
    if (!Array.isArray(messages)) return []

    const fiveMinutesAgo = Date.now() - 2 * 60 * 1000
    return messages.filter((m) => m.timestamp >= fiveMinutesAgo)
  } catch {
    return []
  }
}
