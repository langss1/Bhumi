'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';
import { getPendingVerificators, updateProfile, DBProfile } from '@/lib/supabase';

// Role Hashes dari Smart Contract
const ROLES = {
  BPN_WILAYAH: "0xd8619ebc57406c13ed639e2467d02cb34a41ebf40f09b531dc14112674e2d277",
  NOTARIS: "0x35bc858485de34d3d1f3b89b88cf411516e828e833f40f7d4dc9cd82cbabdf92",
  AUDITOR: "0x0bff7c1b4ac6b50d6d5c363cf9d6f57f48a5d4571c3e8e5a15f636c4c657af3"
};

export default function PendingVerificators() {
  const [pendingAccounts, setPendingAccounts] = useState<DBProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<DBProfile | null>(null);

  const { data: hash, writeContract, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const fetchPending = async () => {
    setLoading(true);
    try {
      const { data, error } = await (await import('@/lib/supabase')).supabase
        .from('profiles')
        .select('*')
        .eq('verification_status', 'PENDING')
        .neq('role', 'UMUM');
      
      console.log("Debug Pending Data:", data);
      if (error) {
        console.error("Supabase Error Message:", error.message);
        console.error("Supabase Error Details:", error.details);
        console.error("Supabase Error Hint:", error.hint);
        alert("Database Error: " + error.message);
      }
      
      setPendingAccounts(data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // Saat transaksi blockchain berhasil dikonfirmasi
  useEffect(() => {
    if (isConfirmed && selectedAccount) {
      handleFinalizeApproval(selectedAccount.id);
    }
  }, [isConfirmed]);

  const getRoleHash = (roleName: string) => {
    if (roleName === 'BPN_WILAYAH') return ROLES.BPN_WILAYAH;
    if (roleName === 'NOTARIS') return ROLES.NOTARIS;
    if (roleName === 'AUDITOR') return ROLES.AUDITOR;
    return null;
  };

  const formatIpfsUrl = (url: string | null) => {
    if (!url) return '#';
    if (url.startsWith('ipfs://')) {
      return `https://gateway.pinata.cloud/ipfs/${url.replace('ipfs://', '')}`;
    }
    return url;
  };

  const handleApprove = async (account: DBProfile) => {
    const roleHash = getRoleHash(account.role);
    if (!roleHash) {
      alert(`Role ${account.role} tidak dikenali oleh Smart Contract.`);
      return;
    }
    if (!account.wallet_address) {
      alert('Wallet address pengguna kosong!');
      return;
    }

    // Set akun yang sedang diproses agar useEffect bisa melacaknya nanti
    setSelectedAccount(account);

    try {
      // 1. Kirim transaksi On-Chain untuk memberikan Role
      writeContract({
        address: LAND_REGISTRY_ADDRESS,
        abi: LandRegistryABI,
        functionName: 'grantRole',
        args: [roleHash as `0x${string}`, account.wallet_address as `0x${string}`],
      });
    } catch (error) {
      console.error(error);
      alert('Gagal memulai transaksi blockchain.');
    }
  };

  const handleFinalizeApproval = async (userId: string) => {
    // 2. Transaksi blockchain sukses, update database off-chain
    try {
      const { error } = await updateProfile(userId, { verification_status: 'APPROVED' });
      
      if (error) {
        console.error("Supabase Update Error:", error);
        alert('Blockchain sukses, tapi GAGAL update database: ' + error.message);
        return;
      }

      alert('Berhasil! Role telah ditambahkan di Blockchain dan Database diperbarui.');
      setSelectedAccount(null);
      fetchPending(); // Refresh tabel
    } catch (error: any) {
      console.error("Gagal update profil:", error);
      alert('Terjadi kesalahan sistem: ' + (error.message || "Unknown error"));
    }
  };

  const handleReject = async (userId: string) => {
    if (confirm('Yakin ingin menolak pendaftaran institusi ini?')) {
      try {
        const { error } = await updateProfile(userId, { verification_status: 'REJECTED' });
        if (error) {
          console.error("Supabase Reject Error:", error);
          alert("Gagal menolak di database: " + error.message);
        } else {
          alert("Pendaftaran telah ditolak.");
          fetchPending();
        }
      } catch (err: any) {
        alert("Terjadi kesalahan: " + err.message);
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-moss-500 font-medium">Memuat data pendaftar...</div>;

  return (
    <div className="bg-white border border-moss-100 rounded-3xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-moss-50 border-b border-moss-100 text-xs uppercase tracking-widest font-bold text-moss-600">
              <th className="px-6 py-4">Nama Lengkap</th>
              <th className="px-6 py-4">Peran Instansi</th>
              <th className="px-6 py-4">Wallet Address</th>
              <th className="px-6 py-4">Dokumen Bukti</th>
              <th className="px-6 py-4 text-right">Aksi Verifikasi</th>
            </tr>
          </thead>
          <tbody className="text-sm font-medium">
            {pendingAccounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-moss-500">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <svg className="w-12 h-12 text-moss-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p>Tidak ada Pejabat/Institusi yang menunggu verifikasi.</p>
                  </div>
                </td>
              </tr>
            ) : (
              pendingAccounts.map((acc, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={acc.id} 
                  className="border-b border-moss-50 hover:bg-moss-50/50 transition-colors"
                >
                  <td className="px-6 py-5">
                    <p className="text-gray-900 font-bold">{acc.full_name}</p>
                    <p className="text-xs text-moss-500 mt-1">{acc.email}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest ${
                      acc.role === 'NOTARIS' ? 'bg-blue-100 text-blue-700' :
                      acc.role === 'AUDITOR' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {acc.role}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-mono text-xs text-moss-700 bg-moss-100/50 px-2 py-1 rounded-lg truncate max-w-[150px]">
                      {acc.wallet_address}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <a 
                      href={formatIpfsUrl(acc.evidence_url)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-olive-600 hover:text-olive-700 font-bold text-xs bg-olive-50 px-3 py-2 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      Lihat SK/KTA
                    </a>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {selectedAccount?.id === acc.id && (isPending || isConfirming) ? (
                      <span className="inline-flex items-center gap-2 text-moss-600 font-bold text-xs bg-moss-100 px-4 py-2 rounded-xl animate-pulse">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        {isPending ? 'Konfirmasi Wallet...' : 'Menulis ke Blockchain...'}
                      </span>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => handleReject(acc.id)}
                          className="px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"
                        >
                          Tolak
                        </button>
                        <button 
                          onClick={() => handleApprove(acc)}
                          className="px-4 py-2 bg-moss-800 hover:bg-moss-900 text-white rounded-lg text-xs font-bold shadow-md shadow-moss-800/20 transition-all flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          Approve (On-Chain)
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
