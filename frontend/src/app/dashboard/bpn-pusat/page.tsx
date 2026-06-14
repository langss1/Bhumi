'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useSafeWriteContract as useWriteContract } from '@/hooks/useSafeWriteContract';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';
import { useWalletGuard } from '@/hooks/useWalletGuard';
import LandLedger from '@/components/LandLedger';
import PendingLandRequests from '@/components/PendingLandRequests';
import PendingVerificators from '@/components/PendingVerificators';
import DisputeManagement from '@/components/DisputeManagement';

const ROLES: Record<string, `0x${string}`> = {
  BPN_WILAYAH_ROLE: "0x3b6c71f6d44639d5b3e40f2ef3056c3385a1e68a255a703ac23442c1c3be357d",
  NOTARIS_ROLE:     "0x4e19be690c034b73b896a80e4645324b1ada2a2d102cf965cd497dd07f3a1950",
  AUDITOR_ROLE:     "0x59a1c48e5837ad7a7f3dcedcbe129bf3249ec4fbf651fd4f5e2600ead39fe2f5",
};

const ROLE_LABELS: Record<string, string> = {
  BPN_WILAYAH_ROLE: '🏢 BPN Wilayah (Input Data Tanah)',
  NOTARIS_ROLE:     '📜 Notaris/PPAT (Eksekusi Transfer)',
  AUDITOR_ROLE:     '🔍 Auditor (Read-Only Audit)',
};

function ManageRolesPanel() {
  const { writeContractAsync, isPending } = useWriteContract();
  const [walletInput, setWalletInput] = useState('');
  const [selectedRole, setSelectedRole] = useState('BPN_WILAYAH_ROLE');
  const [action, setAction] = useState<'grant' | 'revoke'>('grant');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; msg: string }>({ type: '', msg: '' });

  const handleSubmit = async () => {
    if (!walletInput.startsWith('0x') || walletInput.length !== 42) {
      setStatus({ type: 'error', msg: 'Alamat wallet tidak valid. Harus diawali 0x dan 42 karakter.' });
      return;
    }
    setStatus({ type: '', msg: '' });
    try {
      const roleHash = ROLES[selectedRole];
      const functionName = action === 'grant' ? 'grantRole' : 'revokeRole';
      await writeContractAsync({
        address: LAND_REGISTRY_ADDRESS,
        abi: LandRegistryABI,
        functionName,
        args: [roleHash, walletInput as `0x${string}`],
      });
      setStatus({ type: 'success', msg: `Berhasil! Role ${selectedRole} telah ${action === 'grant' ? 'diberikan ke' : 'dicabut dari'} ${walletInput}` });
      setWalletInput('');
    } catch (err: any) {
      setStatus({ type: 'error', msg: err?.message?.slice(0, 200) || 'Transaksi gagal.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-moss-100 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
            <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-black text-moss-900">Kelola Peran Blockchain</h3>
            <p className="text-sm text-moss-500 mt-1">Grant atau Revoke role langsung ke wallet address di Smart Contract.</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Action Toggle */}
          <div>
            <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-3">Aksi</label>
            <div className="flex gap-3">
              <button
                onClick={() => setAction('grant')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                  action === 'grant' ? 'bg-olive-600 text-white border-olive-600 shadow-md' : 'bg-white text-moss-500 border-moss-200 hover:border-olive-400'
                }`}
              >
                ✅ Grant Role
              </button>
              <button
                onClick={() => setAction('revoke')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                  action === 'revoke' ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-moss-500 border-moss-200 hover:border-red-400'
                }`}
              >
                ❌ Revoke Role
              </button>
            </div>
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-3">Pilih Role</label>
            <div className="space-y-2">
              {Object.keys(ROLES).map((roleKey) => (
                <button
                  key={roleKey}
                  onClick={() => setSelectedRole(roleKey)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                    selectedRole === roleKey
                      ? 'bg-moss-900 text-white border-moss-900'
                      : 'bg-white text-moss-700 border-moss-200 hover:border-moss-400'
                  }`}
                >
                  {ROLE_LABELS[roleKey]}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Input */}
          <div>
            <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-3">Wallet Address Target</label>
            <input
              type="text"
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              placeholder="0x..."
              className="w-full p-4 bg-moss-50 border border-moss-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-olive-500 outline-none transition-all"
            />
          </div>

          {/* Status */}
          {status.msg && (
            <div className={`p-4 rounded-xl text-sm font-bold ${
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {status.msg}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isPending || !walletInput}
            className={`w-full py-4 font-black text-white rounded-2xl shadow-lg transition-all disabled:opacity-50 uppercase tracking-wide text-sm ${
              action === 'grant' ? 'bg-olive-600 hover:bg-olive-700 shadow-olive-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'
            }`}
          >
            {isPending ? 'Memproses Transaksi...' : action === 'grant' ? `✅ Grant ${selectedRole}` : `❌ Revoke ${selectedRole}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BpnPusatDashboard() {
  useWalletGuard();
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('validation');

  const tabs = [
    { id: 'validation', label: 'Validasi Pendaftaran Tanah' },
    { id: 'account', label: 'Verifikasi Akun' },
    { id: 'ledger', label: 'Master Ledger Blockchain' },
    { id: 'sengketa', label: 'Manajemen Sengketa' },
    { id: 'roles', label: '🔑 Kelola Peran' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8 md:mb-12 bg-moss-50/80 p-2 rounded-2xl border border-moss-100 w-max mx-auto max-w-full shadow-inner">
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
                <h3 className="text-2xl font-black text-moss-900">Verifikasi Akun</h3>
                <p className="text-sm text-moss-500 mt-2">Tinjau bukti identitas pendaftar (Masyarakat/Institusi) dan berikan persetujuan akses ke dalam sistem.</p>
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
          {activeTab === 'roles' && (
            <motion.div key="roles" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-moss-900">Kelola Peran Sistem</h3>
                <p className="text-sm text-moss-500 mt-2">Grant atau cabut role blockchain ke wallet address manapun. Diperlukan akun Admin BPN Pusat.</p>
              </div>
              <ManageRolesPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
