import { NextResponse } from 'next/server'
import { addMessage } from '@/lib/swiggyStore'

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let message

    if (contentType.includes('application/json')) {
      const body = await request.json()
      // Accept { "payload": "..." } or { "payload": 123 } or just a raw string
      if (typeof body === 'string') {
        message = body
      } else if (body && body.payload != null) {
        message = typeof body.payload === 'string' ? body.payload : JSON.stringify(body.payload)
      } else if (body && typeof body === 'object') {
        message = JSON.stringify(body)
      }
    } else {
      // Plain text or any other content type — treat body as the message
      message = await request.text()
    }

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: 'Empty payload. Send JSON {"payload": "..."} or plain text body.' },
        { status: 400 },
      )
    }

    addMessage(message.trim())

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Could not parse request body' }, { status: 400 })
  }
}
