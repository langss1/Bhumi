'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';

// ─── Modal Sertifikat Digital (Template Resmi BPN) ──────────────────────────────
function DigitalCertificate({ land, tokenId, owner, onClose }: { land: any, tokenId: number, owner: string, onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-[#F4F1E1] w-full max-w-[550px] max-h-[90vh] overflow-y-auto shadow-2xl rounded-sm border-[8px] border-white relative print:border-0 custom-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 right-0 p-4 flex justify-end z-10 print:hidden">
          <button onClick={onClose} className="w-8 h-8 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-moss-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 pt-0 text-moss-900">
          {/* Header BPN */}
          <div className="text-center mb-6">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/National_Emblem_of_Indonesia_Garuda_Pancasila.svg/1200px-National_Emblem_of_Indonesia_Garuda_Pancasila.svg.png" className="w-16 mx-auto mb-3" alt="Garuda" />
            <h2 className="text-[11px] font-black leading-tight uppercase tracking-widest">Kementerian Agraria dan Tata Ruang /</h2>
            <h2 className="text-[11px] font-black leading-tight uppercase tracking-widest border-b-2 border-moss-900 inline-block pb-1 mb-3">Badan Pertanahan Nasional</h2>
            <h1 className="text-xl font-black uppercase tracking-[0.2em] mt-3">Sertifikat Tanah Elektronik</h1>
          </div>

          <div className="space-y-5 text-[12px]">
            {/* Metadata Utama */}
            <div className="grid grid-cols-2 border-y border-moss-900/20 py-3">
              <div>
                <p className="font-bold text-moss-500 uppercase tracking-tighter text-[9px]">Jenis Hak</p>
                <p className="text-sm font-black">Hak Milik (HM)</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-moss-500 uppercase tracking-tighter text-[9px]">Nomor Sertifikat (Token ID)</p>
                <p className="text-sm font-mono font-black">#{tokenId.toString().padStart(5, '0')}</p>
              </div>
            </div>

            {/* Data Pemilik */}
            <div className="space-y-2">
              <h3 className="font-black border-b border-moss-900/10 pb-1 uppercase tracking-wider text-moss-500 text-[10px]">Data Subjek Hukum (Pemilik Tanah)</h3>
              <div className="grid grid-cols-[90px_1fr] gap-2">
                <span className="font-bold text-moss-600">Alamat Wallet</span>
                <span className="font-mono break-all text-[11px]">{owner}</span>
              </div>
              <div className="grid grid-cols-[90px_1fr] gap-2">
                <span className="font-bold text-moss-600">Status</span>
                <span className="font-bold text-emerald-700">Terverifikasi di Blockchain</span>
              </div>
            </div>

            {/* Data Objek */}
            <div className="space-y-2 pt-1">
              <h3 className="font-black border-b border-moss-900/10 pb-1 uppercase tracking-wider text-moss-500 text-[10px]">Data Objek Tanah</h3>
              <div className="grid grid-cols-[90px_1fr] gap-y-1.5">
                <span className="font-bold text-moss-600">Nomor NIB</span>
                <span className="font-black text-sm">{land.nib}</span>
                
                <span className="font-bold text-moss-600">Luas</span>
                <span className="font-bold">{land.area.toString()} m²</span>
                
                <span className="font-bold text-moss-600">Koordinat GPS</span>
                <span className="font-mono">{land.gpsCoordinates}</span>
              </div>
            </div>

            {/* Footer Sertifikat */}
            <div className="pt-6 flex justify-between items-end border-t border-moss-900/10">
              <div className="text-[9px] space-y-1 max-w-[250px]">
                <p className="font-bold">Diterbitkan Secara Elektronik oleh:</p>
                <p className="font-black text-moss-900 uppercase">Sistem Pertanahan Bhumi (Besu IBFT 2.0)</p>
                <p className="text-moss-500 italic">Dokumen ini merupakan salinan sah yang tersimpan di buku besar blockchain BPN.</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-white p-1.5 border border-moss-200 mb-1 mx-auto">
                  {/* Placeholder QR */}
                  <div className="w-full h-full bg-moss-900 flex items-center justify-center p-1.5 text-white">
                    <svg fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 3h2v2h-2v-2zm3-3h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2z" /></svg>
                  </div>
                </div>
                <p className="text-[8px] font-black uppercase tracking-widest">QR Code Autentikasi</p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-center print:hidden">
            <button onClick={() => window.print()} className="px-8 py-3 bg-moss-900 text-white text-xs font-black rounded-xl shadow-lg hover:bg-moss-800 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              CETAK SERTIFIKAT PDF
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Kartu Aset NFT Milik User ─────────────────────────────────────────────────
function AssetCard({ tokenId }: { tokenId: number }) {
  const { address } = useAccount();
  const [showCertificate, setShowCertificate] = useState(false);
  
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

  // Hanya tampilkan jika milik user ini
  if (!land || owner?.toLowerCase() !== address?.toLowerCase()) return null;

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
    <>
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
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3 mb-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-moss-400 font-black uppercase tracking-widest">NIB Sertifikat</p>
                <p className="text-lg font-black text-moss-900">{land.nib}</p>
              </div>
              <button 
                onClick={() => setShowCertificate(true)}
                className="bg-olive-50 text-olive-700 p-2 rounded-xl border border-olive-100 hover:bg-olive-100 transition-all shadow-sm"
                title="Lihat Sertifikat Resmi"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </button>
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
          </div>

          {/* Action Area */}
          {hasActiveTransfer ? (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-xs font-black text-amber-700 mb-1 text-center italic">⏳ Transfer Sedang Berlangsung</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowSellForm(!showSellForm)}
                className="flex-1 py-3 bg-moss-900 hover:bg-moss-800 text-white text-[11px] font-black rounded-xl transition-colors uppercase tracking-wide"
              >
                Ajukan Jual Beli
              </button>
            </div>
          )}

          <AnimatePresence>
            {showSellForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-4 pt-4 border-t border-moss-100 space-y-3">
                  <input type="text" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} placeholder="Wallet Pembeli (0x...)" className="w-full p-3 bg-moss-50 border border-moss-200 rounded-xl text-[11px] font-mono" />
                  <button onClick={handlePropose} disabled={isProposing} className="w-full py-3 bg-olive-500 text-white text-[11px] font-black rounded-xl uppercase tracking-widest">
                    {isProposing ? 'Memproses...' : 'Kirim Proposal'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Modal Sertifikat */}
      <AnimatePresence>
        {showCertificate && (
          <DigitalCertificate 
            land={land} 
            tokenId={tokenId} 
            owner={owner || ''} 
            onClose={() => setShowCertificate(false)} 
          />
        )}
      </AnimatePresence>
    </>
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

  const { data: landData } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getLandDetails',
    args: [checkedId !== null ? BigInt(checkedId) : BigInt(0)],
    query: { enabled: checkedId !== null },
  });

  const land = landData ? {
    gpsCoordinates: (landData as any)[0],
    area: (landData as any)[1],
    nib: (landData as any)[2],
    ipfsHashes: (landData as any)[3],
    isDisputed: (landData as any)[4],
  } : null;

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

// ─── Komponen Pelacakan Status Pendaftaran ─────────────────────────────────────
function RequestStatusCard({ requestId }: { requestId: number }) {
  const { data: requestData } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getRequestDetails',
    args: [BigInt(requestId)],
  });

  const request = requestData ? {
    to: (requestData as any)[0],
    nib: (requestData as any)[1],
    area: (requestData as any)[2],
    gpsCoordinates: (requestData as any)[3],
    isProcessed: (requestData as any)[4],
    isRejected: (requestData as any)[5],
    ipfsHashes: (requestData as any)[6],
  } : null;

  const { address } = useAccount();

  if (!request || request.to.toLowerCase() !== address?.toLowerCase()) return null;

  const isApproved = request.isProcessed;
  const isRejected = request.isRejected;
  const isPending = !isApproved && !isRejected;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white border border-moss-100 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
    >
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
          isApproved ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
          isRejected ? 'bg-red-50 border-red-100 text-red-600' : 
          'bg-amber-50 border-amber-100 text-amber-600'
        }`}>
          {isApproved ? (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          ) : isRejected ? (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-7 h-7 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-moss-400 uppercase tracking-widest">Request #{requestId}</span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${
              isApproved ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
              isRejected ? 'bg-red-100 text-red-700 border-red-200' :
              'bg-amber-100 text-amber-700 border-amber-200'
            }`}>
              {isApproved ? 'Disetujui' : isRejected ? 'Ditolak' : 'Proses Verifikasi'}
            </span>
          </div>
          <h4 className="text-base font-black text-moss-900">Pendaftaran Tanah NIB: {request.nib}</h4>
          <p className="text-xs text-moss-500 mt-0.5">Luas: {request.area.toString()} m² • GPS: {request.gpsCoordinates}</p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <p className="text-[10px] font-bold text-moss-400 uppercase tracking-wider">Update Terakhir</p>
        <p className="text-xs font-medium text-moss-700 bg-moss-50 px-3 py-1.5 rounded-lg border border-moss-100 italic">
          {isApproved ? 'Sertifikat telah dicetak ke Blockchain' : 
           isRejected ? 'Berkas ditolak oleh BPN Pusat' : 
           'Menunggu validasi BPN Pusat'}
        </p>
      </div>
    </motion.div>
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
    query: { refetchInterval: 5000 },
  });

  const { data: totalRequests } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getTotalRequests',
    query: { refetchInterval: 5000 },
  });

  const total = Number(totalLands || 0);
  const totalReq = Number(totalRequests || 0);

  const tabs = [
    { id: 'gallery', label: '🏡 Galeri Aset Saya' },
    { id: 'tracking', label: '⏳ Pelacakan Status' },
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
          <p className="text-xs text-moss-500 mt-0.5">Kelola aset tanah digital Anda secara langsung dan aman</p>
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

          {activeTab === 'tracking' && (
            <motion.div key="tracking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="mb-10">
                <h3 className="text-2xl font-black text-moss-900">Pelacakan Status Berkas</h3>
                <p className="text-sm text-moss-500 mt-2">
                  Pantau status verifikasi pendaftaran tanah Anda yang diajukan oleh BPN Wilayah ke BPN Pusat.
                </p>
              </div>

              {totalReq === 0 ? (
                <div className="p-12 text-center bg-moss-50/50 border border-dashed border-moss-200 rounded-3xl">
                  <p className="text-moss-400 font-bold italic">Belum ada pengajuan pendaftaran untuk dompet ini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...Array(totalReq)].map((_, i) => <RequestStatusCard key={i} requestId={i} />)}
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
