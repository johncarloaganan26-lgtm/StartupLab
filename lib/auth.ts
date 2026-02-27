import { SignJWT, jwtVerify } from 'jose'

const secretValue = process.env.JWT_SECRET
if (!secretValue) {
  throw new Error('JWT_SECRET is required')
}

const secret = new TextEncoder().encode(secretValue)

export type AuthTokenPayload = {
  sub: string
  role?: 'attendee' | 'admin'
  purpose?: string
}

export async function signAuthToken(payload: AuthTokenPayload, expiration = '7d') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(secret)
}

export function generateAuthToken(payload: AuthTokenPayload, expiration = '7d') {
  return signAuthToken(payload, expiration)
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, secret)
  return payload as AuthTokenPayload
}

export const authCookieName = 'auth_token'

export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  }
}
