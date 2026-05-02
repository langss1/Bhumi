'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadContract, useWriteContract } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';
import { uploadToIPFS } from '@/lib/pinata';

function TransferRequestRow({ tokenId }: { tokenId: number }) {
  const { data: request, isLoading } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'transferRequests',
    args: [BigInt(tokenId)],
  });

  const [ajbFile, setAjbFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { writeContract: writeApprove, isPending: isApprovePending } = useWriteContract();

  if (isLoading || !request || !request[6]) return null; // request[6] is isActive

  const handleApprove = async () => {
    if (!ajbFile) return alert("Harap unggah Akta Jual Beli (AJB) terlebih dahulu!");
    
    try {
      setIsUploading(true);
      const hash = await uploadToIPFS(ajbFile);
      setIsUploading(false);

      writeApprove({
        address: LAND_REGISTRY_ADDRESS,
        abi: LandRegistryABI,
        functionName: 'approveTransferNotaris',
        args: [BigInt(tokenId), hash],
      });
    } catch (e) {
      alert("Gagal mengunggah AJB ke IPFS");
      setIsUploading(false);
    }
  };

  return (
    <tr className="bg-white hover:bg-moss-50/50 transition-colors border-b border-moss-50">
      <td className="px-6 py-6 font-black text-xl text-moss-900">#{tokenId}</td>
      <td className="px-6 py-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-moss-400 font-bold uppercase w-12">Seller</span>
            <span className="text-xs font-mono bg-moss-50 px-2 py-1 rounded border border-moss-100">{request[0] as string}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-moss-400 font-bold uppercase w-12">Buyer</span>
            <span className="text-xs font-mono bg-moss-100 px-2 py-1 rounded border border-moss-200">{request[1] as string}</span>
          </div>
          <div className="flex gap-2 mt-1">
            {request[3] && <span className="text-[9px] font-black text-olive-600 bg-olive-50 px-2 py-0.5 rounded uppercase">Seller OK</span>}
            {request[4] && <span className="text-[9px] font-black text-olive-600 bg-olive-50 px-2 py-0.5 rounded uppercase">Buyer OK</span>}
          </div>
        </div>
      </td>
      <td className="px-6 py-6">
        <label className="border-2 border-dashed border-moss-200 rounded-xl p-4 flex flex-col items-center gap-1 cursor-pointer hover:bg-moss-50 transition-all">
          <svg className="w-5 h-5 text-moss-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          <span className="text-[10px] font-bold text-moss-600 truncate max-w-[120px]">{ajbFile ? ajbFile.name : "Upload AJB (PDF)"}</span>
          <input type="file" className="hidden" onChange={(e) => e.target.files && setAjbFile(e.target.files[0])} />
        </label>
      </td>
      <td className="px-6 py-6 text-right">
        <button 
          onClick={handleApprove}
          disabled={!request[3] || !request[4] || isApprovePending || isUploading}
          className="px-5 py-3 bg-moss-900 text-white text-[11px] font-black rounded-xl hover:bg-moss-800 disabled:opacity-30 transition-all"
        >
          {isUploading ? 'Uploading AJB...' : isApprovePending ? 'Signing...' : 'Sign & Execute'}
        </button>
      </td>
    </tr>
  );
}

export default function NotarisDashboard() {
  const [activeTab, setActiveTab] = useState('pending');

  const { data: totalLands } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getTotalLands',
  });

  const total = Number(totalLands || 0);

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-4 mb-10 border-b border-moss-100 pb-px">
        {['pending', 'history'].map((id) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`relative px-6 py-4 text-sm font-bold capitalize transition-colors ${activeTab === id ? 'text-moss-900' : 'text-moss-400 hover:text-moss-700'}`}>
            {id === 'pending' ? 'Antrean Otorisasi' : 'Riwayat Transaksi'}
            {activeTab === id && <motion.div layoutId="notarisTab" className="absolute bottom-0 left-0 right-0 h-1 bg-olive-500 rounded-t-full" />}
          </button>
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'pending' && (
            <motion.div key="pending" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-moss-100 rounded-[2rem] shadow-sm overflow-hidden">
              <div className="px-10 py-8 border-b border-moss-50 bg-[#F9FAF8]">
                <h3 className="text-xl font-black text-moss-900">Antrean Transfer (Multi-Sig)</h3>
                <p className="text-sm text-moss-500 mt-1">Gunakan peran Notaris Anda untuk mensahkan AJB secara on-chain.</p>
              </div>
              <div className="p-6 overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">ID NFT</th>
                      <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">Pihak Jual Beli</th>
                      <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest text-center">Dokumen AJB</th>
                      <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {total === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-10 text-center text-moss-400">Tidak ada antrean transfer aktif</td></tr>
                    ) : (
                      [...Array(total)].map((_, i) => <TransferRequestRow key={i} tokenId={i} />)
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
