'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';

// ─── Kartu Aset NFT Milik User ─────────────────────────────────────────────────
function AssetCard({ tokenId }: { tokenId: number }) {
  const { address } = useAccount();
  const { data: land } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getLandDetails',
    args: [BigInt(tokenId)],
  });

  const { data: owner } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)],
  });

  const { data: history } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getOwnershipHistory',
    args: [BigInt(tokenId)],
  });

  const { data: transferReq } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'transferRequests',
    args: [BigInt(tokenId)],
  });

  const { writeContract: proposeTransfer, isPending: isProposing } = useWriteContract();
  const [buyerAddress, setBuyerAddress] = useState('');
  const [showSellForm, setShowSellForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Hanya tampilkan jika milik user ini
  if (!land || owner?.toLowerCase() !== address?.toLowerCase()) return null;

  // transferReq tuple: [seller, buyer, notaris, sellerApproved, buyerApproved, notarisApproved, isActive]
  const hasActiveTransfer = transferReq && (transferReq[6] as boolean);

  const handlePropose = () => {
    if (!buyerAddress || !buyerAddress.startsWith('0x')) {
      return alert('Masukkan alamat dompet pembeli yang valid (0x...)!');
    }
    proposeTransfer({
      address: LAND_REGISTRY_ADDRESS,
      abi: LandRegistryABI,
      functionName: 'proposeTransfer',
      args: [BigInt(tokenId), buyerAddress as `0x${string}`],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-moss-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all group"
    >
      {/* NFT Header Visual */}
      <div className="h-28 bg-gradient-to-br from-moss-800 to-moss-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-olive-500 rounded-full blur-[60px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-moss-400 rounded-full blur-[50px] opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute inset-0 flex items-center px-6 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-olive-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Sertifikat NFT</p>
            <p className="text-xl font-black text-white">Token #{tokenId}</p>
          </div>
          {land.isDisputed && (
            <div className="ml-auto">
              <span className="text-[10px] font-black text-red-400 bg-red-900/50 px-3 py-1.5 rounded-full border border-red-500/30 uppercase">⚠ Sengketa</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3 mb-5">
          <div>
            <p className="text-[10px] text-moss-400 font-black uppercase tracking-widest">NIB Sertifikat</p>
            <p className="text-lg font-black text-moss-900">{land.nib}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-moss-50 rounded-xl p-3 border border-moss-100">
              <p className="text-[9px] text-moss-400 font-black uppercase tracking-widest mb-0.5">Luas</p>
              <p className="text-sm font-bold text-moss-800">{land.area.toString()} m²</p>
            </div>
            <div className="bg-moss-50 rounded-xl p-3 border border-moss-100">
              <p className="text-[9px] text-moss-400 font-black uppercase tracking-widest mb-0.5">GPS</p>
              <p className="text-xs font-mono text-moss-800 truncate">{land.gpsCoordinates}</p>
            </div>
          </div>

          {history && history.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-olive-600 bg-olive-50 px-2.5 py-1 rounded-full border border-olive-100">
                {history.length} Pemilik Sebelumnya
              </span>
            </div>
          )}
        </div>

        {/* Dokumen IPFS */}
        {land.ipfsHashes?.length > 0 && (
          <div className="mb-5 flex gap-2 flex-wrap">
            {land.ipfsHashes.map((hash: string, idx: number) => (
              <a
                key={idx}
                href={`https://gateway.pinata.cloud/ipfs/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-olive-600 bg-olive-50 hover:bg-olive-100 px-3 py-1.5 rounded-lg border border-olive-100 transition-colors"
              >
                📄 {idx === 0 ? 'Warkah' : idx === 1 ? 'Foto Patok' : `AJB-${idx - 1}`}
              </a>
            ))}
          </div>
        )}

        {/* Action Area */}
        {land.isDisputed ? (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-center">
            <p className="text-sm font-bold text-red-600">🚫 Tanah dalam status sengketa.</p>
            <p className="text-xs text-red-400 mt-1">Transfer diblokir oleh BPN Pusat.</p>
          </div>
        ) : hasActiveTransfer ? (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <p className="text-xs font-black text-amber-700 mb-1">⏳ Transfer Sedang Berlangsung</p>
            <p className="text-[10px] font-mono text-amber-600 truncate">Kepada: {transferReq[1] as string}</p>
            <p className="text-[10px] text-amber-500 mt-1">Menunggu konfirmasi pembeli & notaris...</p>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setShowSellForm(!showSellForm)}
              className="w-full py-3 bg-moss-900 hover:bg-moss-800 text-white text-xs font-black rounded-2xl transition-colors uppercase tracking-wide"
            >
              Ajukan Jual Beli (Propose Transfer)
            </button>

            <AnimatePresence>
              {showSellForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-moss-100 space-y-3">
                    <input
                      type="text"
                      value={buyerAddress}
                      onChange={(e) => setBuyerAddress(e.target.value)}
                      placeholder="Alamat Dompet Pembeli (0x...)"
                      className="w-full p-3 bg-moss-50 border border-moss-200 rounded-xl text-[11px] font-mono focus:ring-2 focus:ring-olive-500"
                    />
                    <button
                      onClick={handlePropose}
                      disabled={isProposing}
                      className="w-full py-3 bg-olive-500 hover:bg-olive-600 text-white text-[11px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-olive-500/20 transition-all disabled:opacity-50"
                    >
                      {isProposing ? 'Memproses...' : '✍️ Kirim Proposal Jual Beli'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Komponen Konfirmasi Pembelian (Sebagai Buyer) ─────────────────────────────
function BuyerApprovalPanel() {
  const [tokenIdInput, setTokenIdInput] = useState('');
  const [checkedId, setCheckedId] = useState<number | null>(null);

  const { data: transferReq } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'transferRequests',
    args: [checkedId !== null ? BigInt(checkedId) : BigInt(0)],
    query: { enabled: checkedId !== null },
  });

  const { data: land } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getLandDetails',
    args: [checkedId !== null ? BigInt(checkedId) : BigInt(0)],
    query: { enabled: checkedId !== null },
  });

  const { writeContract: approveBuy, isPending: isApproving } = useWriteContract();
  const { address } = useAccount();

  const handleApprove = () => {
    if (checkedId === null) return;
    approveBuy({
      address: LAND_REGISTRY_ADDRESS,
      abi: LandRegistryABI,
      functionName: 'approveTransferBuyer',
      args: [BigInt(checkedId)],
    });
  };

  const isActive = transferReq && (transferReq[6] as boolean);
  const buyerAddr = transferReq ? (transferReq[1] as string) : '';
  const buyerApproved = transferReq ? (transferReq[4] as boolean) : false;
  const isMyTransfer = address && buyerAddr.toLowerCase() === address.toLowerCase();

  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-moss-100 p-10 rounded-[2rem] shadow-sm">
        <h3 className="text-2xl font-black text-moss-900 mb-2">Konfirmasi Pembelian</h3>
        <p className="text-sm text-moss-500 mb-8 leading-relaxed">
          Jika seseorang mengajukan <strong>proposal jual beli</strong> tanah kepada Anda, masukkan ID Token-nya di bawah untuk melihat detail dan menyetujuinya. Setelah Anda setuju, transaksi diteruskan ke Notaris untuk pengesahan final.
        </p>

        <div className="flex gap-4 mb-8">
          <input
            type="number"
            value={tokenIdInput}
            onChange={(e) => setTokenIdInput(e.target.value)}
            placeholder="Masukkan ID Token (misal: 0, 1, 2...)"
            className="flex-1 p-4 bg-[#F9FAF8] border border-moss-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-olive-500"
          />
          <button
            onClick={() => setCheckedId(Number(tokenIdInput))}
            className="px-8 bg-moss-900 text-white font-bold rounded-xl hover:bg-moss-800 transition-all"
          >
            Periksa
          </button>
        </div>

        {checkedId !== null && (
          <AnimatePresence>
            {isActive && isMyTransfer ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-moss-50 rounded-2xl p-6 border border-moss-200 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-moss-400 uppercase tracking-widest">NFT Token #{checkedId}</p>
                    {land && <p className="text-lg font-black text-moss-900 mt-0.5">NIB: {land.nib}</p>}
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase ${buyerApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {buyerApproved ? '✅ Sudah Setuju' : '⏳ Belum Setuju'}
                  </span>
                </div>

                {land && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3 border border-moss-100">
                      <p className="text-[9px] text-moss-400 uppercase tracking-widest font-black">Luas</p>
                      <p className="text-sm font-bold text-moss-800">{land.area.toString()} m²</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-moss-100">
                      <p className="text-[9px] text-moss-400 uppercase tracking-widest font-black">GPS</p>
                      <p className="text-xs font-mono text-moss-800 truncate">{land.gpsCoordinates}</p>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl p-4 border border-moss-100">
                  <p className="text-[10px] text-moss-400 uppercase tracking-widest font-black mb-1">Penjual</p>
                  <p className="text-xs font-mono text-moss-700 truncate">{transferReq[0] as string}</p>
                </div>

                {!buyerApproved ? (
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="w-full py-4 bg-olive-500 hover:bg-olive-600 text-white font-black rounded-2xl shadow-lg shadow-olive-200 transition-all disabled:opacity-50 uppercase tracking-wide"
                  >
                    {isApproving ? 'Memproses...' : '✅ Setuju Beli (Approve Sebagai Pembeli)'}
                  </button>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                    <p className="text-sm font-bold text-emerald-700">✅ Anda sudah menyetujui pembelian ini.</p>
                    <p className="text-xs text-emerald-500 mt-1">Transaksi sekarang menunggu pengesahan dari Notaris/PPAT.</p>
                  </div>
                )}
              </motion.div>
            ) : isActive && !isMyTransfer ? (
              <div className="p-6 bg-red-50 rounded-2xl border border-red-100 text-center">
                <p className="text-sm font-bold text-red-600">🚫 Transfer aktif, namun Anda bukan pembeli yang ditunjuk untuk token ini.</p>
              </div>
            ) : (
              <div className="p-6 bg-moss-50 rounded-2xl border border-moss-200 text-center">
                <p className="text-sm font-bold text-moss-600">ℹ️ Tidak ada transfer aktif untuk Token #{checkedId}.</p>
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard User ───────────────────────────────────────────────────────
export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('gallery');
  const { address } = useAccount();

  const { data: totalLands } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getTotalLands',
    query: { refetchInterval: 8000 },
  });

  const total = Number(totalLands || 0);

  const tabs = [
    { id: 'gallery', label: '🏡 Galeri Aset Saya' },
    { id: 'transfer', label: '🤝 Konfirmasi Pembelian' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Role Banner */}
      <div className="mb-8 p-5 bg-gradient-to-r from-moss-50 to-olive-50 border border-moss-100 rounded-3xl flex items-center gap-4">
        <div className="w-12 h-12 bg-moss-100 rounded-2xl flex items-center justify-center border border-moss-200 shrink-0">
          <svg className="w-6 h-6 text-moss-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <p className="font-black text-moss-900">Masyarakat Pemilik Tanah</p>
          <p className="text-xs text-moss-500 mt-0.5">Read-Only (lihat aset) + Write terbatas (ajukan/setujui transfer kepemilikan)</p>
        </div>
        {address && (
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-[10px] text-moss-400 uppercase tracking-widest font-bold">Wallet Aktif</p>
            <p className="text-xs font-mono text-moss-700 truncate max-w-[180px]">{address}</p>
          </div>
        )}
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
              <motion.div layoutId="userTab" className="absolute bottom-0 left-0 right-0 h-1 bg-olive-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'gallery' && (
            <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[500px]">
              <div className="mb-10">
                <h3 className="text-2xl font-black text-moss-900">Sertifikat Tanah Digital</h3>
                <p className="text-sm text-moss-500 mt-2">
                  Daftar aset lahan yang terdaftar secara sah atas nama dompet Anda di Blockchain.
                  Setiap kartu adalah NFT ERC-721 yang mewakili sertifikat tanah fisik.
                </p>
              </div>

              {total === 0 ? (
                <div className="border-2 border-dashed border-moss-200 bg-moss-50/50 rounded-3xl p-24 text-center">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-moss-100">
                    <svg className="w-10 h-10 text-moss-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-moss-900 mb-2">Belum ada aset terdaftar</h4>
                  <p className="text-moss-400">Belum ada NFT sertifikat tanah yang terdaftar atas nama dompet ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(total)].map((_, i) => <AssetCard key={i} tokenId={i} />)}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'transfer' && (
            <motion.div key="transfer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <BuyerApprovalPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
