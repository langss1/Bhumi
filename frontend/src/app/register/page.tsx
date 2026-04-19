'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileUp, ShieldCheck, AlertCircle, ArrowUpRight,
  Landmark, Car, Coins, Package, CheckCircle2, Loader2, Hash, DollarSign, Upload, FolderOpen, X,
  Wallet, RefreshCw
} from 'lucide-react';

import { computeSHA256, uploadDocument, STORAGE_CONFIGURED } from '@/lib/ipfs';
import { useRegisterAsset } from '@/hooks/useBangBang';
import { useAccount, useConnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { sepolia } from 'wagmi/chains';

// Validation fee sesuai dengan smart contract (0.001 ETH)
const VALIDATION_FEE_ETH = "0.001";

const CATEGORIES = [
  { id: 'Property', label: 'Real Estate & Land', icon: <Landmark size={20} />, desc: 'SHM, HGB, AJB', institution: 'BPN',       instColor: 'text-emerald-600 bg-emerald-50' },
  { id: 'Vehicle',  label: 'Luxury Vehicles',    icon: <Car size={20} />,      desc: 'BPKB, STNK',  institution: 'Samsat',    instColor: 'text-blue-600 bg-blue-50'       },
  { id: 'Gold',     label: 'Precious Metals',    icon: <Coins size={20} />,    desc: 'Antam, LM',   institution: 'Pegadaian', instColor: 'text-amber-600 bg-amber-50'     },
  { id: 'Other',    label: 'Other Assets',       icon: <Package size={20} />, desc: 'Kategori Lain', institution: 'Kemenkeu', instColor: 'text-purple-600 bg-purple-50'   },
];

const STEPS = ['Register Form', 'Document Upload', 'Confirm & Mint'];

export default function RegisterAsset() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('Property');
  const [isMinting, setIsMinting] = useState(false);
  const [isMinted, setIsMinted] = useState(false);
  const [mintedAssetId, setMintedAssetId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', valuation: '' });
  const [file, setFile] = useState<File | null>(null);
  const [documentHash, setDocumentHash] = useState('');
  const [fileUploading, setFileUploading] = useState(false);
  const [documentUrl,   setDocumentUrl]   = useState('');  // Supabase Storage URL
  const [dragOver,      setDragOver]      = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  
  // ── Restore session on mount (Strict RBAC Guard)
  React.useEffect(() => {
    const session = localStorage.getItem('bb_session');
    if (!session) { 
      router.push('/'); 
      return; 
    }

    try {
      const sess = JSON.parse(session);
      // Jika login sebagai role lain (misal Verificator/Admin), jangan kasih masuk buat daftar aset user
      if (sess.role !== 'user') {
        router.push(sess.role === 'admin' ? '/admin' : '/verificator');
        return;
      }
    } catch (e) {
      localStorage.removeItem('bb_session');
      router.push('/');
    }
  }, [router]);

  const processFile = useCallback(async (f: File) => {
    setFileUploading(true);
    setFile(f);

    // 1) Hitung SHA-256 client-side (integrity proof — disimpan on-chain)
    const hash = await computeSHA256(f);
    setDocumentHash(hash);

    // 2) Upload ke Cloud (Pinata IPFS / Supabase) — accessible dari mana saja
    const session  = JSON.parse(localStorage.getItem('bb_session') || '{}');
    const result   = await uploadDocument(f, { 
      assetName: formData.name, 
      ownerWallet: session.wallet || 'user' 
    });
    
    if (result && result.uploaded) {
      setDocumentUrl(result.url);
    }

    setFileUploading(false);
  }, []);

  const { register, isPending: isTxPending, isConfirming, txHash } = useRegisterAsset();
  const { address: userWallet, chainId } = useAccount();
  const { connect } = useConnect();
  const { switchChain } = useSwitchChain();

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.valuation) return;

    // 0) ENSURE WALLET CONNECTED
    if (!userWallet) {
      connect({ connector: injected() });
      return;
    }

    // 1) ENSURE CORRECT NETWORK (Ethereum Sepolia - ID 11155111)
    if (chainId !== sepolia.id) {
      switchChain({ chainId: sepolia.id });
      return;
    }

    setIsMinting(true);

    try {
      // 2) REAL ON-CHAIN TRANSACTION (Web3)
      let currentTxHash = '';
      try {
        const tx = await register(
          formData.name,
          selectedCategory as any,
          Number(formData.valuation),
          documentHash
        );
        currentTxHash = tx;
      } catch (err: any) {
        console.error("TX Failed:", err);
        if (!confirm("Transaksi Blockchain gagal (Metamask dibatalkan/error). Tetap simpan simulasinya di database?")) {
          setIsMinting(false);
          return;
        }
      }

      // 2) DATABASE SYNC (Web2)
      const session = JSON.parse(localStorage.getItem('bb_session') || '{}');
      const email = session.email || session.name || 'user@demo';
      const res = await fetch('/api/db?table=assets');
      const allAssets = res.ok ? await res.json() : [];
      const newId = allAssets.length > 0 ? Math.max(...allAssets.map((a: {id: number}) => a.id)) + 1 : 1;
      
      const newAsset = {
        id: newId,
        name: formData.name,
        category: selectedCategory,
        valuation: Number(formData.valuation),
        status: 'Pending',
        documentHash: documentHash,
        documentUrl: documentUrl || '',
        date: new Date().toLocaleDateString('id-ID'),
        owner: userWallet || session.wallet || 'user',
        ownerEmail: email,
        txHash: currentTxHash, // Simpan bukti on-chain
      };

      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'assets', action: 'insert', payload: newAsset })
      });

      setMintedAssetId(newId);
      setIsMinting(false);
      setIsMinted(true);
    } catch (err) {
      console.error(err);
      setIsMinting(false);
    }
  };

  if (isMinted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-24 relative overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 8 }} className="absolute inset-0 bg-emerald-200/30 blur-[200px] -z-10" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white/80 backdrop-blur-3xl border border-white/60 rounded-[3rem] p-14 text-center max-w-lg shadow-[0_30px_80px_-20px_rgba(0,0,0,0.1)]"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
            className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center border border-emerald-100 mx-auto mb-8 shadow-lg"
          >
            <CheckCircle2 size={48} className="text-emerald-500" />
          </motion.div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Asset Terdaftar!</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-4">
            Aset <strong>{formData.name}</strong> berhasil disimpan. Status: <span className="font-bold text-amber-600">Pending Verification</span>.
          </p>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-1 mb-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Asset Info</p>
            <p className="text-xs text-slate-600">ID: <span className="font-mono font-bold">#{mintedAssetId}</span></p>
            <p className="text-xs text-slate-600">Kategori: <span className="font-bold">{selectedCategory}</span></p>
            <p className="text-xs text-slate-600">Valuasi: <span className="font-bold">${Number(formData.valuation).toLocaleString()}</span></p>
            {documentHash && (
              <p className="font-mono text-[10px] text-emerald-700 break-all mt-1 bg-emerald-50 px-2 py-1 rounded">Hash: {documentHash.slice(0, 24)}...</p>
            )}
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 mb-6 text-xs text-amber-700">
            ⛏️ Aset akan muncul di queue Verificator. Setelah deploy ke testnet, transaksi ini akan diperbarui dengan tx hash nyata.
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setIsMinted(false); setActiveStep(0); setFormData({ name: '', valuation: '' }); setFile(null); setDocumentHash(''); }}
              className="flex-1 bg-slate-900 text-white py-3 rounded-2xl font-black hover:bg-emerald-600 transition-all">
              Register Lagi
            </button>
            <button onClick={() => router.push('/user')}
              className="flex-1 bg-emerald-50 text-emerald-700 py-3 rounded-2xl font-bold border border-emerald-100 hover:bg-emerald-100 transition-all">
              Ke Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-16 px-4 md:px-8 relative overflow-hidden min-h-screen">
      {/* Abstract Background */}
      <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, 90, 0], borderRadius: ["40% 60% 70% 30%/40% 50% 60% 50%","60% 40% 30% 70%/60% 30% 70% 40%","40% 60% 70% 30%/40% 50% 60% 50%"] }} transition={{ duration: 20, repeat: Infinity }} className="absolute -top-[15%] -right-[10%] w-[700px] h-[700px] bg-emerald-200/20 blur-[100px] -z-10 pointer-events-none" />
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 15, repeat: Infinity }} className="absolute -bottom-[10%] -left-[10%] w-[600px] h-[600px] bg-blue-200/20 blur-[120px] -z-10 pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-14 space-y-5">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter"
        >
          Daftarin Asetmu{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
            ke Blockchain
          </span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed"
        >
          Ubah aset nyata kamu jadi bukti digital yang sah dan aman di blockchain. Gampang, cepet, dan terpercaya!
        </motion.p>
      </div>

      {/* Step Progress */}
      <div className="flex justify-center items-center gap-4 mb-14">
        {['Isi Form', 'Upload Dokumen', 'Konfirmasi & Simpan'].map((step, i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${i === activeStep ? 'bg-slate-900 text-white shadow-lg' : i < activeStep ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-white text-slate-400 border border-slate-200'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${i === activeStep ? 'bg-emerald-400 text-slate-900' : i < activeStep ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {i < activeStep ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </div>
            {i < 2 && <div className={`hidden sm:block h-px w-8 ${i < activeStep ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Info Column */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-4 space-y-5 sticky top-24"
        >
          {/* Process Steps */}
          <div className="bg-[#1A2332] rounded-[2.5rem] p-8 shadow-2xl text-white relative overflow-hidden">
            <motion.div animate={{ opacity: [0.05, 0.15, 0.05] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute top-0 right-0 w-64 h-64 bg-emerald-400 rounded-bl-full blur-3xl pointer-events-none" />
            <h3 className="text-lg font-black mb-8 flex items-center gap-3">
              <ShieldCheck className="text-emerald-400" size={22} /> Proses Aman & Transparan
            </h3>
            <ul className="space-y-7 relative z-10">
              {[
                { n: 1, title: 'Upload Dokumen Asli', desc: 'Sertifikat atau bukti milik kamu bakal di-hash biar datanya aman.' },
                { n: 2, title: 'Titip Biaya Verifikasi', desc: `Bayar ${VALIDATION_FEE_ETH} ETH sebagai tanda serius buat diverifikasi.` },
                { n: 3, title: 'Dicek Sama Ahlinya', desc: 'Verificator resmi bakal ngecek keaslian aset kamu secara on-chain.' },
                { n: 4, title: 'Gas! Masuk Blockchain', desc: 'Begitu oke, aset kamu resmi terdaftar permanen di blockchain.' },
              ].map(s => (
                <li key={s.n} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0 text-emerald-400 font-black text-sm">{s.n}</div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">{s.title}</h4>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-6 border-t border-white/10 flex items-start gap-3">
              <AlertCircle className="text-amber-400 shrink-0" size={16} />
              <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wider font-semibold">
                Nanti bakal ada sedikit biaya gas di Metamask ya. Pastikan saldo Sepolia kamu cukup!
              </p>
            </div>
          </div>

          {/* Fee Summary Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Fee Summary</h4>
            <div className="space-y-3">
              {[
                { label: 'Validation Fee', value: `${VALIDATION_FEE_ETH} ETH`, sub: 'Ditahan sebagai Escrow' },
                { label: 'Protocol Cut (20%)', value: '0.0002 ETH', sub: 'Ke SuperAdmin' },
                { label: 'Verificator Reward (80%)', value: '0.0008 ETH', sub: 'Ke Verifikator' },
              ].map((f, i) => (
                <div key={i} className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{f.label}</p>
                    <p className="text-[10px] text-slate-400">{f.sub}</p>
                  </div>
                  <p className="font-mono font-black text-sm text-slate-900">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Form Column */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          className="lg:col-span-8"
        >
          <div className="bg-white/70 backdrop-blur-3xl border border-white/60 p-8 md:p-12 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)]">
            <form onSubmit={handleMint} className="space-y-10">
              
              {/* Category Selector */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Pilih Jenis Aset</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all ${selectedCategory === cat.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'}`}
                    >
                      <div className={`mb-2 ${selectedCategory === cat.id ? 'text-emerald-600' : 'text-slate-400'}`}>{cat.icon}</div>
                      <span className="font-black text-xs">{cat.id}</span>
                      <span className="text-[9px] mt-0.5 opacity-60">{cat.desc}</span>
                      <span className={`text-[8px] font-black mt-1 px-2 py-0.5 rounded-full uppercase tracking-wider ${cat.instColor}`}>
                        {cat.institution}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Asset Name + Valuation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Aset Kamu</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-semibold rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300 placeholder:font-normal"
                    placeholder="Contoh: Villa Dago Pakar"
                    required value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Estimasi Nilai (USD)</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2">
                      <DollarSign size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-2xl pl-12 pr-5 py-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                      placeholder="0" required value={formData.valuation}
                      onChange={e => setFormData({...formData, valuation: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dokumen Sah / Bukti Milik</label>
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.png,.webp,.doc,.docx"
                  onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
                  onClick={() => fileRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    dragOver ? 'border-emerald-400 bg-emerald-50' :
                    file ? 'border-emerald-300 bg-emerald-50/50' :
                    'border-slate-200 bg-slate-50/50 hover:border-emerald-300'
                  }`}>
                  <div className="p-5 bg-white shadow-xl shadow-slate-200/50 text-emerald-600 rounded-2xl mb-5">
                    {fileUploading ? <Loader2 size={30} className="animate-spin text-emerald-500" /> : file ? <FolderOpen size={30} /> : <FileUp size={30} />}
                  </div>
                  {fileUploading ? (
                    <><p className="font-bold text-slate-700">Lagi hitung data & upload...</p><p className="text-xs text-slate-400 mt-1">{STORAGE_CONFIGURED ? 'Tunggu bentar, upload ke cloud...' : 'Menghitung hash...'}</p></>
                  ) : file ? (
                    <><p className="font-bold text-emerald-700">{file.name}</p><p className="text-slate-400 text-xs mt-1">{(file.size/1024).toFixed(1)} KB · {documentUrl ? '✅ Sudah aman di cloud' : '⚠️ Baru tersimpan di browser'}</p></>
                  ) : (
                    <><p className="text-slate-800 font-bold text-base">Tarik filenya ke sini ya</p><p className="text-slate-400 text-xs mt-2">PDF/JPG/PNG — Maks 50MB</p></>
                  )}
                </div>
              </div>

              {/* Document Hash (real SHA-256) */}
              {documentHash && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">SHA-256 Hash (disimpan on-chain)</label>
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl pl-4 pr-5 py-3">
                    <Hash size={16} className="text-emerald-500 shrink-0" />
                    <p className="font-mono text-xs text-emerald-700 break-all flex-1">{documentHash}</p>
                    <span className="text-[9px] font-black text-emerald-600 shrink-0">✓ SHA-256</span>
                  </div>
                  {documentUrl ? (
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-2xl pl-4 pr-5 py-2.5">
                      <span className="text-[11px] font-bold text-blue-700 flex-1 truncate">☁️ Tersimpan di Supabase Storage</span>
                      <a href={documentUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black text-blue-600 hover:text-blue-800 underline shrink-0">Buka URL</a>
                    </div>
                  ) : !STORAGE_CONFIGURED ? (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-2.5">
                      <span className="text-[11px] text-amber-700">⚠️ Supabase belum dikonfigurasi — file hanya tersimpan di browser ini. Set NEXT_PUBLIC_SUPABASE_URL di .env.local</span>
                    </div>
                  ) : null}
                </motion.div>
              )}

              {/* Fee Warning */}
              <div className="flex items-start gap-4 bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <p className="text-amber-700 text-sm leading-relaxed">
                  Fungsi <code className="font-mono bg-amber-100 px-1 rounded">registerAsset()</code> memerlukan pembayaran <span className="font-black">{VALIDATION_FEE_ETH} ETH</span> sebagai biaya validasi escrow ke smart contract.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isMinting || fileUploading}
                className={`w-full py-5 px-8 rounded-2xl font-black text-lg transition-all duration-300 shadow-xl flex justify-center items-center gap-3 group relative overflow-hidden ${
                  isMinting || fileUploading ? 'bg-slate-400 cursor-not-allowed text-white' : 
                  !userWallet ? 'bg-amber-500 hover:bg-amber-600 text-white' :
                  chainId !== sepolia.id ? 'bg-rose-500 hover:bg-rose-600 text-white' :
                  'bg-slate-900 hover:bg-emerald-600 text-white hover:shadow-emerald-600/20'
                }`}
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                {isMinting ? (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    <span className="relative z-10">Lagi diproses di Blockchain...</span>
                  </>
                ) : !userWallet ? (
                  <>
                    <Wallet size={22} />
                    <span className="relative z-10">Konek Wallet Dulu Yuk</span>
                  </>
                ) : chainId !== sepolia.id ? (
                  <>
                    <RefreshCw size={22} />
                    <span className="relative z-10">Pindah ke Jaringan Sepolia</span>
                  </>
                ) : (
                  <>
                    <span className="relative z-10">Daftarin Aset Sekarang ({VALIDATION_FEE_ETH} ETH)</span>
                    <ArrowUpRight size={22} className="relative z-10 group-hover:rotate-45 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
