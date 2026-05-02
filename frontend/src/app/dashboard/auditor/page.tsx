'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LandLedger from '@/components/LandLedger';

export default function AuditorDashboard() {
  const [activeTab, setActiveTab] = useState('ledger');

  const tabs = [
    { id: 'ledger', label: 'Monitoring Ledger' },
    { id: 'search', label: 'Pencarian Forensik' }
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
              <motion.div layoutId="auditorTab" className="absolute bottom-0 left-0 right-0 h-1 bg-olive-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'ledger' && (
            <motion.div key="ledger" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-moss-900">Akses Read-Only Auditor</h3>
                <p className="text-sm text-moss-500 mt-2">Memantau seluruh anomali atau tumpang tindih kepemilikan aset secara immutable.</p>
              </div>
              <LandLedger />
            </motion.div>
          )}

          {activeTab === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-moss-100 p-12 rounded-[2rem] shadow-sm">
              <h3 className="text-2xl font-black text-moss-900 mb-6">Pencarian Forensik</h3>
              <div className="flex gap-4">
                <input type="text" placeholder="Masukkan NIB atau ID Token..." className="flex-1 p-5 bg-[#F9FAF8] border border-moss-200 rounded-xl font-mono" />
                <button className="px-8 bg-moss-900 text-white font-bold rounded-xl">Cari di Blockchain</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
