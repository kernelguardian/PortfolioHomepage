import { NextResponse } from 'next/server'
import { addMessage } from '@/lib/swiggyStore'

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let message

    if (contentType.includes('application/json')) {
      const body = await request.json()
      // Accept { "payload": "..." } or { "payload": 123 } or just a raw string
      console.log('Received JSON body:', body)
      console.log(body.payload)

      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }
}
