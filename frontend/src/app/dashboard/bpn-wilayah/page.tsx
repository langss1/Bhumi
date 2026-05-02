'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BpnWilayahDashboard() {
  const [activeTab, setActiveTab] = useState('validation');

  const tabs = [
    { id: 'validation', label: 'Validasi & Minting' },
    { id: 'history', label: 'Riwayat Disetujui' }
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
                layoutId="bpnTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-olive-500 rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'validation' && (
            <motion.div 
              key="validation"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-moss-100 rounded-[2rem] shadow-sm overflow-hidden"
            >
              <div className="px-10 py-8 border-b border-moss-50 flex items-center justify-between bg-[#F9FAF8]">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-moss-50 text-moss-600 rounded-2xl flex items-center justify-center border border-moss-100">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-moss-900">Antrean Registrasi Lahan Baru</h3>
                    <p className="text-sm text-moss-500 mt-1">Daftar pengajuan Pendaftaran Tanah Sistematis Lengkap (PTSL)</p>
                  </div>
                </div>
                <span className="text-xs font-black text-olive-700 uppercase tracking-widest bg-olive-50 border border-olive-100 px-5 py-2.5 rounded-full">1 Menunggu Validasi</span>
              </div>
              
              <div className="overflow-x-auto p-6">
                <table className="min-w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">Pemohon (Wallet)</th>
                      <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">Geotagging</th>
                      <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">Metadata</th>
                      <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">IPFS Viewer</th>
                      <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest text-right">Tindakan Khusus</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white hover:bg-[#F9FAF8] transition-colors ring-1 ring-moss-100 rounded-2xl group shadow-sm">
                      <td className="px-6 py-6 rounded-l-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-moss-50 border border-moss-200 flex items-center justify-center shrink-0">
                            <span className="text-moss-700 font-bold text-sm">0x</span>
                          </div>
                          <div>
                            <p className="text-sm font-mono text-moss-900 font-bold">0x123A...89bc</p>
                            <p className="text-[10px] text-moss-400 font-bold uppercase tracking-wider mt-1">Baru masuk</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-olive-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <span className="text-sm text-moss-700 font-mono font-medium">-6.200, 106.816</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-2 items-start">
                          <span className="bg-[#F9FAF8] border border-moss-100 text-moss-700 text-[11px] font-bold px-3 py-1.5 rounded-lg">Luas: 500 m²</span>
                          <span className="bg-[#F9FAF8] border border-moss-100 text-moss-700 text-[11px] font-bold px-3 py-1.5 rounded-lg">NIB: 12345</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-2">
                          <button className="text-[11px] font-bold text-moss-700 bg-moss-50 hover:bg-moss-100 border border-moss-200 px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Lihat Warkah
                          </button>
                          <button className="text-[11px] font-bold text-olive-700 bg-olive-50 hover:bg-olive-100 border border-olive-200 px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Foto Batas
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right rounded-r-2xl">
                        <button className="px-6 py-3 bg-moss-900 hover:bg-moss-800 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-moss-900/10">
                          Approve & Mint NFT
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-moss-100 p-12 rounded-[2rem] shadow-sm text-center"
            >
              <h3 className="text-xl font-bold text-moss-900 mb-2">Belum ada riwayat validasi</h3>
              <p className="text-moss-500">Semua sertifikat yang berhasil Anda setujui akan muncul di sini.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
