'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReadContract, usePublicClient, useAccount } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';
import LandLedger from '@/components/LandLedger';
import { getAllAuditorComments, DBAuditorComment, addAuditorComment, getCommentsByToken } from '@/lib/supabase';
import { useWalletGuard } from '@/hooks/useWalletGuard';
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

interface AnomalyDetail {
  tokenId: number;
  nib: string;
  gpsCoordinates: string;
  area: bigint;
  isDisputed: boolean;
  hasActiveTransfer: boolean;
  transferDetails?: {
    seller: string;
    buyer: string;
    notaris: string;
    sellerApproved: boolean;
    buyerApproved: boolean;
    notarisApproved: boolean;
  };
}

// ─── Kartu Anomali dengan Komentar ────────────────────────────────────────────
function DisputedAssetChecker({ anomaly }: { anomaly: AnomalyDetail }) {
  const { address: walletAddress } = useAccount();

  // ── Audit Comments State ──
  const [comments, setComments] = useState<DBAuditorComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentCategory, setCommentCategory] = useState<'general' | 'warning' | 'dispute' | 'compliance'>('warning');
  const [showComments, setShowComments] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTransferDetails, setShowTransferDetails] = useState(false);

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  const loadComments = async () => {
    const data = await getCommentsByToken(anomaly.tokenId);
    setComments(data);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !walletAddress) return;
    try {
      setIsSubmitting(true);
      const result = await addAuditorComment({
        token_id: anomaly.tokenId,
        nib: anomaly.nib,
        auditor_wallet: walletAddress as string,
        auditor_name: null,
        comment: newComment.trim(),
        category: commentCategory,
      });

      if (result) {
        setNewComment('');
        setShowCommentForm(false);
        await loadComments();
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim komentar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-3xl border-2 overflow-hidden ${anomaly.isDisputed ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-xs font-black text-moss-400 uppercase tracking-widest">Token #{anomaly.tokenId}</p>
            <p className="font-black text-moss-900 break-all">NIB: {anomaly.nib}</p>
          </div>
          {anomaly.isDisputed && (
            <span className="shrink-0 whitespace-nowrap text-[10px] font-black text-red-700 bg-red-100 px-3 py-1.5 rounded-full border border-red-200 uppercase">⚠ Sengketa Aktif</span>
          )}
          {anomaly.hasActiveTransfer && !anomaly.isDisputed && (
            <span className="shrink-0 whitespace-nowrap text-[10px] font-black text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200 uppercase">⏳ Transfer Berjalan</span>
          )}
        </div>
        <p className="text-xs text-moss-600 break-all">Luas: {anomaly.area.toString()} m² | GPS: {anomaly.gpsCoordinates}</p>
      </div>

      {/* ── Rincian Pihak Terlibat ── */}
      {anomaly.transferDetails && (
        <div className="px-6 pb-2">
          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowTransferDetails(!showTransferDetails)}
              className="w-full flex items-center justify-between px-4 py-3 text-[11px] font-bold text-amber-700 uppercase tracking-widest hover:bg-amber-100/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg
                  className={`w-4 h-4 transition-transform ${showTransferDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Pihak Terlibat Transfer
              </div>
            </button>
            <AnimatePresence>
              {showTransferDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3 border-t border-amber-100 pt-3">
                    {/* Penjual */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Penjual (Seller)</span>
                        {anomaly.transferDetails.sellerApproved ? (
                          <span className="text-[9px] font-black text-olive-700 bg-olive-50 px-2 py-0.5 rounded border border-olive-100 uppercase">✓ Disetujui</span>
                        ) : (
                          <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">Menunggu</span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700 break-all bg-white p-2 rounded-lg border border-slate-100">
                        {anomaly.transferDetails.seller}
                      </span>
                    </div>

                    {/* Pembeli */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Pembeli (Buyer)</span>
                        {anomaly.transferDetails.buyerApproved ? (
                          <span className="text-[9px] font-black text-olive-700 bg-olive-50 px-2 py-0.5 rounded border border-olive-100 uppercase">✓ Disetujui</span>
                        ) : (
                          <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">Menunggu</span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700 break-all bg-white p-2 rounded-lg border border-slate-100">
                        {anomaly.transferDetails.buyer}
                      </span>
                    </div>

                    {/* Notaris */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Notaris (PPAT)</span>
                        {anomaly.transferDetails.notarisApproved ? (
                          <span className="text-[9px] font-black text-olive-700 bg-olive-50 px-2 py-0.5 rounded border border-olive-100 uppercase">✓ Disetujui</span>
                        ) : (
                          <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">Menunggu</span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700 break-all bg-white p-2 rounded-lg border border-slate-100">
                        {anomaly.transferDetails.notaris}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Catatan Audit ── */}
      <div className="px-6 pb-6">
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${anomaly.isDisputed ? 'text-red-500 hover:text-red-800' : 'text-amber-600 hover:text-amber-800'}`}
        >
          <svg
            className={`w-4 h-4 transition-transform ${showComments ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Catatan Audit ({showComments ? comments.length : 'Buka'})
        </button>

        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 border border-moss-100 rounded-2xl p-5 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-black text-moss-900 flex items-center gap-2">
                    <svg className="w-4 h-4 text-moss-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Catatan ({comments.length})
                  </h4>
                  {!showCommentForm && (
                    <button
                      onClick={() => setShowCommentForm(true)}
                      className={`px-3 py-1.5 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 ${anomaly.isDisputed ? 'bg-red-700 hover:bg-red-800' : 'bg-amber-600 hover:bg-amber-700'}`}
                    >
                      <span>+</span> Tambah
                    </button>
                  )}
                </div>

                {showCommentForm && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-[#F9FAF8] border border-moss-100 rounded-xl"
                  >
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(CATEGORY_STYLES).map(([cat, style]) => (
                          <button
                            key={cat}
                            onClick={() => setCommentCategory(cat as any)}
                            className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-all ${
                              commentCategory === cat
                                ? style.color + ' ring-1 ring-offset-1 ring-moss-300'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {style.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Tulis hasil temuan anomali..."
                      className="w-full p-2 bg-white border border-moss-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-olive-500 outline-none transition-all resize-y min-h-[80px]"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => { setShowCommentForm(false); setNewComment(''); }}
                        className="px-3 py-1.5 text-[10px] font-bold text-moss-600 hover:bg-moss-50 rounded-lg transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSubmitComment}
                        disabled={isSubmitting || !newComment.trim()}
                        className="px-4 py-1.5 bg-moss-700 text-white text-[10px] font-bold rounded-lg hover:bg-moss-800 transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? '...' : 'Simpan'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map((c) => {
                      const style = CATEGORY_STYLES[c.category] || CATEGORY_STYLES.general;
                      return (
                        <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${style.color}`}>
                              {style.label}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">
                              {new Date(c.created_at).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">{c.comment}</p>
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            <span className="text-[10px] font-mono text-slate-500">{c.auditor_wallet.substring(0,6)}...</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : !showCommentForm && (
                  <div className="text-center py-4 text-slate-400">
                    <p className="text-[10px]">Belum ada catatan.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Komponen cek sengketa per aset ───────────────────────────────────────────


// ─── Kartu hasil pencarian ────────────────────────────────────────────────────
function LandResultCard({ land }: { land: LandDetail }) {
  const [showHistory, setShowHistory] = useState(false);
  const { address: walletAddress } = useAccount();

  // ── Audit Comments State ──
  const [comments, setComments] = useState<DBAuditorComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentCategory, setCommentCategory] = useState<'general' | 'warning' | 'dispute' | 'compliance'>('general');
  const [showComments, setShowComments] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  const loadComments = async () => {
    const data = await getCommentsByToken(land.tokenId);
    setComments(data);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !walletAddress) return;
    try {
      setIsSubmitting(true);
      const result = await addAuditorComment({
        token_id: land.tokenId,
        nib: land.nib,
        auditor_wallet: walletAddress as string,
        auditor_name: null,
        comment: newComment.trim(),
        category: commentCategory,
      });

      if (result) {
        setNewComment('');
        setShowCommentForm(false);
        await loadComments();
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim komentar.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                      <span className="text-xs font-mono font-bold">{addr}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Catatan Audit ── */}
      <div className="px-10 pb-8">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-[11px] font-bold text-moss-500 uppercase tracking-widest hover:text-moss-800 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showComments ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Catatan Audit ({showComments ? comments.length : 'Buka'})
        </button>

        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 border border-moss-100 rounded-2xl p-6 bg-slate-50/50">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-sm font-black text-moss-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-moss-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Catatan Audit ({comments.length})
                  </h4>
                  {!showCommentForm && (
                    <button
                      onClick={() => setShowCommentForm(true)}
                      className="px-4 py-2 bg-moss-900 text-white text-xs font-bold rounded-lg hover:bg-moss-800 transition-colors flex items-center gap-2"
                    >
                      <span>+</span> Tambah Catatan
                    </button>
                  )}
                </div>

                {showCommentForm && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-white border border-moss-200 rounded-xl shadow-sm"
                  >
                    <div className="mb-4">
                      <label className="block text-[10px] font-bold text-moss-500 uppercase tracking-widest mb-2">
                        Kategori Temuan
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(CATEGORY_STYLES).map(([cat, style]) => (
                          <button
                            key={cat}
                            onClick={() => setCommentCategory(cat as any)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md border transition-all ${
                              commentCategory === cat
                                ? style.color + ' ring-2 ring-offset-1 ring-moss-300'
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {style.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Tulis hasil temuan audit atau masalah pada dokumen warkah..."
                      className="w-full p-3 bg-slate-50 border border-moss-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-olive-500 outline-none transition-all resize-y min-h-[100px]"
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => { setShowCommentForm(false); setNewComment(''); }}
                        className="px-4 py-2 text-xs font-bold text-moss-600 hover:bg-moss-50 rounded-lg transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSubmitComment}
                        disabled={isSubmitting || !newComment.trim()}
                        className="px-5 py-2 bg-moss-700 text-white text-xs font-bold rounded-lg hover:bg-moss-800 transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? 'Menyimpan...' : 'Simpan Catatan'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((c) => {
                      const style = CATEGORY_STYLES[c.category] || CATEGORY_STYLES.general;
                      return (
                        <div key={c.id} className="p-4 bg-white border border-slate-200 rounded-xl relative group">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-slate-500">
                                {new Date(c.created_at).toLocaleString('id-ID')}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${style.color}`}>
                                {style.label}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{c.comment}</p>
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <span className="text-xs text-slate-500 flex items-center gap-2">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              <span className="font-mono">{c.auditor_wallet.substring(0,6)}...{c.auditor_wallet.substring(38)}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : !showCommentForm && (
                  <div className="text-center py-6 text-slate-400">
                    <p className="text-sm">Belum ada catatan audit untuk token ini.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
    query: { refetchInterval: 5000 }
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
      const freshTotalLands = await publicClient.readContract({
        address: LAND_REGISTRY_ADDRESS,
        abi: LandRegistryABI,
        functionName: 'getTotalLands',
      });
      const total = Number(freshTotalLands || 0);
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
const CATEGORY_STYLES: Record<string, { label: string; color: string }> = {
  general:    { label: 'Umum',       color: 'bg-slate-100 text-slate-700 border-slate-200' },
  warning:    { label: 'Peringatan', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  dispute:    { label: 'Sengketa',   color: 'bg-red-100 text-red-700 border-red-200' },
  compliance: { label: 'Kepatuhan',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

export default function AuditorDashboard() {
  useWalletGuard();
  const [activeTab, setActiveTab] = useState('ledger');
  const publicClient = usePublicClient();
  const [allComments, setAllComments] = useState<DBAuditorComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const { data: totalLands } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getTotalLands',
    query: { refetchInterval: 5000 }
  });

  // ── Anomalies State ──
  const [anomalies, setAnomalies] = useState<AnomalyDetail[]>([]);
  const [isScanningAnomalies, setIsScanningAnomalies] = useState(false);
  const [hasScannedAnomalies, setHasScannedAnomalies] = useState(false);
  const [anomalyPage, setAnomalyPage] = useState(1);
  const ANOMALIES_PER_PAGE = 10;

  useEffect(() => {
    if (activeTab === 'anomaly' && !hasScannedAnomalies && totalLands) {
      scanAllAnomalies();
    }
  }, [activeTab, hasScannedAnomalies, totalLands]);

  const scanAllAnomalies = async () => {
    if (!publicClient) return;
    setIsScanningAnomalies(true);
    setAnomalies([]);
    
    try {
      const total = Number(totalLands || 0);
      const foundAnomalies: AnomalyDetail[] = [];
      
      // Karena kita butuh memindai dengan cepat, kita bisa melakukan promise.all dalam batch
      // Namun untuk kesederhanaan dan keandalan public node, kita loop biasa atau batch kecil.
      for (let i = 0; i < total; i++) {
        try {
          const landData = await publicClient.readContract({
            address: LAND_REGISTRY_ADDRESS,
            abi: LandRegistryABI,
            functionName: 'getLandDetails',
            args: [BigInt(i)],
          });
          const transferReq = await publicClient.readContract({
            address: LAND_REGISTRY_ADDRESS,
            abi: LandRegistryABI,
            functionName: 'transferRequests',
            args: [BigInt(i)],
          });

          const isDisputed = (landData as any)[4];
          const hasActiveTransfer = transferReq && (transferReq as any)[6];

          if (isDisputed || hasActiveTransfer) {
            foundAnomalies.push({
              tokenId: i,
              gpsCoordinates: (landData as any)[0],
              area: (landData as any)[1],
              nib: (landData as any)[2],
              isDisputed,
              hasActiveTransfer,
              transferDetails: hasActiveTransfer ? {
                seller: (transferReq as any)[0],
                buyer: (transferReq as any)[1],
                notaris: (transferReq as any)[2],
                sellerApproved: (transferReq as any)[3],
                buyerApproved: (transferReq as any)[4],
                notarisApproved: (transferReq as any)[5],
              } : undefined
            });
          }
        } catch (e) {
          console.error(`Failed to scan token ${i}`, e);
        }
      }
      
      setAnomalies(foundAnomalies);
      setHasScannedAnomalies(true);
    } catch (e) {
      console.error("Error scanning anomalies:", e);
    } finally {
      setIsScanningAnomalies(false);
    }
  };

  const currentAnomalies = anomalies.slice((anomalyPage - 1) * ANOMALIES_PER_PAGE, anomalyPage * ANOMALIES_PER_PAGE);
  const totalAnomalyPages = Math.ceil(anomalies.length / ANOMALIES_PER_PAGE);

  useEffect(() => {
    if (activeTab === 'comments') {
      setCommentsLoading(true);
      getAllAuditorComments().then(data => {
        setAllComments(data);
        setCommentsLoading(false);
      });
    }
  }, [activeTab]);

  const tabs = [
    { id: 'ledger', label: '📊 Monitoring Ledger' },
    { id: 'search', label: '🔍 Forensik Silsilah Aset' },
    { id: 'anomaly', label: '⚠️ Deteksi Anomali' },
    { id: 'comments', label: '💬 Catatan Audit' },
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

      <div className="flex gap-2 md:gap-4 mb-6 md:mb-10 border-b border-moss-100 pb-px overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold tracking-wide transition-colors shrink-0 ${
              activeTab === tab.id ? 'text-moss-900 font-extrabold' : 'text-moss-400 hover:text-moss-700'
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
                  Semua NFT Sertifikat Tanah yang tersegel di blockchain. Total: <strong>{Number(totalLands || 0)} aset</strong> terdaftar.
                </p>
              </div>
              <LandLedger showAuditComments />
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

              {isScanningAnomalies ? (
                <div className="bg-olive-50 border border-olive-100 p-8 rounded-[2rem] text-center flex flex-col items-center">
                  <svg className="animate-spin w-8 h-8 text-olive-600 mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="font-bold text-olive-800">Memindai seluruh Ledger...</p>
                  <p className="text-sm text-olive-600 mt-1">Sistem sedang memeriksa status setiap aset. Mohon tunggu.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {currentAnomalies.map((anomaly) => (
                      <DisputedAssetChecker key={anomaly.tokenId} anomaly={anomaly} />
                    ))}
                    
                    {anomalies.length === 0 && hasScannedAnomalies && (
                      <div className="col-span-1 lg:col-span-2 p-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-200">
                          <svg className="w-7 h-7 text-moss-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-moss-700 font-black text-lg">Semua Bersih</p>
                        <p className="text-moss-500 font-medium mt-1">Tidak ada aset yang sedang bersengketa atau dalam proses transfer.</p>
                      </div>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {totalAnomalyPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-4">
                      <button
                        onClick={() => setAnomalyPage(p => Math.max(1, p - 1))}
                        disabled={anomalyPage === 1}
                        className="px-4 py-2 border border-moss-200 rounded-xl bg-white text-moss-600 font-bold hover:bg-moss-50 disabled:opacity-50 transition-colors"
                      >
                        « Sebelumnya
                      </button>
                      <span className="text-sm font-bold text-moss-700">
                        Halaman {anomalyPage} dari {totalAnomalyPages}
                      </span>
                      <button
                        onClick={() => setAnomalyPage(p => Math.min(totalAnomalyPages, p + 1))}
                        disabled={anomalyPage === totalAnomalyPages}
                        className="px-4 py-2 border border-moss-200 rounded-xl bg-white text-moss-600 font-bold hover:bg-moss-50 disabled:opacity-50 transition-colors"
                      >
                        Selanjutnya »
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'comments' && (
            <motion.div key="comments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-moss-900">Catatan Audit</h3>
                <p className="text-sm text-moss-500 mt-2">
                  Semua catatan dan feedback yang telah ditambahkan oleh auditor. Untuk menambah catatan baru, klik aset di tab Monitoring Ledger.
                </p>
              </div>

              {commentsLoading ? (
                <div className="p-10 text-center text-moss-500">Memuat catatan audit...</div>
              ) : allComments.length === 0 ? (
                <div className="p-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                  </div>
                  <p className="text-slate-500 font-bold">Belum ada catatan audit.</p>
                  <p className="text-sm text-slate-400 mt-1">Buka tab &quot;Monitoring Ledger&quot; dan klik aset untuk menambah catatan.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm font-bold text-moss-500 px-1 mb-2">
                    Total <span className="text-slate-700">{allComments.length}</span> catatan
                  </div>
                  {allComments.map((c) => {
                    const catConfig = CATEGORY_STYLES[c.category] || CATEGORY_STYLES.general;
                    return (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-200 font-mono">
                              Token #{c.token_id}
                            </span>
                            {c.nib && (
                              <span className="text-[10px] font-bold text-moss-500">NIB: {c.nib}</span>
                            )}
                            <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${catConfig.color}`}>
                              {catConfig.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {new Date(c.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{c.comment}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-3 truncate">oleh: {c.auditor_wallet}</p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
