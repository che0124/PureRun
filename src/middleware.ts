import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Check if the user already has a deviceId cookie
  let deviceId = request.cookies.get('device-id')?.value;
  
  if (!deviceId) {
    // Generate a new random UUID for the visitor
    deviceId = crypto.randomUUID();
    // Set cookie to expire in 1 year
    response.cookies.set('device-id', deviceId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }
  
  return response;
}

// Only run middleware on relevant paths (exclude static files, images, etc.)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
