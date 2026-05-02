'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { address } = useAccount();

  // Extract role from pathname
  const role = pathname.split('/')[2] || 'user';

  const menuItems = [
    { label: 'Pemilik Tanah', path: '/dashboard/user', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label: 'BPN Wilayah', path: '/dashboard/bpn-wilayah', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Notaris / PPAT', path: '/dashboard/notaris', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { label: 'BPN Pusat', path: '/dashboard/bpn-pusat', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { label: 'Auditor KPK', path: '/dashboard/auditor', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
  ];

  return (
    <div className="flex h-screen bg-[#F9FAF8] font-sans overflow-hidden">
      {/* Premium Sidebar */}
      <aside className="w-72 bg-white border-r border-moss-100/50 flex flex-col z-20 shadow-[4px_0_24px_rgba(138,154,91,0.03)]">
        <div className="h-24 flex items-center px-8 border-b border-moss-50">
          <img src="/logo.png" alt="Bhumi Logo" className="w-10 h-10 object-contain mr-4" />
          <div>
            <h2 className="text-2xl font-black text-moss-900 tracking-tight">Bhumi</h2>
            <p className="text-[10px] font-bold text-olive-500 uppercase tracking-widest mt-0.5">Sistem Pertanahan</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-8 px-5">
          <p className="px-3 text-[11px] font-bold text-moss-400/80 uppercase tracking-widest mb-4">Modul Operasional</p>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              if (item.path !== `/dashboard/${role}`) return null; 

              return (
                <Link key={item.path} href={item.path} className="block relative">
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute inset-0 bg-moss-50 rounded-2xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className={`relative flex items-center gap-4 px-5 py-4 rounded-2xl transition-colors ${isActive ? 'text-moss-800 font-bold' : 'text-moss-500 hover:text-moss-900 hover:bg-moss-50/50'}`}>
                    <svg className={`w-6 h-6 ${isActive ? 'text-olive-500' : 'text-moss-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 2 : 1.5} d={item.icon} />
                    </svg>
                    <span className="text-sm">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-moss-50">
          <div className="p-4 bg-[#F9FAF8] rounded-2xl border border-moss-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-moss-100 border border-moss-200 flex items-center justify-center shrink-0">
              <span className="text-moss-800 font-bold text-sm">0x</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-olive-500 uppercase tracking-widest mb-1">Sesi Aktif</p>
              <p className="text-xs font-mono text-moss-900 truncate font-semibold">{address || 'Tidak terhubung'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-moss-50 flex items-center justify-between px-12 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-moss-900 capitalize">
              {role.replace('-', ' ')}
            </h1>
            <span className="bg-olive-100 text-olive-700 text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-widest border border-olive-200">
              Verified Node
            </span>
          </div>
          <Link href="/login" className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-moss-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Keluar
          </Link>
        </header>
        
        <div className="flex-1 overflow-y-auto p-12 pb-24">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
