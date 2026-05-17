import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // We are currently simulating the role check using a cookie.
  // In a real app, the Supabase session token or a signed JWT would be validated here.
  const roleCookie = request.cookies.get('user_role')?.value;

  // If user tries to access /dashboard but has no role, redirect to /login
  if (pathname.startsWith('/dashboard') && !roleCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // RBAC Checks for specific routes
  if (pathname.startsWith('/dashboard/bpn-pusat') && roleCookie !== 'bpn-pusat') {
    return NextResponse.redirect(new URL(`/dashboard/${roleCookie || 'user'}`, request.url));
  }
  
  if (pathname.startsWith('/dashboard/bpn-wilayah') && roleCookie !== 'bpn-wilayah') {
    return NextResponse.redirect(new URL(`/dashboard/${roleCookie || 'user'}`, request.url));
  }
  
  if (pathname.startsWith('/dashboard/notaris') && roleCookie !== 'notaris') {
    return NextResponse.redirect(new URL(`/dashboard/${roleCookie || 'user'}`, request.url));
  }
  
  if (pathname.startsWith('/dashboard/auditor') && roleCookie !== 'auditor') {
    return NextResponse.redirect(new URL(`/dashboard/${roleCookie || 'user'}`, request.url));
  }

  // Redirect base /dashboard to specific role dashboard
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL(`/dashboard/${roleCookie || 'user'}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
