import { NextResponse } from 'next/server'
import { addMessage } from '@/lib/swiggyStore'

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let message

    if (contentType.includes('application/json')) {
      const body = await request.json()
      console.log('Received JSON body:', body)
      console.log('payload:', body.payload)

      if (typeof body === 'string') {
        message = body
      } else if (body && body.payload != null) {
        message = typeof body.payload === 'string' ? body.payload : JSON.stringify(body.payload)
      } else if (body && typeof body === 'object') {
        message = JSON.stringify(body)
      }
    } else {
      message = await request.text()
    }

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Empty payload' },
        { status: 400 },
      )
    }

    await addMessage(message.trim())

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
