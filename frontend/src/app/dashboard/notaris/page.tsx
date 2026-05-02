'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotarisDashboard() {
  const [activeTab, setActiveTab] = useState('pending');

  const tabs = [
    { id: 'pending', label: 'Menunggu Otorisasi' },
    { id: 'history', label: 'Riwayat Transaksi' }
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
                layoutId="notarisTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-olive-500 rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'pending' && (
            <motion.div 
              key="pending"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-moss-100 rounded-[2rem] shadow-sm overflow-hidden"
            >
              <div className="px-10 py-8 border-b border-moss-50 flex items-center justify-between bg-[#F9FAF8]">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-moss-50 text-olive-600 rounded-2xl flex items-center justify-center border border-moss-100">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-moss-900">Antrean Transfer (Multi-Sig)</h3>
                    <p className="text-sm text-moss-500 mt-1">Transaksi jual beli lahan yang membutuhkan otorisasi akhir PPAT</p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto p-6">
                <table className="min-w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">ID NFT</th>
                      <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">Pertukaran Kepemilikan</th>
                      <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">Syarat Dokumen AJB</th>
                      <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest text-right">Otorisasi Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white hover:bg-[#F9FAF8] transition-colors ring-1 ring-moss-100 rounded-2xl group shadow-sm">
                      <td className="px-6 py-6 rounded-l-2xl">
                        <div className="w-14 h-14 rounded-2xl bg-[#F9FAF8] border border-moss-100 flex items-center justify-center shrink-0">
                          <span className="text-moss-900 font-black text-xl">#0</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-moss-700 font-bold bg-[#F9FAF8] px-3 py-1.5 rounded-lg border border-moss-100">0xAAA...111</span>
                            <svg className="w-5 h-5 text-olive-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            <span className="text-xs font-mono text-moss-900 font-black bg-moss-100 px-3 py-1.5 rounded-lg border border-moss-200">0xBBB...222</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-bold">
                            <span className="flex items-center gap-1 text-olive-600 bg-olive-50 px-2 py-1 rounded">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              Seller OK
                            </span>
                            <span className="flex items-center gap-1 text-olive-600 bg-olive-50 px-2 py-1 rounded">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              Buyer OK
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <label className="inline-flex items-center gap-2 cursor-pointer group-hover:text-olive-700 transition">
                          <div className="px-5 py-3 border-2 border-dashed border-moss-200 rounded-xl text-xs font-bold text-moss-600 bg-white hover:bg-moss-50 hover:border-olive-300 transition-all flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            Unggah PDF AJB
                          </div>
                          <input type="file" className="hidden" />
                        </label>
                      </td>
                      <td className="px-6 py-6 text-right rounded-r-2xl">
                        <button className="px-6 py-4 bg-moss-900 hover:bg-moss-800 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-moss-900/20 flex items-center gap-2 ml-auto">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          Sign Transaksi
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
              <h3 className="text-xl font-bold text-moss-900 mb-2">Riwayat Kosong</h3>
              <p className="text-moss-500">Transaksi jual beli yang sudah Anda sahkan akan tampil di sini.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
