'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWriteContract } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';
import LandLedger from '@/components/LandLedger';
import PendingLandRequests from '@/components/PendingLandRequests';
import PendingVerificators from '@/components/PendingVerificators';

const ROLES = {
  validator: "0xd8619ebc57406c13ed639e2467d02cb34a41ebf40f09b531dc14112674e2d277", // BPN_WILAYAH_ROLE
  notaris: "0x35bc858485de34d3d1f3b89b88cf411516e828e833f40f7d4dc9cd82cbabdf92",   // NOTARIS_ROLE
  auditor: "0x0bff7c1b4ac6b50d6d5c363cf9d6f57f48a5d4571c3e8e5a15f636c4c657af3"    // AUDITOR_ROLE
};

export default function BpnPusatDashboard() {
  const [activeTab, setActiveTab] = useState('validation');
  const [disputeTokenId, setDisputeTokenId] = useState('');

  const { writeContract: writeDispute, isPending: isDisputePending } = useWriteContract();

  const handleSetEnforcement = (isDisputed: boolean) => {
    if (!disputeTokenId) return alert("Masukkan ID Token!");
    writeDispute({
      address: LAND_REGISTRY_ADDRESS,
      abi: LandRegistryABI,
      functionName: 'setEnforcement',
      args: [BigInt(disputeTokenId), isDisputed],
      
    });
  };

  const tabs = [
    { id: 'validation', label: 'Validasi Pendaftaran Tanah' },
    { id: 'account', label: 'Verifikasi Pejabat / Institusi' },
    { id: 'ledger', label: 'Master Ledger Blockchain' },
    { id: 'sengketa', label: 'Manajemen Sengketa' }
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
              <motion.div layoutId="pusatTab" className="absolute bottom-0 left-0 right-0 h-1 bg-olive-500 rounded-t-full" />
            )}
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
            <motion.div key="sengketa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white border border-moss-100 p-12 rounded-[2rem] shadow-sm max-w-4xl">
              <h3 className="text-2xl font-black text-moss-900 mb-6">Pembekuan Aset (Dispute)</h3>
              <div className="space-y-6 p-8 bg-red-50 rounded-3xl border border-red-100">
                <input type="text" value={disputeTokenId} onChange={(e) => setDisputeTokenId(e.target.value)} placeholder="Masukkan Token ID" className="w-full p-4 border-red-200 rounded-xl" />
                <div className="flex gap-4">
                  <button onClick={() => handleSetEnforcement(true)} disabled={isDisputePending} className="flex-1 py-4 bg-red-600 text-white font-bold rounded-xl">Set Sengketa</button>
                  <button onClick={() => handleSetEnforcement(false)} disabled={isDisputePending} className="flex-1 py-4 bg-moss-700 text-white font-bold rounded-xl">Lepas Sengketa</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
