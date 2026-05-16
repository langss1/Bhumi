'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadContract, usePublicClient } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';
import LandLedger from '@/components/LandLedger';

// ─── Tipe data hasil pencarian ────────────────────────────────────────────────
interface LandDetail {
  tokenId: number;
  nib: string;
  gpsCoordinates: string;
  area: bigint;
  ipfsHashes: string[];
  isDisputed: boolean;
  owner: string;
  ownershipHistory: string[];
}

// ─── Komponen cek sengketa per aset ───────────────────────────────────────────
function DisputedAssetChecker({ tokenId }: { tokenId: number }) {
  const { data: landData } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getLandDetails',
    args: [BigInt(tokenId)],
  });

  const land = landData ? {
    gpsCoordinates: (landData as any)[0],
    area: (landData as any)[1],
    nib: (landData as any)[2],
    ipfsHashes: (landData as any)[3],
    isDisputed: (landData as any)[4],
  } : null;

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

// ─── Kartu hasil pencarian ────────────────────────────────────────────────────
function LandResultCard({ land }: { land: LandDetail }) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-[2rem] shadow-sm overflow-hidden ${
        land.isDisputed ? 'border-red-200 border-l-[6px] border-l-red-500' : 'border-moss-100'
      }`}
    >
      {/* Header kartu */}
      <div className="px-10 py-6 border-b border-moss-50 bg-[#F9FAF8] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="bg-moss-100 border border-moss-200 text-moss-900 font-black text-xs px-3 py-1.5 rounded-lg uppercase tracking-wider">
            NFT Token #{land.tokenId}
          </div>
          {land.isDisputed ? (
            <span className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100 uppercase tracking-wider">
              ⚠ Sengketa Aktif
            </span>
          ) : (
            <span className="text-[10px] font-black text-olive-700 bg-olive-50 px-3 py-1 rounded-full border border-olive-100 uppercase tracking-wider">
              ✓ Terverifikasi
            </span>
          )}
        </div>
        <span className="text-[11px] font-bold text-moss-400 uppercase tracking-widest">
          LandRegistry On-Chain
        </span>
      </div>

      {/* Body kartu */}
      <div className="px-10 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div>
          <p className="text-[10px] text-moss-400 font-bold uppercase tracking-widest mb-1">NIB Sertifikat</p>
          <p className="text-lg font-black text-moss-900 font-mono">{land.nib}</p>
        </div>
        <div>
          <p className="text-[10px] text-moss-400 font-bold uppercase tracking-widest mb-1">Koordinat GPS</p>
          <p className="text-sm font-bold text-moss-700 font-mono">{land.gpsCoordinates}</p>
        </div>
        <div>
          <p className="text-[10px] text-moss-400 font-bold uppercase tracking-widest mb-1">Luas Area</p>
          <p className="text-sm font-bold text-moss-700">{land.area.toString()} m²</p>
        </div>
        <div className="lg:col-span-3">
          <p className="text-[10px] text-moss-400 font-bold uppercase tracking-widest mb-1">Pemilik Saat Ini</p>
          <p className="text-sm font-mono text-moss-800 bg-moss-50 border border-moss-100 px-4 py-2 rounded-lg break-all">
            {land.owner}
          </p>
        </div>

        {/* Dokumen IPFS */}
        {land.ipfsHashes.length > 0 && (
          <div className="lg:col-span-3">
            <p className="text-[10px] text-moss-400 font-bold uppercase tracking-widest mb-3">
              Dokumen IPFS ({land.ipfsHashes.length} berkas)
            </p>
            <div className="flex flex-wrap gap-2">
              {land.ipfsHashes.map((hash, idx) => (
                <a
                  key={idx}
                  href={`https://gateway.pinata.cloud/ipfs/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[11px] font-mono bg-olive-50 border border-olive-100 text-olive-700 px-3 py-1.5 rounded-lg hover:bg-olive-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {idx === 0 ? 'Warkah' : idx === 1 ? 'Foto Batas' : `AJB #${idx - 1}`}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Riwayat Kepemilikan */}
      {land.ownershipHistory.length > 0 && (
        <div className="px-10 pb-8">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-[11px] font-bold text-moss-500 uppercase tracking-widest hover:text-moss-800 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Riwayat Kepemilikan ({land.ownershipHistory.length} entri)
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 border border-moss-100 rounded-2xl overflow-hidden">
                  {land.ownershipHistory.map((addr, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-4 px-6 py-4 ${
                        idx < land.ownershipHistory.length - 1 ? 'border-b border-moss-50' : ''
                      } ${idx === land.ownershipHistory.length - 1 ? 'bg-olive-50/50' : 'bg-white'}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          idx === land.ownershipHistory.length - 1
                            ? 'bg-olive-500 text-white'
                            : 'bg-moss-100 text-moss-700'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <p className="text-xs font-mono text-moss-700 break-all">{addr}</p>
                      {idx === land.ownershipHistory.length - 1 && (
                        <span className="text-[9px] font-black text-olive-700 bg-olive-100 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                          Pemilik Kini
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ─── Komponen Pencarian Forensik ──────────────────────────────────────────────
function ForensikSearch() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<LandDetail[]>([]);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const publicClient = usePublicClient();

  const { data: totalLands } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getTotalLands',
  });

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    if (!publicClient) {
      setErrorMsg('Tidak dapat terhubung ke jaringan blockchain.');
      return;
    }

    setIsSearching(true);
    setSearched(false);
    setResults([]);
    setErrorMsg('');

    try {
      const total = Number(totalLands || 0);
      if (total === 0) {
        setSearched(true);
        setIsSearching(false);
        return;
      }

      const found: LandDetail[] = [];

      for (let i = 0; i < total; i++) {
        const isTokenIdMatch = q === String(i);

        const land = await publicClient.readContract({
          address: LAND_REGISTRY_ADDRESS,
          abi: LandRegistryABI,
          functionName: 'getLandDetails',
          args: [BigInt(i)],
        }) as any;

        if (!land) continue;

        const landObj = {
          gpsCoordinates: land[0],
          area: land[1],
          nib: land[2],
          ipfsHashes: land[3],
          isDisputed: land[4]
        };

        const nibMatch = landObj.nib?.toLowerCase().includes(q.toLowerCase());

        if (isTokenIdMatch || nibMatch) {
          const owner = await publicClient.readContract({
            address: LAND_REGISTRY_ADDRESS,
            abi: LandRegistryABI,
            functionName: 'ownerOf',
            args: [BigInt(i)],
          }) as string;

          const history = await publicClient.readContract({
            address: LAND_REGISTRY_ADDRESS,
            abi: LandRegistryABI,
            functionName: 'getOwnershipHistory',
            args: [BigInt(i)],
          }) as string[];

          found.push({
            tokenId: i,
            nib: landObj.nib,
            gpsCoordinates: landObj.gpsCoordinates,
            area: landObj.area,
            ipfsHashes: Array.from(landObj.ipfsHashes || []),
            isDisputed: landObj.isDisputed,
            owner,
            ownershipHistory: Array.from(history || []),
          });
        }
      }

      setResults(found);
    } catch (err: any) {
      setErrorMsg(
        'Gagal menghubungi blockchain: ' + (err.shortMessage || err.message || String(err))
      );
    } finally {
      setIsSearching(false);
      setSearched(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Box */}
      <div className="bg-white border border-moss-100 p-10 rounded-[2rem] shadow-sm">
        <h3 className="text-2xl font-black text-moss-900 mb-2">Pencarian Forensik</h3>
        <p className="text-sm text-moss-500 mb-8">
          Cari berdasarkan <span className="font-bold text-moss-700">NIB</span> atau <span className="font-bold text-moss-700">ID Token NFT</span>. Sistem akan memindai seluruh ledger blockchain ({Number(totalLands || 0)} token).
        </p>
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
            placeholder="Masukkan NIB (contoh: 12345) atau Token ID (contoh: 0)..."
            className="flex-1 p-5 bg-[#F9FAF8] border border-moss-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-olive-500 focus:border-olive-400 outline-none transition-all"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="px-8 bg-moss-900 text-white font-bold rounded-xl hover:bg-moss-800 disabled:opacity-50 transition-all flex items-center gap-3 min-w-[200px] justify-center"
          >
            {isSearching ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Memindai...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Cari di Blockchain
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
            ⚠ {errorMsg}
          </div>
        )}
      </div>

      {/* Scanning progress indicator */}
      {isSearching && (
        <div className="bg-olive-50 border border-olive-100 p-6 rounded-2xl flex items-center gap-4">
          <svg className="animate-spin w-5 h-5 text-olive-600 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <div>
            <p className="text-sm font-bold text-olive-800">
              Memindai {Number(totalLands || 0)} token di Ledger Blockchain...
            </p>
            <p className="text-xs text-olive-600 mt-0.5">
              Membaca data langsung dari node. Mohon tunggu.
            </p>
          </div>
        </div>
      )}

      {/* Hasil pencarian */}
      {searched && !isSearching && (
        <AnimatePresence>
          {results.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-moss-100 p-16 rounded-[2rem] text-center"
            >
              <div className="w-16 h-16 bg-moss-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-moss-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-moss-600 font-bold text-lg">Tidak ditemukan</p>
              <p className="text-moss-400 text-sm mt-1">
                Tidak ada aset dengan NIB atau Token ID <span className="font-mono font-bold">"{query}"</span> di blockchain.
              </p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <p className="text-sm font-bold text-moss-500 px-1">
                Ditemukan <span className="text-olive-700">{results.length}</span> hasil untuk "<span className="font-mono">{query}</span>"
              </p>
              {results.map((land) => (
                <LandResultCard key={land.tokenId} land={land} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Main Auditor Dashboard ────────────────────────────────────────────────────
export default function AuditorDashboard() {
  const [activeTab, setActiveTab] = useState('ledger');

  const { data: totalLands } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getTotalLands',
  });

  const total = Number(totalLands || 0);

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

          {activeTab === 'search' && (
            <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <ForensikSearch />
            </motion.div>
          )}

          {activeTab === 'anomaly' && (
            <motion.div key="anomaly" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-moss-900">Deteksi Anomali & Sengketa</h3>
                <p className="text-sm text-moss-500 mt-2">
                  Pantau semua aset yang berada dalam status sengketa atau memiliki transfer mencurigakan.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
