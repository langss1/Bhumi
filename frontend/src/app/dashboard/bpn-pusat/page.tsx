'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';

// Role Hashes based on LandRegistry.sol
const ROLES = {
  validator: "0xd8619ebc57406c13ed639e2467d02cb34a41ebf40f09b531dc14112674e2d277", // keccak256("BPN_WILAYAH_ROLE")
  notaris: "0x35bc858485de34d3d1f3b89b88cf411516e828e833f40f7d4dc9cd82cbabdf92" // keccak256("NOTARIS_ROLE")
};

export default function BpnPusatDashboard() {
  const [activeTab, setActiveTab] = useState('account');

  // Input states
  const [roleAddress, setRoleAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState(ROLES.validator);
  const [disputeTokenId, setDisputeTokenId] = useState('');

  // Wagmi hooks
  const { writeContract: writeRole, data: roleTxHash, isPending: isRolePending } = useWriteContract();
  const { writeContract: writeDispute, data: disputeTxHash, isPending: isDisputePending } = useWriteContract();

  const handleGrantRole = () => {
    if (!roleAddress) return alert("Masukkan Address!");
    writeRole({
      address: LAND_REGISTRY_ADDRESS,
      abi: LandRegistryABI,
      functionName: 'grantRole',
      args: [selectedRole as `0x${string}`, roleAddress as `0x${string}`],
    });
  };

  const handleSetEnforcement = () => {
    if (!disputeTokenId) return alert("Masukkan ID Token!");
    writeDispute({
      address: LAND_REGISTRY_ADDRESS,
      abi: LandRegistryABI,
      functionName: 'setEnforcement',
      args: [BigInt(disputeTokenId), true],
    });
  };

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
              
              <div className="space-y-8">
                <div>
                  <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-4">Wallet Address (0x...)</label>
                  <input 
                    type="text" 
                    value={roleAddress}
                    onChange={(e) => setRoleAddress(e.target.value)}
                    placeholder="Masukkan address Institusi..." 
                    className="w-full p-4 bg-[#F9FAF8] border border-moss-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-mono text-moss-900 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-4">Pilih Otoritas Peran</label>
                  <select 
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full p-4 bg-[#F9FAF8] border border-moss-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-bold text-moss-900 cursor-pointer transition-all"
                  >
                    <option value={ROLES.validator}>Kantor Pertanahan Wilayah (Validator)</option>
                    <option value={ROLES.notaris}>Notaris / PPAT (Signer)</option>
                  </select>
                </div>
                <div className="pt-6">
                  <button 
                    onClick={handleGrantRole}
                    disabled={isRolePending}
                    className="w-full py-5 bg-moss-900 hover:bg-moss-800 text-white text-base font-bold rounded-xl shadow-[0_8px_20px_rgba(38,42,25,0.3)] transition-all disabled:opacity-50"
                  >
                    {isRolePending ? 'Memproses Transaksi...' : 'Submit Transaksi ke Ledger'}
                  </button>
                  {roleTxHash && <p className="text-xs mt-3 text-moss-600">Tx Hash: {roleTxHash}</p>}
                </div>
              </div>
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
                
                <div className="space-y-8 bg-red-950/40 p-8 rounded-2xl border border-red-500/30">
                  <div>
                    <label className="block text-[11px] font-bold text-red-300 uppercase tracking-widest mb-4">Target Pembekuan (ID Token / NIB)</label>
                    <input 
                      type="text" 
                      value={disputeTokenId}
                      onChange={(e) => setDisputeTokenId(e.target.value)}
                      placeholder="Masukkan ID Token" 
                      className="w-full p-4 bg-red-950/60 border border-red-500/50 rounded-xl focus:ring-2 focus:ring-red-400 text-base font-mono text-white placeholder-red-400/50 transition-all" 
                    />
                  </div>
                  <div className="pt-4">
                    <button 
                      onClick={handleSetEnforcement}
                      disabled={isDisputePending}
                      className="w-full py-5 bg-white hover:bg-red-50 text-red-800 text-base font-black rounded-xl shadow-[0_8px_25px_rgba(255,0,0,0.4)] transition-all uppercase tracking-widest disabled:opacity-70"
                    >
                      {isDisputePending ? 'Mengeksekusi Pembekuan...' : 'Eksekusi Pembekuan Aset'}
                    </button>
                    {disputeTxHash && <p className="text-xs mt-3 text-red-300">Tx Hash: {disputeTxHash}</p>}
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
