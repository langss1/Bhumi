'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuditorDashboard() {
  const [activeTab, setActiveTab] = useState('search');

  const tabs = [
    { id: 'search', label: 'Pencarian Forensik' },
    { id: 'timeline', label: 'Silsilah Kepemilikan (Provenance)' }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-4 mb-10 border-b border-moss-100 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-6 py-4 text-sm font-bold tracking-wide transition-colors ${
              activeTab === tab.id ? 'text-moss-900' : 'text-moss-400 hover:text-moss-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="auditorTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-olive-500 rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'search' && (
            <motion.div 
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-moss-100 p-12 rounded-[2rem] shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-olive-100 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-60"></div>
              
              <div className="relative z-10 max-w-4xl">
                <div className="flex items-center gap-5 mb-10">
                  <div className="w-16 h-16 bg-[#F9FAF8] text-moss-700 rounded-2xl flex items-center justify-center border border-moss-200">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-moss-900">Mesin Pencari Immutable</h3>
                    <p className="text-sm text-moss-600 mt-2">Akses Read-Only ke dalam blockchain untuk melacak keberadaan aset lahan.</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-5">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="Lacak berdasarkan NIB, ID Token, atau Wallet Address..." 
                      className="w-full pl-6 pr-6 py-5 bg-[#F9FAF8] border border-moss-200 rounded-xl focus:ring-2 focus:ring-olive-500 focus:bg-white text-base text-moss-900 font-medium transition-all shadow-inner" 
                    />
                  </div>
                  <button className="px-10 py-5 bg-moss-900 hover:bg-moss-800 text-white text-base font-bold rounded-xl shadow-lg shadow-moss-900/20 transition-all whitespace-nowrap">
                    Jalankan Kueri
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <motion.div 
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-moss-100 p-12 rounded-[2rem] shadow-sm max-w-4xl"
            >
              <h3 className="text-2xl font-black text-moss-900 mb-12">Silsilah Kepemilikan Lahan</h3>
              
              <div className="relative border-l-2 border-moss-200 ml-6 space-y-12">
                
                {/* Node 1 */}
                <div className="relative pl-10 group">
                  <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-olive-500 border-4 border-white shadow-sm group-hover:scale-125 transition-transform"></div>
                  <div className="bg-gradient-to-r from-olive-50/50 to-transparent border border-olive-100/50 rounded-2xl p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-base font-black text-moss-900">Transfer Hak Milik Berhasil</h4>
                        <p className="text-xs text-moss-500 mt-1">Multi-Signature tervalidasi di Blok #82931</p>
                      </div>
                      <span className="text-[10px] font-black text-olive-700 bg-olive-100 px-4 py-2 rounded-full tracking-widest uppercase">Hari Ini</span>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-moss-100 p-5 space-y-3 text-xs font-mono text-moss-600 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-moss-400 font-sans uppercase tracking-widest text-[10px] font-bold w-24">Dari Seller</span>
                        <span className="text-moss-900 font-bold">0xAAA...111</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-moss-400 font-sans uppercase tracking-widest text-[10px] font-bold w-24">Ke Buyer</span>
                        <span className="text-olive-700 font-black bg-olive-50 px-2 py-1 rounded">0xBBB...222</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-moss-400 font-sans uppercase tracking-widest text-[10px] font-bold w-24">Disahkan Oleh</span>
                        <span className="text-moss-900">Notaris 0xCCC...</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Node 2 */}
                <div className="relative pl-10 group">
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-moss-300 border-4 border-white group-hover:bg-moss-400 transition-colors"></div>
                  <div className="border border-moss-100 rounded-2xl p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-base font-black text-moss-900">Pendaftaran Awal (Genesis Mint)</h4>
                        <p className="text-xs text-moss-500 mt-1">Sertifikat Tanah (NFT) Resmi Dicetak</p>
                      </div>
                      <span className="text-[10px] font-bold text-moss-500 bg-[#F9FAF8] border border-moss-100 px-4 py-2 rounded-full tracking-widest uppercase">12 Feb 2026</span>
                    </div>
                    
                    <div className="bg-[#F9FAF8] rounded-xl p-5 space-y-3 text-xs text-moss-600">
                      <div className="flex items-center justify-between">
                        <span className="text-moss-400 uppercase tracking-widest text-[10px] font-bold w-24">ID NIB</span>
                        <span className="text-moss-900 font-black font-mono">123456789</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-moss-400 uppercase tracking-widest text-[10px] font-bold w-24">Verifikator</span>
                        <span className="text-moss-900 font-medium">Kantor Wilayah BPN Jakarta</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-moss-400 uppercase tracking-widest text-[10px] font-bold w-24">Pemilik Awal</span>
                        <span className="text-moss-900 font-mono font-bold">0xAAA...111</span>
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
