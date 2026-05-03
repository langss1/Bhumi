'use client';

import React, { useState } from 'react';
import { useReadContract, useWriteContract } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';
import { motion, AnimatePresence } from 'framer-motion';

interface RequestRowProps {
  requestId: number;
}

function RequestRow({ requestId }: RequestRowProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { data: request, isLoading } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getRequestDetails',
    args: [BigInt(requestId)],
  });

  const { writeContract, isPending: isActionPending } = useWriteContract();

  if (isLoading) return (
    <tr className="animate-pulse bg-white border-b border-moss-50">
      <td colSpan={5} className="px-6 py-4 text-center text-moss-300">Memuat permintaan...</td>
    </tr>
  );

  if (!request || request.isProcessed || request.isRejected) return null;

  const handleApprove = () => {
    writeContract({
      address: LAND_REGISTRY_ADDRESS,
      abi: LandRegistryABI,
      functionName: 'approveLandRequest',
      args: [BigInt(requestId)],
    });
  };

  const handleReject = () => {
    writeContract({
      address: LAND_REGISTRY_ADDRESS,
      abi: LandRegistryABI,
      functionName: 'rejectLandRequest',
      args: [BigInt(requestId)],
    });
  };

  return (
    <>
      <tr className="bg-white hover:bg-moss-50/50 transition-colors border-b border-moss-50">
        <td className="px-6 py-4 font-mono text-xs font-bold text-moss-900">REQ-{requestId}</td>
        <td className="px-6 py-4">
          <span className="text-xs font-bold text-moss-800">{request.nib}</span>
          <div className="text-[10px] text-moss-500 mt-0.5 font-mono truncate max-w-[150px]">{request.to}</div>
        </td>
        <td className="px-6 py-4">
          <span className="text-xs font-medium text-moss-700">{request.area.toString()} m²</span>
        </td>
        <td className="px-6 py-4 text-center">
          <button 
            onClick={() => setShowDetails(true)}
            className="text-[10px] font-black text-olive-600 hover:text-olive-700 uppercase tracking-wider underline"
          >
            Lihat Detail
          </button>
        </td>
        <td className="px-6 py-4">
          <div className="flex gap-2 justify-end">
            <button 
              onClick={handleApprove}
              disabled={isActionPending}
              className="bg-moss-700 text-white text-[10px] font-black px-4 py-2 rounded-lg hover:bg-moss-800 transition-all disabled:opacity-50"
            >
              Approve
            </button>
            <button 
              onClick={handleReject}
              disabled={isActionPending}
              className="bg-white text-red-600 border border-red-100 text-[10px] font-black px-4 py-2 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </td>
      </tr>

      <AnimatePresence>
        {showDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-moss-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowDetails(false)}
                className="absolute top-8 right-8 text-moss-400 hover:text-moss-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <h3 className="text-2xl font-black text-moss-900 mb-2">Detail Pendaftaran Tanah</h3>
              <p className="text-moss-500 mb-8 text-sm">Verifikasi data fisik dan yuridis sebelum dicetak ke Blockchain.</p>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="bg-moss-50/50 p-6 rounded-2xl border border-moss-100">
                  <div className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">NIB</div>
                  <div className="font-bold text-moss-900">{request.nib}</div>
                </div>
                <div className="bg-moss-50/50 p-6 rounded-2xl border border-moss-100">
                  <div className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">Luas Lahan</div>
                  <div className="font-bold text-moss-900">{request.area.toString()} m²</div>
                </div>
                <div className="bg-moss-50/50 p-6 rounded-2xl border border-moss-100 col-span-2">
                  <div className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">Koordinat GPS</div>
                  <div className="font-mono text-sm text-moss-900 font-bold">{request.gpsCoordinates}</div>
                </div>
                <div className="bg-moss-50/50 p-6 rounded-2xl border border-moss-100 col-span-2">
                  <div className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">Wallet Pemilik</div>
                  <div className="font-mono text-xs text-moss-600 break-all">{request.to}</div>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <h4 className="text-sm font-black text-moss-900 uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-4 h-4 text-olive-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Dokumen Pendukung (IPFS)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <a 
                    href={`https://gateway.pinata.cloud/ipfs/${request.ipfsHashes[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white border border-moss-200 rounded-xl hover:border-olive-500 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 bg-moss-50 rounded-lg flex items-center justify-center text-moss-400 group-hover:text-olive-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-moss-900">Warkah / PDF</div>
                      <div className="text-[10px] text-moss-400 font-mono">Buka di IPFS</div>
                    </div>
                  </a>
                  <a 
                    href={`https://gateway.pinata.cloud/ipfs/${request.ipfsHashes[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white border border-moss-200 rounded-xl hover:border-olive-500 hover:shadow-md transition-all group"
                  >
                    <div className="w-10 h-10 bg-moss-50 rounded-lg flex items-center justify-center text-moss-400 group-hover:text-olive-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-moss-900">Foto Batas</div>
                      <div className="text-[10px] text-moss-400 font-mono">Buka di IPFS</div>
                    </div>
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => { handleApprove(); setShowDetails(false); }}
                  disabled={isActionPending}
                  className="flex-1 py-4 bg-moss-900 text-white font-bold rounded-2xl hover:bg-moss-950 transition-all shadow-xl shadow-moss-200"
                >
                  Approve & Mint NFT
                </button>
                <button 
                  onClick={() => { handleReject(); setShowDetails(false); }}
                  disabled={isActionPending}
                  className="flex-1 py-4 bg-white text-red-600 border-2 border-red-100 font-bold rounded-2xl hover:bg-red-50 transition-all"
                >
                  Reject Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function PendingLandRequests() {
  const { data: totalRequests, isLoading: isCountLoading } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getTotalRequests',
    query: {
      refetchInterval: 5000,
    }
  });

  if (isCountLoading) return <div className="p-10 text-center text-moss-500">Memuat permintaan pendaftaran...</div>;

  const total = Number(totalRequests || 0);

  if (total === 0) return (
    <div className="p-20 text-center bg-moss-50/50 rounded-[2.5rem] border-2 border-dashed border-moss-200">
      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-moss-100">
        <svg className="w-10 h-10 text-moss-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
      </div>
      <h4 className="text-xl font-bold text-moss-900 mb-2">Tidak ada permintaan pending</h4>
      <p className="text-moss-400">Seluruh pendaftaran dari kantor wilayah telah diproses.</p>
    </div>
  );

  return (
    <div className="bg-white border border-moss-100 rounded-[2.5rem] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-[#F9FAF8] border-b border-moss-100">
            <tr>
              <th className="px-6 py-5 text-[11px] font-black text-moss-400 uppercase tracking-widest">Request ID</th>
              <th className="px-6 py-5 text-[11px] font-black text-moss-400 uppercase tracking-widest">NIB & Pemilik</th>
              <th className="px-6 py-5 text-[11px] font-black text-moss-400 uppercase tracking-widest">Luas</th>
              <th className="px-6 py-5 text-[11px] font-black text-moss-400 uppercase tracking-widest text-center">Dokumen</th>
              <th className="px-6 py-5 text-[11px] font-black text-moss-400 uppercase tracking-widest text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(total)].map((_, i) => (
              <RequestRow key={i} requestId={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
