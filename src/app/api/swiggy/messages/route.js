import { NextResponse } from 'next/server'
import { getRecentMessages } from '@/lib/swiggyStore'

export async function GET(request) {
  if (!process.env.SWIGGY_VIEW_PASSWORD) {
    return NextResponse.json(
      { error: 'SWIGGY_VIEW_PASSWORD env variable not set' },
      { status: 500 },
    )
  }

  // Check cookie first, then header
  const cookie = request.cookies.get('swiggy_auth')?.value
  const header = request.headers.get('x-password')

  if (cookie !== process.env.SWIGGY_VIEW_PASSWORD && header !== process.env.SWIGGY_VIEW_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const messages = await getRecentMessages()
  return NextResponse.json({ messages })
}
