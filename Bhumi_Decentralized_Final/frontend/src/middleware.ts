import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Membaca cookie user_role untuk otentikasi berbasis peran (RBAC)
  const roleCookie = request.cookies.get('user_role')?.value;

  // Jika user mencoba mengakses dashboard tanpa sesi/role, arahkan ke login
  if (pathname.startsWith('/dashboard') && !roleCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Validasi RBAC untuk masing-masing rute dashboard khusus
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

  // Redirect dasar dari /dashboard ke dashboard peran masing-masing
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL(`/dashboard/${roleCookie || 'user'}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
