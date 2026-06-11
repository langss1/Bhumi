'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWriteContract } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';
import LandLedger from '@/components/LandLedger';
import PendingLandRequests from '@/components/PendingLandRequests';
import PendingVerificators from '@/components/PendingVerificators';
import DisputeManagement from '@/components/DisputeManagement';

const ROLES = {
  validator: "0x3b6c71f6d44639d5b3e40f2ef3056c3385a1e68a255a703ac23442c1c3be357d", // BPN_WILAYAH_ROLE
  notaris: "0x4e19be690c034b73b896a80e4645324b1ada2a2d102cf965cd497dd07f3a1950",   // NOTARIS_ROLE
  auditor: "0x59a1c48e5837ad7a7f3dcedcbe129bf3249ec4fbf651fd4f5e2600ead39fe2f5"    // AUDITOR_ROLE
};

export default function BpnPusatDashboard() {
  const [activeTab, setActiveTab] = useState('validation');

  const tabs = [
    { id: 'validation', label: 'Validasi Pendaftaran Tanah' },
    { id: 'account', label: 'Verifikasi Pejabat / Institusi' },
    { id: 'ledger', label: 'Master Ledger Blockchain' },
    { id: 'sengketa', label: 'Manajemen Sengketa' }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap items-center gap-2 mb-8 md:mb-12 bg-moss-50/80 p-2 rounded-2xl border border-moss-100 w-max max-w-full shadow-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm font-black tracking-wide transition-all rounded-xl outline-none ${
              activeTab === tab.id 
                ? 'text-white' 
                : 'text-moss-500 hover:text-moss-800 hover:bg-white/50'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="pusat-active-tab"
                className="absolute inset-0 bg-moss-900 rounded-xl shadow-md shadow-moss-900/20"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'validation' && (
            <motion.div key="validation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-moss-900">Validasi Pendaftaran Tanah</h3>
                <p className="text-sm text-moss-500 mt-2">Tinjau permohonan dari BPN Wilayah dan setujui untuk mencetak sertifikat digital.</p>
              </div>
              <PendingLandRequests />
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div key="account" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-moss-900">Verifikasi Pendaftaran Pejabat</h3>
                <p className="text-sm text-moss-500 mt-2">Tinjau SK/Dokumen Institusi yang mendaftar dan berikan hak akses Smart Contract (On-Chain).</p>
              </div>
              <PendingVerificators />
            </motion.div>
          )}

          {activeTab === 'ledger' && (
            <motion.div key="ledger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-moss-900">Validasi Seluruh Blok</h3>
                <p className="text-sm text-moss-500 mt-2">Memantau data tanah real-time yang tersimpan di seluruh laptop regional node.</p>
              </div>
              <LandLedger />
            </motion.div>
          )}
          {activeTab === 'sengketa' && (
            <motion.div key="sengketa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <DisputeManagement />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
