'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWaitForTransactionReceipt } from 'wagmi';
import { useSafeWriteContract as useWriteContract } from '@/hooks/useSafeWriteContract';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';
import { getPendingVerificators, updateProfile, DBProfile } from '@/lib/supabase';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

// Role Hashes dari Smart Contract
const ROLES = {
  BPN_WILAYAH: "0x3b6c71f6d44639d5b3e40f2ef3056c3385a1e68a255a703ac23442c1c3be357d",
  NOTARIS: "0x4e19be690c034b73b896a80e4645324b1ada2a2d102cf965cd497dd07f3a1950",
  AUDITOR: "0x59a1c48e5837ad7a7f3dcedcbe129bf3249ec4fbf651fd4f5e2600ead39fe2f5"
};

export default function PendingVerificators() {
  const [pendingAccounts, setPendingAccounts] = useState<DBProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<DBProfile | null>(null);
  const [activeGeneration, setActiveGeneration] = useState<{ address: string; privateKey: string } | null>(null);
  const [generatedKeys, setGeneratedKeys] = useState<{ address: string; email: string; name: string } | null>(null);

  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({
    hash,
  });

  const fetchPending = async () => {
    setLoading(true);
    try {
      const { data, error } = await (await import('@/lib/supabase')).supabase
        .from('profiles')
        .select('*')
        .eq('verification_status', 'PENDING');
      
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

  // Saat transaksi blockchain gagal dikirim
  useEffect(() => {
    if (writeError) {
      console.error("Blockchain write error:", writeError);
      alert(`Gagal mengirim transaksi ke Blockchain:\n${writeError.message || writeError}`);
      setSelectedAccount(null);
    }
  }, [writeError]);

  // Saat konfirmasi transaksi blockchain gagal (revert)
  useEffect(() => {
    if (confirmError) {
      console.error("Blockchain confirmation error:", confirmError);
      alert(`Gagal mengonfirmasi transaksi di Blockchain:\n${confirmError.message || confirmError}`);
      setSelectedAccount(null);
    }
  }, [confirmError]);

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

  const hashPrivateKey = async (pk: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pk);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleApprove = async (account: DBProfile) => {
    if (account.role === 'UMUM') {
      // Jalankan pembuatan wallet otomatis untuk Masyarakat Umum secara langsung (tanpa on-chain grantRole)
      try {
        const privateKey = generatePrivateKey();
        const newAccount = privateKeyToAccount(privateKey);
        const targetAddress = newAccount.address;
        
        setActiveGeneration({ address: targetAddress, privateKey });
        setSelectedAccount(account);
        
        // Simpan ke Supabase secara langsung
        setTimeout(async () => {
          try {
            // Hashing private key sebelum disimpan
            const hashedPrivateKey = await hashPrivateKey(privateKey);

            const updates: Partial<DBProfile> = { 
              verification_status: 'APPROVED',
              wallet_address: targetAddress,
              private_key: hashedPrivateKey
            };
            const { error } = await updateProfile(account.id, updates);
            if (error) throw error;
            
            // Kirim email
            try {
              await fetch('/api/send-wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: account.email,
                  name: account.full_name || account.email,
                  address: targetAddress,
                  privateKey: privateKey,
                }),
              });
            } catch (emailErr) {
              console.error('Failed to send email', emailErr);
            }
            
            setGeneratedKeys({
              address: targetAddress,
              email: account.email,
              name: account.full_name || account.email
            });
            
            setSelectedAccount(null);
            setActiveGeneration(null);
            fetchPending(); // Refresh tabel
          } catch (err: any) {
            alert("Gagal memproses approval Masyarakat: " + err.message);
            setSelectedAccount(null);
            setActiveGeneration(null);
          }
        }, 50);
      } catch (err: any) {
        alert("Gagal membuat wallet otomatis: " + err.message);
      }
      return;
    }

    const roleHash = getRoleHash(account.role);
    if (!roleHash) {
      alert(`Role ${account.role} tidak dikenali oleh Smart Contract.`);
      return;
    }

    let targetAddress = account.wallet_address;
    
    // Validasi format alamat Ethereum (harus diawali 0x dan diikuti 40 karakter heksadesimal)
    const isAddress = (address: string | null) => {
      if (!address) return false;
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    };

    let generated = null;
    if (!isAddress(targetAddress)) {
      // Jika kosong atau tidak valid, buat wallet otomatis dari blockchain (viem)
      try {
        const privateKey = generatePrivateKey();
        const newAccount = privateKeyToAccount(privateKey);
        targetAddress = newAccount.address;
        generated = { address: targetAddress, privateKey };
        setActiveGeneration(generated);
      } catch (err: any) {
        alert("Gagal membuat wallet otomatis: " + err.message);
        return;
      }
    }

    // Set akun yang sedang diproses agar useEffect bisa melacaknya nanti
    setSelectedAccount(account);

    try {
      // 1. Kirim transaksi On-Chain untuk memberikan Role
      writeContract({
        address: LAND_REGISTRY_ADDRESS,
        abi: LandRegistryABI,
        functionName: 'grantRole',
        args: [roleHash as `0x${string}`, targetAddress as `0x${string}`],
      });
    } catch (error: any) {
      console.error(error);
      alert(`Gagal memulai transaksi blockchain: ${error.message || error}`);
      setSelectedAccount(null);
      setActiveGeneration(null);
    }
  };

  const handleFinalizeApproval = async (userId: string) => {
    // 2. Transaksi blockchain sukses, update database off-chain
    try {
      const updates: Partial<DBProfile> = { verification_status: 'APPROVED' };
      if (activeGeneration) {
        updates.wallet_address = activeGeneration.address;
        updates.private_key = activeGeneration.privateKey;
      }
      
      const { error } = await updateProfile(userId, updates);
      
      if (error) {
        console.error("Supabase Update Error:", error);
        alert('Blockchain sukses, tapi GAGAL update database: ' + error.message);
        return;
      }

      if (activeGeneration && selectedAccount) {
        // Kirim email
        try {
          await fetch('/api/send-wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: selectedAccount.email,
              name: selectedAccount.full_name || selectedAccount.email,
              address: activeGeneration.address,
              privateKey: activeGeneration.privateKey,
            }),
          });
        } catch (emailErr) {
          console.error('Failed to send email', emailErr);
        }

        setGeneratedKeys({
          address: activeGeneration.address,
          email: selectedAccount.email,
          name: selectedAccount.full_name || selectedAccount.email
        });
      } else {
        alert('Berhasil! Role telah ditambahkan di Blockchain dan Database diperbarui.');
      }
      
      setSelectedAccount(null);
      setActiveGeneration(null);
      fetchPending(); // Refresh tabel
    } catch (error: any) {
      console.error("Gagal update profil:", error);
      alert('Terjadi kesalahan sistem: ' + (error.message || "Unknown error"));
    }
  };

  const handleReject = async (userId: string) => {
    if (confirm('Yakin ingin menolak pendaftaran pengguna ini?')) {
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
    <div className="relative">
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
                      <p>Tidak ada pengguna yang menunggu verifikasi.</p>
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
                        acc.role === 'UMUM' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {acc.role}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-mono text-xs text-moss-700 bg-moss-100/50 px-2 py-1 rounded-lg truncate max-w-[150px]">
                        {acc.wallet_address || "Belum Dibuat (Otomatis)"}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      {acc.role === 'UMUM' ? (
                        <span className="text-xs text-moss-400 italic">Masyarakat Umum (KTP terverifikasi)</span>
                      ) : (
                        <a 
                          href={formatIpfsUrl(acc.evidence_url)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-olive-600 hover:text-olive-700 font-bold text-xs bg-olive-50 px-3 py-2 rounded-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          Lihat SK/KTA
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {selectedAccount?.id === acc.id && (isPending || isConfirming || acc.role === 'UMUM') ? (
                        <span className="inline-flex items-center gap-2 text-moss-600 font-bold text-xs bg-moss-100 px-4 py-2 rounded-xl animate-pulse">
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          {acc.role === 'UMUM' ? 'Membuat Wallet...' : isPending ? 'Konfirmasi Wallet...' : 'Menulis ke Blockchain...'}
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
                            {acc.role === 'UMUM' ? 'Approve & Create Wallet' : 'Approve (On-Chain)'}
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

      {/* Modal Tampilan Wallet Baru (Email Sent) */}
      {generatedKeys && (
        <div className="fixed inset-0 bg-moss-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] border border-moss-100 shadow-2xl p-8 max-w-lg w-full relative"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-50 rounded-2xl border border-green-100 text-green-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Akun Sukses Diterima!</h3>
                <p className="text-xs text-moss-500 font-medium">Pengguna: {generatedKeys.name}</p>
              </div>
            </div>

            <div className="p-5 bg-moss-50 border border-moss-100 rounded-xl mb-6 text-center">
              <svg className="w-12 h-12 text-moss-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <h4 className="font-bold text-moss-800 mb-1">Informasi Terkirim</h4>
              <p className="text-sm text-moss-600">
                Wallet Address dan Private Key telah berhasil dikirimkan secara rahasia ke email pengguna:<br/>
                <strong className="text-moss-800">{generatedKeys.email}</strong>
              </p>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <p className="text-[10px] text-orange-700 font-bold leading-relaxed">
                  Demi alasan keamanan, Private Key pengguna tidak ditampilkan di layar ini. Pengguna dapat langsung mengimpor dompet mereka dari informasi yang ada di email.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setGeneratedKeys(null)}
              className="w-full py-3 bg-moss-800 hover:bg-moss-900 text-white font-bold rounded-xl text-sm transition-colors mt-6 shadow-md"
            >
              Kembali
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
