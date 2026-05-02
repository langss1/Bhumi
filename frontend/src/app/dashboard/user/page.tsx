'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';

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

  const { writeContract: proposeTransfer, isPending: isProposing } = useWriteContract();
  const [buyerAddress, setBuyerAddress] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);

  // request data to check for active transfers
  const { data: request } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'transferRequests',
    args: [BigInt(tokenId)],
  });

  if (!land || owner !== address) return null;

  const handlePropose = () => {
    if (!buyerAddress) return alert("Masukkan alamat dompet pembeli!");
    proposeTransfer({
      address: LAND_REGISTRY_ADDRESS,
      abi: LandRegistryABI,
      functionName: 'proposeTransfer',
      args: [BigInt(tokenId), buyerAddress as `0x${string}`],
    });
  };

  return (
    <div className="bg-white border border-moss-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-moss-50 border border-moss-100 text-moss-900 font-black text-xs px-3 py-1.5 rounded-lg uppercase tracking-wider">NFT Token #{tokenId}</div>
          {land.isDisputed && <span className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100 uppercase">Sengketa</span>}
        </div>
        
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-[10px] text-moss-400 font-bold uppercase tracking-widest">NIB Sertifikat</p>
            <p className="text-lg font-black text-moss-900">{land.nib}</p>
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-[10px] text-moss-400 font-bold uppercase tracking-widest">Luas</p>
              <p className="text-sm font-bold text-moss-700">{land.area.toString()} m²</p>
            </div>
            <div>
              <p className="text-[10px] text-moss-400 font-bold uppercase tracking-widest">Koordinat</p>
              <p className="text-sm font-bold text-moss-700">{land.gpsCoordinates}</p>
            </div>
          </div>
        </div>

        {request && request[6] ? (
          <div className="bg-olive-50 border border-olive-100 p-4 rounded-xl text-center">
            <p className="text-xs font-bold text-olive-700 mb-1">Transfer Aktif</p>
            <p className="text-[10px] font-mono text-olive-600 truncate">Buyer: {request[1] as string}</p>
          </div>
        ) : (
          <button 
            onClick={() => setShowTransfer(!showTransfer)}
            className="w-full py-3 bg-moss-900 text-white text-xs font-bold rounded-xl hover:bg-moss-800 transition-colors"
          >
            Pindahkan Kepemilikan (Jual Beli)
          </button>
        )}

        <AnimatePresence>
          {showTransfer && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-4 pt-4 border-t border-moss-50 space-y-3">
                <input 
                  type="text" 
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  placeholder="Alamat Dompet Pembeli (0x...)" 
                  className="w-full p-3 bg-moss-50 border border-moss-200 rounded-lg text-[11px] font-mono"
                />
                <button onClick={handlePropose} disabled={isProposing} className="w-full py-3 bg-olive-500 text-white text-[11px] font-black rounded-lg hover:bg-olive-600 uppercase tracking-widest shadow-lg shadow-olive-500/20 transition-all">
                  {isProposing ? 'Memproses...' : 'Kirim Proposal Jual Beli'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('gallery');
  const { address } = useAccount();

  const { data: totalLands } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getTotalLands',
  });

  const total = Number(totalLands || 0);

  const tabs = [
    { id: 'gallery', label: 'Galeri Aset Digital Saya' },
    { id: 'transfer', label: 'Konfirmasi Pembelian' }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-4 mb-10 border-b border-moss-100 pb-px">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative px-6 py-4 text-sm font-bold tracking-wide transition-colors ${activeTab === tab.id ? 'text-moss-900' : 'text-moss-400 hover:text-moss-700'}`}>
            {tab.label}
            {activeTab === tab.id && <motion.div layoutId="userTab" className="absolute bottom-0 left-0 right-0 h-1 bg-olive-500 rounded-t-full" />}
          </button>
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'gallery' && (
            <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[500px]">
              <div className="mb-10">
                <h3 className="text-2xl font-black text-moss-900">Sertifikat Tanah Digital</h3>
                <p className="text-sm text-moss-500 mt-2">Daftar aset lahan yang terdaftar secara sah atas nama dompet Anda di Blockchain.</p>
              </div>
              
              {total === 0 ? (
                <div className="border-2 border-dashed border-moss-200 bg-moss-50/50 rounded-3xl p-24 text-center">
                  <p className="text-moss-400 font-bold italic">Belum ada aset terdaftar di jaringan untuk alamat dompet ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(total)].map((_, i) => <AssetCard key={i} tokenId={i} />)}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'transfer' && (
            <motion.div key="transfer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl bg-moss-900 p-12 rounded-[2rem] border border-moss-800 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-80 h-80 bg-olive-500 rounded-full blur-[100px] opacity-10"></div>
               <h3 className="text-2xl font-black mb-6">Konfirmasi Pembelian (Buyer Acceptance)</h3>
               <p className="text-moss-300 text-sm mb-10">Jika seseorang mengirimkan proposal jual beli tanah kepada Anda, Anda harus menyetujuinya di sini agar Notaris dapat mengesahkan transaksi.</p>
               
               <div className="bg-moss-950/50 p-8 rounded-2xl border border-moss-800 space-y-6">
                 <div>
                   <label className="block text-[10px] font-bold text-moss-500 uppercase tracking-widest mb-3">ID Token yang Akan Dibeli</label>
                   <div className="flex gap-4">
                     <input type="text" placeholder="Masukkan ID Token" className="flex-1 p-4 bg-moss-900/50 border border-moss-700 rounded-xl font-mono text-white" />
                     <button className="px-8 bg-olive-500 text-moss-950 font-black rounded-xl hover:bg-olive-400 uppercase text-xs">Approve Pembelian</button>
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
