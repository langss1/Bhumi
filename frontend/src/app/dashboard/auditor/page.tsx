'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadContract } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';
import LandLedger from '@/components/LandLedger';

// ─── Komponen Detail Token (Provenance) ────────────────────────────────────────
function TokenProvenance({ tokenId }: { tokenId: number }) {
  const { data: land, isLoading: isLandLoading } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getLandDetails',
    args: [BigInt(tokenId)],
  });

  const { data: history, isLoading: isHistoryLoading } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getOwnershipHistory',
    args: [BigInt(tokenId)],
  });

  const { data: currentOwner } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)],
  });

  const { data: transferReq } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'transferRequests',
    args: [BigInt(tokenId)],
  });

  if (isLandLoading || isHistoryLoading) {
    return (
      <div className="p-10 text-center text-moss-500 animate-pulse">
        Memuat data aset dari blockchain...
      </div>
    );
  }

  if (!land || !land.nib) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100">
        <p className="text-sm font-bold text-red-600">Token #{tokenId} tidak ditemukan di blockchain.</p>
      </div>
    );
  }

  const hasActiveTransfer = transferReq && (transferReq[6] as boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Token */}
      <div className="bg-white border border-moss-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="h-20 bg-gradient-to-r from-moss-900 to-moss-800 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center px-8 gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-olive-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">NFT Token #{tokenId}</p>
              <p className="text-lg font-black text-white">NIB: {land.nib}</p>
            </div>
            <div className="ml-auto flex gap-2">
              {land.isDisputed && (
                <span className="text-[10px] font-black text-red-400 bg-red-900/50 px-3 py-1 rounded-full border border-red-500/30 uppercase">⚠ Sengketa</span>
              )}
              {hasActiveTransfer && (
                <span className="text-[10px] font-black text-amber-400 bg-amber-900/50 px-3 py-1 rounded-full border border-amber-500/30 uppercase">⏳ Transfer Aktif</span>
              )}
            </div>
          </div>
        </div>

        {/* Data Aset */}
        <div className="p-8 grid grid-cols-3 gap-6">
          <div>
            <p className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">Luas Lahan</p>
            <p className="text-xl font-black text-moss-900">{land.area.toString()} <span className="text-sm font-bold text-moss-500">m²</span></p>
          </div>
          <div>
            <p className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">Koordinat GPS</p>
            <p className="text-sm font-bold font-mono text-moss-800">{land.gpsCoordinates}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">Pemilik Saat Ini</p>
            <p className="text-xs font-mono text-moss-700 truncate">{currentOwner as string}</p>
          </div>
        </div>
      </div>

      {/* Ownership Provenance Chain */}
      <div className="bg-white border border-moss-100 rounded-3xl p-8 shadow-sm">
        <h4 className="text-sm font-black text-moss-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <svg className="w-4 h-4 text-olive-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Silsilah Kepemilikan (Provenance Chain)
        </h4>

        {history && history.length > 0 ? (
          <div className="space-y-3">
            {(history as string[]).map((owner, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 ${
                    idx === 0
                      ? 'bg-olive-100 border-olive-400 text-olive-700'
                      : idx === (history as string[]).length - 1
                      ? 'bg-moss-100 border-moss-400 text-moss-700'
                      : 'bg-white border-moss-200 text-moss-500'
                  }`}>
                    {idx + 1}
                  </div>
                  {idx < (history as string[]).length - 1 && (
                    <div className="w-px h-6 bg-moss-200 mt-1"></div>
                  )}
                </div>
                <div className={`flex-1 p-4 rounded-2xl border ${
                  idx === 0
                    ? 'bg-olive-50 border-olive-100'
                    : idx === (history as string[]).length - 1
                    ? 'bg-moss-50 border-moss-200'
                    : 'bg-white border-moss-100'
                }`}>
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-mono text-moss-700 truncate max-w-[300px]">{owner}</p>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      idx === 0
                        ? 'bg-olive-100 text-olive-700'
                        : idx === (history as string[]).length - 1
                        ? 'bg-moss-100 text-moss-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {idx === 0 ? 'Pemilik Pertama' : idx === (history as string[]).length - 1 ? 'Pemilik Sekarang' : `Transfer ke-${idx}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-moss-400 italic">Riwayat kepemilikan tidak tersedia.</p>
        )}
      </div>

      {/* Dokumen IPFS */}
      {land.ipfsHashes?.length > 0 && (
        <div className="bg-white border border-moss-100 rounded-3xl p-8 shadow-sm">
          <h4 className="text-sm font-black text-moss-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-olive-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Dokumen On-Chain (IPFS)
          </h4>
          <div className="flex flex-wrap gap-3">
            {(land.ipfsHashes as string[]).map((hash, idx) => (
              <a
                key={idx}
                href={`https://gateway.pinata.cloud/ipfs/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-moss-50 hover:bg-olive-50 border border-moss-200 hover:border-olive-300 rounded-xl transition-all group"
              >
                <svg className="w-4 h-4 text-moss-400 group-hover:text-olive-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <div>
                  <p className="text-xs font-bold text-moss-800 group-hover:text-olive-700 transition-colors">
                    {idx === 0 ? 'Warkah / Surat Ukur' : idx === 1 ? 'Foto Batas Patok' : `AJB Balik Nama ke-${idx - 1}`}
                  </p>
                  <p className="text-[9px] font-mono text-moss-400 truncate max-w-[150px]">{hash}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Auditor Dashboard ────────────────────────────────────────────────────
export default function AuditorDashboard() {
  const [activeTab, setActiveTab] = useState('ledger');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTokenId, setSearchTokenId] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const { data: totalLands } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getTotalLands',
  });

  const total = Number(totalLands || 0);

  // Saat search by NIB: kita scan semua token dan cocokkan
  const handleSearch = () => {
    const num = parseInt(searchQuery);
    if (!isNaN(num) && num >= 0) {
      // Jika input adalah angka -> treat as token ID
      setSearchTokenId(num);
    } else {
      alert('Masukkan Token ID (angka). Pencarian by NIB akan menampilkan semua token.');
      setSearchTokenId(null);
    }
    setIsSearching(true);
  };

  const tabs = [
    { id: 'ledger', label: '📊 Monitoring Ledger' },
    { id: 'search', label: '🔍 Forensik Silsilah Aset' },
    { id: 'anomaly', label: '⚠️ Deteksi Anomali' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Role Info Banner */}
      <div className="mb-8 p-5 bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-3xl flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 shrink-0">
          <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <div>
          <p className="font-black text-slate-900">Auditor / KPK — Strictly Read-Only</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Hak akses pemantau penuh. Tidak dapat menulis ke blockchain. Dapat melihat seluruh silsilah kepemilikan (provenance), mendeteksi anomali, dan melacak riwayat transaksi.
          </p>
        </div>
        <div className="ml-auto">
          <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 uppercase tracking-widest">
            🔒 Read-Only Mode
          </span>
        </div>
      </div>

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
              <motion.div layoutId="auditorTab" className="absolute bottom-0 left-0 right-0 h-1 bg-slate-600 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {/* ── Tab 1: Master Ledger ── */}
          {activeTab === 'ledger' && (
            <motion.div key="ledger" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-moss-900">Ledger Pertanahan Nasional</h3>
                <p className="text-sm text-moss-500 mt-2">
                  Semua NFT Sertifikat Tanah yang tersegel di blockchain. Total: <strong>{total} aset</strong> terdaftar.
                </p>
              </div>
              <LandLedger />
            </motion.div>
          )}

          {/* ── Tab 2: Forensik Silsilah ── */}
          {activeTab === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-moss-900">Forensik Silsilah Aset</h3>
                <p className="text-sm text-moss-500 mt-2">
                  Lacak provenance lengkap: "Tanah ini dicetak → dimiliki oleh → dipindahtangankan ke..." secara immutable.
                </p>
              </div>

              <div className="bg-white border border-moss-100 p-8 rounded-[2rem] shadow-sm mb-8">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[11px] font-black text-moss-400 uppercase tracking-widest mb-2">Token ID</label>
                    <input
                      type="number"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Masukkan Token ID (0, 1, 2, ...)"
                      className="w-full p-4 bg-[#F9FAF8] border border-moss-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-slate-500 transition-all"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleSearch}
                      className="px-10 py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all text-sm"
                    >
                      🔍 Lacak
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-moss-400 mt-3">
                  Tip: Total {total} token telah terdaftar (ID: 0 sampai {total - 1})
                </p>
              </div>

              {isSearching && searchTokenId !== null && (
                <TokenProvenance tokenId={searchTokenId} />
              )}
            </motion.div>
          )}

          {/* ── Tab 3: Deteksi Anomali ── */}
          {activeTab === 'anomaly' && (
            <motion.div key="anomaly" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-moss-900">Deteksi Anomali & Sengketa</h3>
                <p className="text-sm text-moss-500 mt-2">
                  Pantau semua aset yang berada dalam status sengketa atau memiliki transfer mencurigakan.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scan disputed assets */}
                {[...Array(total)].map((_, i) => (
                  <DisputedAssetChecker key={i} tokenId={i} />
                ))}
                {total === 0 && (
                  <div className="col-span-2 p-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <p className="text-moss-500 font-bold">Tidak ada aset yang perlu dipantau.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Komponen cek sengketa per aset ───────────────────────────────────────────
function DisputedAssetChecker({ tokenId }: { tokenId: number }) {
  const { data: land } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getLandDetails',
    args: [BigInt(tokenId)],
  });

  const { data: transferReq } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'transferRequests',
    args: [BigInt(tokenId)],
  });

  if (!land || !land.nib) return null;

  const isDisputed = land.isDisputed;
  const hasActiveTransfer = transferReq && (transferReq[6] as boolean);

  // Hanya tampilkan yang bermasalah
  if (!isDisputed && !hasActiveTransfer) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`p-6 rounded-3xl border-2 ${isDisputed ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-black text-moss-400 uppercase tracking-widest">Token #{tokenId}</p>
          <p className="font-black text-moss-900">NIB: {land.nib}</p>
        </div>
        {isDisputed && (
          <span className="text-[10px] font-black text-red-700 bg-red-100 px-3 py-1.5 rounded-full border border-red-200 uppercase">⚠ Sengketa Aktif</span>
        )}
        {hasActiveTransfer && !isDisputed && (
          <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200 uppercase">⏳ Transfer Berjalan</span>
        )}
      </div>
      <p className="text-xs text-moss-600">Luas: {land.area.toString()} m² | GPS: {land.gpsCoordinates}</p>
    </motion.div>
  );
}
