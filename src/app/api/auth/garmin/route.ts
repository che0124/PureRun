/**
 * POST /api/auth/garmin
 * Tests Garmin Connect credentials and returns user display name on success.
 * Body: { email: string, password: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { testGarminConnection } from '@/lib/garmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    let result;
    if (email.toLowerCase() === 'demo' || email.toLowerCase() === 'demo@example.com') {
      result = { success: true, displayName: 'Demo Runner (極速跑者)' };
    } else {
      result = await testGarminConnection(email, password);
    }

    if (result.success) {
      return NextResponse.json({ success: true, displayName: result.displayName });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }
  } catch (err: unknown) {
    console.error('[/api/auth/garmin] Error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { success: false, error: 'Server error during Garmin authentication.' },
      { status: 500 }
    );
  }
}
