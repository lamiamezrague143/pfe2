import { NextResponse } from 'next/server';

const protectedRoutes = [
  '/priseEnCharge',
  '/secretariat',
  '/comptable',
  '/president',
  '/celluleInfo',
  '/profile',
  '/chat',
  '/client',
  '/change-password',
];

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|login|favicon.ico).*)'],
};