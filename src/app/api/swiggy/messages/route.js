import { NextResponse } from 'next/server'
import { getRecentMessages } from '@/lib/swiggyStore'

export async function GET(request) {
  const password = request.headers.get('x-password')

  if (!process.env.SWIGGY_VIEW_PASSWORD) {
    return NextResponse.json(
      { error: 'SWIGGY_VIEW_PASSWORD env variable not set' },
      { status: 500 },
    )
  }

  if (password !== process.env.SWIGGY_VIEW_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const messages = getRecentMessages()
  return NextResponse.json({ messages })
}
