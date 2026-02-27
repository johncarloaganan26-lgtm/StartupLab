import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authCookieName, verifyAuthToken } from '@/lib/auth'

export async function requireAdminAuth() {
  const cookieStore = await cookies()
  const token = cookieStore.get(authCookieName)?.value
  if (!token) {
    throw new NextResponse('Unauthorized', { status: 401 })
  }

  const payload = await verifyAuthToken(token)
  if (payload.role !== 'admin') {
    throw new NextResponse('Forbidden', { status: 403 })
  }

  return payload
}
