'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, User, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<{ role: string; name?: string; email?: string; wallet?: string } | null>(null);

  // Refresh session on route change
  useEffect(() => {
    const raw = localStorage.getItem('bb_session');
    setSession(raw ? JSON.parse(raw) : null);
  }, [pathname]);

  // Don't show navbar on root landing page (it has its own navbar)
  if (pathname === '/') return null;

  const handleLogout = () => {
    localStorage.removeItem('bb_session');
    setSession(null);
    router.push('/');
  };

  const roleConfig = {
    user: { label: 'Investor', icon: <User size={14} />, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500' },
    verificator: { label: 'Verificator', icon: <ShieldCheck size={14} />, color: 'text-blue-600 bg-blue-50 border-blue-100', dot: 'bg-blue-500' },
    admin: { label: 'SuperAdmin', icon: <ShieldAlert size={14} />, color: 'text-red-600 bg-red-50 border-red-100', dot: 'bg-red-500' },
  };

  const currentRole = session?.role as keyof typeof roleConfig | undefined;
  const rc = currentRole ? roleConfig[currentRole] : null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-white/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href={session ? `/${session.role === 'admin' ? 'admin' : session.role}` : '/'} className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-xs">BB</span>
          </div>
          <span className="font-black text-slate-900 text-lg tracking-tight">BangBang</span>
        </Link>

        {/* Nav Links (Hidden on /admin for cleaner look) */}
        <nav className="hidden md:flex items-center gap-1">
          {pathname !== '/admin' && (
            <>
              {session?.role === 'user' && (
                <>
                  <Link href="/user" className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${pathname === '/user' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
                    Dashboard
                  </Link>
                  <Link href="/register" className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${pathname === '/register' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
                    Register Asset
                  </Link>
                </>
              )}
              {session?.role === 'verificator' && (
                <Link href="/verificator" className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${pathname === '/verificator' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
                  Verification Queue
                </Link>
              )}
              {session?.role === 'admin' && (
                <Link href="/admin" className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${pathname === '/admin' ? 'bg-red-50 text-red-700 border border-red-100' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
                  Console
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Right: Session Info + Logout */}
        <div className="flex items-center gap-3">
          {session && rc && pathname !== '/admin' && (
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${rc.color}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
              {rc.icon}
              <span>{session.name || session.email || session.wallet || rc.label}</span>
            </div>
          )}
          {session ? (
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 px-3 py-2 rounded-xl transition-all">
              <LogOut size={13} /> Logout
            </button>
          ) : pathname !== '/daftarvalidator' ? (
            <Link href="/" className="bg-slate-900 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-emerald-600 transition-all">
              Login
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
