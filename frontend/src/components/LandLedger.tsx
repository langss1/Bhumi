'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useReadContract, useAccount } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';
import { addAuditorComment, getCommentsByToken, DBAuditorComment } from '@/lib/supabase';
import { cleanNIB, cleanGPS } from '@/lib/formatters';

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  general:    { label: 'Umum',       color: 'bg-slate-100 text-slate-700 border-slate-200' },
  warning:    { label: 'Peringatan', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  dispute:    { label: 'Sengketa',   color: 'bg-red-100 text-red-700 border-red-200' },
  compliance: { label: 'Kepatuhan',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

interface LandRowProps {
  tokenId: number;
  showAuditComments?: boolean;
}

function LandRow({ tokenId, showAuditComments = false }: LandRowProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { data: landData, isLoading } = useReadContract({
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

  // ── Audit Comments State ──
  const { address: walletAddress } = useAccount();
  const [comments, setComments] = useState<DBAuditorComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentCategory, setCommentCategory] = useState<'general' | 'warning' | 'dispute' | 'compliance'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showDetails) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showDetails]);

  useEffect(() => {
    if (showDetails && showAuditComments) {
      loadComments();
    }
  }, [showDetails, showAuditComments]);

  const loadComments = async () => {
    const data = await getCommentsByToken(tokenId);
    setComments(data);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !walletAddress) return;
    setIsSubmitting(true);
    try {
      const result = await addAuditorComment({
        token_id: tokenId,
        nib: land?.nib || null,
        auditor_wallet: walletAddress,
        auditor_name: null,
        comment: newComment.trim(),
        category: commentCategory,
      });
      if (result?.error) {
        alert('Gagal menyimpan komentar: ' + (result.error as any).message);
      } else {
        setNewComment('');
        setShowCommentForm(false);
        await loadComments();
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setIsSubmitting(false);
  };

  if (isLoading) return (
    <tr className="animate-pulse bg-white border-b border-moss-50">
      <td colSpan={5} className="px-6 py-4 text-center text-moss-300">Memuat data...</td>
    </tr>
  );

  if (!land) return null;

  return (
    <>
      <tr 
        onClick={() => setShowDetails(true)}
        className={`bg-white hover:bg-moss-50/50 transition-colors border-b border-moss-50 cursor-pointer ${land.isDisputed ? 'border-l-4 border-l-red-500' : ''}`}
      >
        <td className="px-6 py-4 font-mono text-xs font-bold text-moss-900">#{tokenId}</td>
        <td className="px-6 py-4 font-mono text-xs text-moss-600 truncate max-w-[120px]">{owner as string}</td>
        <td className="px-6 py-4">
          <span className="text-xs font-bold text-moss-800">{cleanNIB(land.nib)}</span>
          <div className="text-[10px] text-moss-500 mt-0.5">{cleanGPS(land.gpsCoordinates)}</div>
        </td>
        <td className="px-6 py-4">
          <span className="text-xs font-medium text-moss-700">{land.area.toString()} m²</span>
        </td>
        <td className="px-6 py-4 text-center">
          {land.isDisputed ? (
            <span className="bg-red-50 text-red-700 text-[10px] font-black px-3 py-1 rounded-full border border-red-100 uppercase tracking-wider">Sengketa</span>
          ) : (
            <span className="bg-olive-50 text-olive-700 text-[10px] font-black px-3 py-1 rounded-full border border-olive-100 uppercase tracking-wider">Terverifikasi</span>
          )}
        </td>
      </tr>

      {/* Detail Modal — dirender ke document.body via portal agar tidak masuk ke dalam tbody */}
      {showDetails && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-moss-900/60 overflow-y-auto" style={{ backdropFilter: 'blur(4px)' }} onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl relative my-8" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowDetails(false)} className="absolute top-8 right-8 text-moss-400 hover:text-moss-900 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-2xl font-black text-moss-900 mb-6 font-display uppercase tracking-tight">Detail Sertifikat Digital</h3>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-[#F9FAF8] p-5 rounded-2xl border border-moss-100">
                <div className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">Nomor Identifikasi Bidang (NIB)</div>
                <div className="font-bold text-moss-900">{cleanNIB(land.nib)}</div>
              </div>
              <div className="bg-[#F9FAF8] p-5 rounded-2xl border border-moss-100">
                <div className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">Luas Lahan Terukur</div>
                <div className="font-bold text-moss-900">{land.area.toString()} m²</div>
              </div>
              <div className="bg-[#F9FAF8] p-5 rounded-2xl border border-moss-100 col-span-2">
                <div className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">Titik Koordinat (Geo-Location)</div>
                <div className="font-mono text-sm text-moss-900 font-bold">{cleanGPS(land.gpsCoordinates)}</div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h4 className="text-sm font-black text-moss-900 uppercase tracking-widest">Dokumen Tersemat (IPFS)</h4>
              <div className="flex flex-col gap-3">
                {land.ipfsHashes.map((hash: string, idx: number) => (
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

            {/* ── Audit Comments Section ── */}
            {showAuditComments && (
              <div className="border-t border-moss-100 pt-8 space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-moss-900 uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                    Catatan Audit ({comments.length})
                  </h4>
                  {!showCommentForm && (
                    <button
                      onClick={() => setShowCommentForm(true)}
                      className="text-[11px] font-bold text-white bg-slate-700 hover:bg-slate-800 px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Tambah Catatan
                    </button>
                  )}
                </div>

                {showCommentForm && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Kategori</label>
                      <div className="flex gap-2 flex-wrap">
                        {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setCommentCategory(cat as any)}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                              commentCategory === cat
                                ? CATEGORY_CONFIG[cat].color + ' ring-2 ring-offset-1 ring-slate-300'
                                : 'bg-white text-moss-500 border-moss-200 hover:bg-moss-50'
                            }`}
                          >
                            {CATEGORY_CONFIG[cat].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Komentar / Feedback</label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Tulis catatan audit untuk aset ini..."
                        rows={3}
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-300 outline-none transition-all resize-none"
                      />
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => { setShowCommentForm(false); setNewComment(''); }}
                        className="px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSubmitComment}
                        disabled={isSubmitting || !newComment.trim()}
                        className="px-6 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 disabled:opacity-50 transition-all flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Menyimpan...
                          </>
                        ) : 'Simpan Catatan'}
                      </button>
                    </div>
                  </div>
                )}

                {comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map((c) => {
                      const catConfig = CATEGORY_CONFIG[c.category] || CATEGORY_CONFIG.general;
                      return (
                        <div key={c.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${catConfig.color}`}>
                              {catConfig.label}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">
                              {new Date(c.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{c.comment}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-2 truncate">oleh: {c.auditor_wallet}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : !showCommentForm && (
                  <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-sm text-slate-400">Belum ada catatan audit untuk aset ini.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default function LandLedger({ showAuditComments = false }: { showAuditComments?: boolean }) {
  const [currentPage, setCurrentPage] = useState(1);
  const tableTopRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke atas saat pindah halaman
  useEffect(() => {
    if (tableTopRef.current) {
      // scroll-mt-32 akan menyisakan ruang agar tab di atas tidak tertutup
      tableTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);
  const { data: totalLands, isLoading: isCountLoading } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getTotalLands',
    query: {
      refetchInterval: 5000,
    }
  });

  if (isCountLoading) return <div className="p-10 text-center text-moss-500">Menghubungkan ke Blockchain...</div>;

  const total = Number(totalLands || 0);
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const itemsOnPage = Math.min(ITEMS_PER_PAGE, total - startIdx);

  if (total === 0) return (
    <div className="p-20 text-center bg-moss-50/50 rounded-3xl border-2 border-dashed border-moss-200">
      <p className="text-moss-400 font-bold">Belum ada data tanah di Ledger Blockchain</p>
    </div>
  );

  // Generate page numbers for pagination
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
    <div ref={tableTopRef} className="bg-white border border-moss-100 rounded-[2rem] shadow-sm overflow-hidden scroll-mt-32">
      {/* Header with count */}
      <div className="px-6 py-4 bg-[#F9FAF8] border-b border-moss-100 flex items-center justify-between">
        <span className="text-xs font-bold text-moss-500">
          Total <span className="text-moss-900">{total}</span> sertifikat terdaftar
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
            {Array.from({ length: itemsOnPage }).map((_, idx) => {
              const tokenId = startIdx + idx;
              return <LandRow key={tokenId} tokenId={tokenId} showAuditComments={showAuditComments} />;
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-moss-100 bg-[#F9FAF8]">
          <span className="text-xs text-moss-500 font-medium">
            Menampilkan {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, total)} dari {total}
          </span>
          <div className="flex items-center gap-1.5">
            {/* Prev */}
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-moss-200 bg-white text-moss-600 hover:bg-moss-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>

            {/* Page Numbers */}
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

            {/* Next */}
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
