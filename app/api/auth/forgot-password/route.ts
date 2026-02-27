import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { RowDataPacket } from 'mysql2/promise';
import { sendPasswordResetEmail } from '@/lib/email';
import { generateAuthToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email ?? '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists with this email
    const [rows] = await getDb().execute<RowDataPacket[]>(
      'SELECT id, name FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      // Return success even if email doesn't exist to prevent user enumeration
      return NextResponse.json({ ok: true });
    }

    const userId = rows[0].id;
    const userName = rows[0].name;

    // Generate password reset token (valid for 1 hour)
    const resetToken = await generateAuthToken({ sub: userId, purpose: 'password-reset' }, '1h');

    // Send reset email
    const emailSent = await sendPasswordResetEmail(email, resetToken);
    
    if (!emailSent) {
      console.error('Failed to send password reset email');
      return NextResponse.json({ error: 'Failed to send reset email. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Forgot password request failed:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
