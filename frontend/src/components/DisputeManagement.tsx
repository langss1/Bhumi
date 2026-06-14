'use client';

import React, { useState, useEffect } from 'react';
import { useWaitForTransactionReceipt } from 'wagmi';
import { useSafeWriteContract as useWriteContract } from '@/hooks/useSafeWriteContract';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';
import { getAllAuditorComments, updateAuditorFeedback, DBAuditorComment } from '@/lib/supabase';

export default function DisputeManagement() {
  const [comments, setComments] = useState<DBAuditorComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackInput, setFeedbackInput] = useState<{ [key: string]: string }>({});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, []);

  // Reload data when transaction completes
  useEffect(() => {
    if (isSuccess) {
      loadComments();
    }
  }, [isSuccess]);

  const loadComments = async () => {
    setIsLoading(true);
    const data = await getAllAuditorComments();
    setComments(data);
    setIsLoading(false);
  };

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter comments based on search
  const filteredComments = comments.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.token_id.toString().includes(query) ||
      (c.auditor_name && c.auditor_name.toLowerCase().includes(query)) ||
      (c.auditor_wallet && c.auditor_wallet.toLowerCase().includes(query)) ||
      c.comment.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredComments.length / itemsPerPage);
  const paginatedComments = filteredComments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAction = async (comment: DBAuditorComment, isDisputed: boolean) => {
    const feedback = feedbackInput[comment.id] || '';
    if (!feedback.trim()) {
      alert("Harap isi feedback/balasan terlebih dahulu.");
      return;
    }

    setActiveCommentId(comment.id);
    
    // Panggil Smart Contract untuk bekukan aset atau loloskan
    writeContract({
      address: LAND_REGISTRY_ADDRESS,
      abi: LandRegistryABI,
      functionName: 'setEnforcement',
      args: [BigInt(comment.token_id), isDisputed],
    }, {
      onSuccess: async () => {
        // Jika metamask sign berhasil, update supabase
        const status = isDisputed ? 'SENGKETA' : 'LOLOS';
        const result = await updateAuditorFeedback(comment.id, feedback, status);
        if (result?.error) {
          alert('Gagal update feedback di Supabase: ' + result.error.message);
        } else {
          // Akan dimuat ulang lewat useEffect isSuccess
        }
      },
      onError: (err: any) => {
        alert('Gagal mengeksekusi smart contract: ' + err.message);
        setActiveCommentId(null);
      }
    });
  };

  if (isLoading) return <div className="p-8 text-center text-moss-500 font-medium animate-pulse">Memuat data audit dan sengketa...</div>;

  return (
    <div className="bg-white border border-moss-100 p-4 md:p-8 rounded-[2rem] shadow-sm max-w-4xl mx-auto">
      <h3 className="text-2xl font-black text-moss-900 mb-2">Manajemen Sengketa & Feedback Audit</h3>
      <p className="text-moss-500 mb-6">Daftar catatan dan peringatan dari Auditor terkait integritas aset tanah. BPN Pusat dapat memberikan keputusan akhir di sini.</p>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Cari Token ID, Auditor, Kategori, atau isi komentar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-4 border border-moss-200 rounded-xl text-sm focus:ring-2 focus:ring-moss-500 focus:border-moss-500 outline-none shadow-sm transition-shadow bg-moss-50/30"
        />
      </div>

      {filteredComments.length === 0 ? (
        <div className="p-8 text-center text-moss-500 bg-moss-50 rounded-2xl border border-moss-100">
          {searchQuery ? "Pencarian tidak ditemukan." : "Belum ada catatan audit atau sengketa yang perlu ditinjau."}
        </div>
      ) : (
        <div className="space-y-6">
          {paginatedComments.map((c) => (
            <div key={c.id} className="border border-moss-100 rounded-2xl p-6 bg-white shadow-sm flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-black text-moss-900 text-lg">Token ID: {c.token_id}</span>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-md uppercase tracking-widest">{c.category}</span>
                    {c.bpn_status && c.bpn_status !== 'PENDING' && (
                      <span className={`px-3 py-1 text-xs font-bold rounded-md uppercase tracking-widest ${c.bpn_status === 'SENGKETA' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {c.bpn_status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-moss-500 font-medium">Auditor: {c.auditor_name || 'Anonim'} <span className="font-mono text-xs ml-1">({c.auditor_wallet.slice(0,6)}...{c.auditor_wallet.slice(-4)})</span></p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-semibold text-moss-400 uppercase tracking-wider">{new Date(c.created_at).toLocaleString('id-ID')}</p>
                </div>
              </div>
              
              <div className="bg-amber-50/50 p-5 rounded-xl text-amber-900 text-sm border border-amber-100/50 leading-relaxed">
                <strong className="block mb-1 text-amber-700">Catatan Pemeriksaan Auditor:</strong>
                {c.comment}
              </div>

              {/* Jika BPN sudah merespons */}
              {c.bpn_status && c.bpn_status !== 'PENDING' ? (
                <div className="bg-moss-50 p-5 rounded-xl text-moss-900 text-sm border border-moss-100 leading-relaxed">
                  <strong className="block mb-1 text-moss-700">Tanggapan BPN Pusat:</strong>
                  {c.bpn_feedback}
                </div>
              ) : (
                /* Jika BPN belum merespons, tampilkan Form */
                <div className="flex flex-col gap-3 mt-2 border-t border-dashed border-moss-200 pt-5">
                  <strong className="text-sm text-moss-700">Berikan Keputusan BPN:</strong>
                  <textarea 
                    value={feedbackInput[c.id] || ''}
                    onChange={(e) => setFeedbackInput({...feedbackInput, [c.id]: e.target.value})}
                    placeholder="Contoh: Dokumen telah diverifikasi ulang dan valid. / Terdapat indikasi sengketa, aset dibekukan..." 
                    className="w-full p-4 border border-moss-200 rounded-xl text-sm focus:ring-2 focus:ring-moss-500 focus:border-moss-500 outline-none resize-none h-24 bg-white shadow-inner transition-shadow"
                  />
                  <div className="flex flex-col sm:flex-row gap-3 mt-1">
                    <button 
                      onClick={() => handleAction(c, false)}
                      disabled={(isPending || isConfirming) && activeCommentId === c.id}
                      className="flex-1 py-4 bg-moss-700 hover:bg-moss-800 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {(isPending || isConfirming) && activeCommentId === c.id ? 'Memproses (Cek Dompet)...' : 'Lolos Audit (Clear)'}
                    </button>
                    <button 
                      onClick={() => handleAction(c, true)}
                      disabled={(isPending || isConfirming) && activeCommentId === c.id}
                      className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {(isPending || isConfirming) && activeCommentId === c.id ? 'Memproses (Cek Dompet)...' : 'Set Sengketa (Dispute)'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 border-t border-moss-100 pt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-5 py-2 bg-moss-100 hover:bg-moss-200 text-moss-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            Sebelumnya
          </button>
          <span className="text-sm font-bold text-moss-600">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-5 py-2 bg-moss-100 hover:bg-moss-200 text-moss-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  );
}
