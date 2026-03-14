import { NextResponse } from 'next/server'
import { addMessage } from '@/lib/swiggyStore'

export async function POST(request) {
  try {
    const body = await request.json()
    const { payload } = body

    if (!payload || typeof payload !== 'string') {
      return NextResponse.json(
        { error: 'payload is required and must be a string' },
        { status: 400 },
      )
    }

    addMessage(payload)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}
