'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BpnPusatDashboard() {
  const [activeTab, setActiveTab] = useState('account');

  const tabs = [
    { id: 'account', label: 'Pendaftaran Institusi Baru' },
    { id: 'sengketa', label: 'Manajemen Sengketa (Panic Button)' }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-4 mb-10 border-b border-moss-100 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-6 py-4 text-sm font-bold tracking-wide transition-colors ${
              activeTab === tab.id 
                ? tab.id === 'sengketa' ? 'text-red-700' : 'text-moss-900' 
                : 'text-moss-400 hover:text-moss-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="pusatTab"
                className={`absolute bottom-0 left-0 right-0 h-1 rounded-t-full ${tab.id === 'sengketa' ? 'bg-red-500' : 'bg-olive-500'}`}
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'account' && (
            <motion.div 
              key="account"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-moss-100 p-12 rounded-[2rem] shadow-sm max-w-4xl"
            >
              <div className="flex items-center gap-5 mb-10">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-moss-900">Registrasi Node Institusi</h3>
                  <p className="text-sm text-moss-600 mt-2">Berikan hak akses verifikasi on-chain untuk Notaris atau BPN Wilayah baru melalui smart contract.</p>
                </div>
              </div>
              
              <form className="space-y-8">
                <div>
                  <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-4">Wallet Address (0x...)</label>
                  <input type="text" placeholder="Masukkan address Institusi..." className="w-full p-4 bg-[#F9FAF8] border border-moss-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-mono text-moss-900 transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-4">Pilih Otoritas Peran</label>
                  <select className="w-full p-4 bg-[#F9FAF8] border border-moss-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-bold text-moss-900 cursor-pointer transition-all">
                    <option>Kantor Pertanahan Wilayah (Validator)</option>
                    <option>Notaris / PPAT (Signer)</option>
                  </select>
                </div>
                <div className="pt-6">
                  <button type="button" className="w-full py-5 bg-moss-900 hover:bg-moss-800 text-white text-base font-bold rounded-xl shadow-[0_8px_20px_rgba(38,42,25,0.3)] transition-all">
                    Submit Transaksi ke Ledger
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'sengketa' && (
            <motion.div 
              key="sengketa"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-red-700 to-red-900 p-12 rounded-[2rem] shadow-2xl relative overflow-hidden max-w-4xl border border-red-800"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-5 mb-10">
                  <div className="w-16 h-16 bg-red-600/50 text-white rounded-2xl flex items-center justify-center border border-red-400/50">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">Sengketa Darurat (Panic Button)</h3>
                    <p className="text-sm text-red-200 mt-2">Gunakan fitur ini hanya berdasarkan perintah pengadilan untuk membekukan status NFT aset secara sepihak.</p>
                  </div>
                </div>
                
                <form className="space-y-8 bg-red-950/40 p-8 rounded-2xl border border-red-500/30">
                  <div>
                    <label className="block text-[11px] font-bold text-red-300 uppercase tracking-widest mb-4">Target Pembekuan (ID Token / NIB)</label>
                    <input type="text" placeholder="Masukkan ID Token" className="w-full p-4 bg-red-950/60 border border-red-500/50 rounded-xl focus:ring-2 focus:ring-red-400 text-base font-mono text-white placeholder-red-400/50 transition-all" />
                  </div>
                  <div className="pt-4">
                    <button type="button" className="w-full py-5 bg-white hover:bg-red-50 text-red-800 text-base font-black rounded-xl shadow-[0_8px_25px_rgba(255,0,0,0.4)] transition-all uppercase tracking-widest">
                      Eksekusi Pembekuan Aset
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
