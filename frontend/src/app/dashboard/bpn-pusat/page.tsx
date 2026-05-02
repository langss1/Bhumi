'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWriteContract } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';
import LandLedger from '@/components/LandLedger';

const ROLES = {
  validator: "0xd8619ebc57406c13ed639e2467d02cb34a41ebf40f09b531dc14112674e2d277", // BPN_WILAYAH_ROLE
  notaris: "0x35bc858485de34d3d1f3b89b88cf411516e828e833f40f7d4dc9cd82cbabdf92" // NOTARIS_ROLE
};

export default function BpnPusatDashboard() {
  const [activeTab, setActiveTab] = useState('ledger');

  const [roleAddress, setRoleAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState(ROLES.validator);
  const [disputeTokenId, setDisputeTokenId] = useState('');

  const { writeContract: writeRole, isPending: isRolePending } = useWriteContract();
  const { writeContract: writeDispute, isPending: isDisputePending } = useWriteContract();

  const handleGrantRole = () => {
    if (!roleAddress) return alert("Masukkan Address!");
    writeRole({
      address: LAND_REGISTRY_ADDRESS,
      abi: LandRegistryABI,
      functionName: 'grantRole',
      args: [selectedRole as `0x${string}`, roleAddress as `0x${string}`],
    });
  };

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
    { id: 'ledger', label: 'Master Ledger Blockchain' },
    { id: 'account', label: 'Registrasi Institusi' },
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
          {activeTab === 'ledger' && (
            <motion.div key="ledger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-moss-900">Validasi Seluruh Blok</h3>
                <p className="text-sm text-moss-500 mt-2">Memantau data tanah real-time yang tersimpan di seluruh laptop regional node.</p>
              </div>
              <LandLedger />
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div key="account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white border border-moss-100 p-12 rounded-[2rem] shadow-sm max-w-4xl">
              <h3 className="text-2xl font-black text-moss-900 mb-6">Registrasi Node Institusi</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-3">Wallet Address</label>
                  <input type="text" value={roleAddress} onChange={(e) => setRoleAddress(e.target.value)} placeholder="0x..." className="w-full p-4 bg-[#F9FAF8] border border-moss-200 rounded-xl font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-3">Peran</label>
                  <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full p-4 bg-[#F9FAF8] border border-moss-200 rounded-xl font-bold">
                    <option value={ROLES.validator}>BPN Wilayah (Regional Node)</option>
                    <option value={ROLES.notaris}>Notaris (PPAT)</option>
                  </select>
                </div>
                <button onClick={handleGrantRole} disabled={isRolePending} className="w-full py-5 bg-moss-900 text-white font-bold rounded-xl transition-all disabled:opacity-50">
                  {isRolePending ? 'Mengirim Transaksi...' : 'Grant Role on Blockchain'}
                </button>
              </div>
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
