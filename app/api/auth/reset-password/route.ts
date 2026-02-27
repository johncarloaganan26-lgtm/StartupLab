import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = String(body?.token ?? '').trim();
    const password = String(body?.password ?? '').trim();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Verify token
    let payload;
    try {
      payload = await verifyAuthToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 401 });
    }

    // Check if token is for password reset
    if (payload.purpose !== 'password-reset') {
      return NextResponse.json({ error: 'Invalid token purpose' }, { status: 401 });
    }

    const userId = payload.sub;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password in database
    const [result] = await getDb().execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Password reset request failed:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
