'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useReadContract } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';

interface RequestHistoryRowProps {
  requestId: number;
}

function RequestHistoryRow({ requestId }: RequestHistoryRowProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { data: requestData, isLoading } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getRequestDetails',
    args: [BigInt(requestId)],
  });

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showDetails) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showDetails]);

  const request = requestData ? {
    to: (requestData as any)[0],
    nib: (requestData as any)[1],
    area: (requestData as any)[2],
    gpsCoordinates: (requestData as any)[3],
    isProcessed: (requestData as any)[4],
    isRejected: (requestData as any)[5],
    ipfsHashes: (requestData as any)[6],
  } : null;

  if (isLoading) return (
    <tr className="animate-pulse bg-white border-b border-moss-50">
      <td colSpan={5} className="px-6 py-4 text-center text-moss-300">Memuat data...</td>
    </tr>
  );

  if (!request) return null;

  let statusText = 'PENDING';
  let statusColor = 'bg-amber-50 text-amber-700 border-amber-100';
  
  if (request.isRejected) {
    statusText = 'DITOLAK';
    statusColor = 'bg-red-50 text-red-700 border-red-100';
  } else if (request.isProcessed) {
    statusText = 'TERVERIFIKASI';
    statusColor = 'bg-olive-50 text-olive-700 border-olive-100';
  }

  return (
    <>
      <tr 
        onClick={() => setShowDetails(true)}
        className="bg-white hover:bg-moss-50/50 transition-colors border-b border-moss-50 cursor-pointer"
      >
        <td className="px-6 py-4 font-mono text-xs font-bold text-moss-900">REQ-{requestId}</td>
        <td className="px-6 py-4 font-mono text-xs text-moss-600 truncate max-w-[120px]">{request.to}</td>
        <td className="px-6 py-4">
          <span className="text-xs font-bold text-moss-800">{request.nib}</span>
          <div className="text-[10px] text-moss-500 mt-0.5">{request.gpsCoordinates}</div>
        </td>
        <td className="px-6 py-4">
          <span className="text-xs font-medium text-moss-700">{request.area.toString()} m²</span>
        </td>
        <td className="px-6 py-4 text-center">
          <span className={`${statusColor} text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-wider`}>
            {statusText}
          </span>
        </td>
      </tr>

      {/* Detail Modal */}
      {showDetails && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-moss-900/60 overflow-y-auto" style={{ backdropFilter: 'blur(4px)' }} onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl relative my-8" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowDetails(false)} className="absolute top-8 right-8 text-moss-400 hover:text-moss-900 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-2xl font-black text-moss-900 font-display uppercase tracking-tight">Detail Permintaan</h3>
              <span className={`${statusColor} text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-wider`}>
                {statusText}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-[#F9FAF8] p-5 rounded-2xl border border-moss-100">
                <div className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">Nomor Identifikasi Bidang (NIB)</div>
                <div className="font-bold text-moss-900">{request.nib}</div>
              </div>
              <div className="bg-[#F9FAF8] p-5 rounded-2xl border border-moss-100">
                <div className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">Luas Lahan Terukur</div>
                <div className="font-bold text-moss-900">{request.area.toString()} m²</div>
              </div>
              <div className="bg-[#F9FAF8] p-5 rounded-2xl border border-moss-100 col-span-2">
                <div className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">Titik Koordinat (Geo-Location)</div>
                <div className="font-mono text-sm text-moss-900 font-bold">{request.gpsCoordinates}</div>
              </div>
              <div className="bg-[#F9FAF8] p-5 rounded-2xl border border-moss-100 col-span-2">
                <div className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">Wallet Pemilik</div>
                <div className="font-mono text-xs text-moss-600 break-all">{request.to}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black text-moss-900 uppercase tracking-widest">Dokumen Tersemat (IPFS)</h4>
              <div className="flex flex-col gap-3">
                {request.ipfsHashes && request.ipfsHashes.map((hash: string, idx: number) => (
                  <a key={idx} href={`https://gateway.pinata.cloud/ipfs/${hash}`} target="_blank" rel="noreferrer" 
                    className="flex items-center justify-between p-4 bg-white border border-moss-200 rounded-xl hover:border-olive-500 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-moss-50 rounded flex items-center justify-center text-moss-400 group-hover:text-olive-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      </div>
                      <span className="text-xs font-bold text-moss-700">{idx === 0 ? 'Warkah / Surat Ukur' : idx === 1 ? 'Foto Batas Bidang' : `Dokumen Tambahan #${idx - 1}`}</span>
                    </div>
                    <span className="text-[10px] font-mono text-moss-300 group-hover:text-olive-400">LIHAT DATA</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default function RegistrationHistory() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: totalRequests, isLoading: isCountLoading } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getTotalRequests',
    query: {
      refetchInterval: 5000,
    }
  });

  if (isCountLoading) return <div className="p-10 text-center text-moss-500">Menghubungkan ke Blockchain...</div>;

  const total = Number(totalRequests || 0);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const itemsOnPage = Math.min(ITEMS_PER_PAGE, total - startIdx);

  if (total === 0) return (
    <div className="p-20 text-center bg-moss-50/50 rounded-3xl border-2 border-dashed border-moss-200">
      <p className="text-moss-400 font-bold">Belum ada riwayat pendaftaran.</p>
    </div>
  );

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-white border border-moss-100 rounded-[2rem] shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-[#F9FAF8] border-b border-moss-100 flex items-center justify-between">
        <span className="text-xs font-bold text-moss-500">
          Total <span className="text-moss-900">{total}</span> permintaan pendaftaran
        </span>
        <span className="text-[10px] font-bold text-moss-400 uppercase tracking-widest">
          Halaman {currentPage} / {totalPages}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-[#F9FAF8] border-b border-moss-100">
            <tr>
              <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">ID</th>
              <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">Pemilik (Wallet)</th>
              <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">Informasi Lahan</th>
              <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">Luas</th>
              <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {/* Render from latest to oldest request */}
            {Array.from({ length: itemsOnPage }).map((_, idx) => {
              const requestId = total - 1 - (startIdx + idx); // Reverse order
              return <RequestHistoryRow key={requestId} requestId={requestId} />;
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-moss-100 bg-[#F9FAF8]">
          <span className="text-xs text-moss-500 font-medium">
            Menampilkan {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, total)} dari {total}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-moss-200 bg-white text-moss-600 hover:bg-moss-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            {getPageNumbers().map((page, i) =>
              page === '...' ? (
                <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-moss-400 text-xs">…</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                    currentPage === page
                      ? 'bg-moss-900 text-white shadow-sm'
                      : 'border border-moss-200 bg-white text-moss-600 hover:bg-moss-50'
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-moss-200 bg-white text-moss-600 hover:bg-moss-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
