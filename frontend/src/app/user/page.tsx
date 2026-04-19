'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Landmark, Car, Coins, Package, X, LogOut,
  FileText, ArrowUpRight, RefreshCw, Send, Archive,
  ShieldCheck, Clock, Inbox, Hash, DollarSign, AlertCircle,
  ExternalLink, Loader2, CheckCircle2, Upload, FolderOpen
} from 'lucide-react';

// ─── IndexedDB helpers for persistent file storage ────────────────────────────
const IDB_NAME = 'BangBangFiles';
const IDB_STORE = 'documents';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE, { keyPath: 'hash' });
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function saveFileToIDB(hash: string, name: string, type: string, data: ArrayBuffer) {
  const db = await openIDB();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put({ hash, name, type, data, savedAt: Date.now() });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function getFileFromIDB(hash: string): Promise<{ name: string; type: string; data: ArrayBuffer } | null> {
  const db = await openIDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(hash);
    req.onsuccess = () => res(req.result || null);
    req.onerror = () => rej(req.error);
  });
}

async function hashFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Types matching BangBang smart contract structs ─────────────────────────
type AssetCategory = 'Property' | 'Vehicle' | 'Gold' | 'Other';
type AssetState = 'Pending' | 'Verified' | 'Archived';

interface Asset {
  id: number;
  name: string;
  category: AssetCategory;
  valuation: number;      // in USD (display), contract uses Wei
  status: AssetState;
  date: string;
  documentHash: string;
  owner: string;
  valuationUpdatePending?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const CATEGORY_INSTITUTION: Record<AssetCategory, string> = {
  Property: 'BPN',
  Vehicle: 'Samsat',
  Gold: 'Pegadaian',
  Other: 'Kemenkeu',
};

const CATEGORY_META: Record<AssetCategory, { icon: React.ReactNode; color: string; bg: string }> = {
  Property: { icon: <Landmark size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
  Vehicle: { icon: <Car size={20} />, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
  Gold: { icon: <Coins size={20} />, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100' },
  Other: { icon: <Package size={20} />, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-100' },
};

const STATUS_META: Record<AssetState, { color: string; dot: string; label: string }> = {
  Pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400', label: 'Pending' },
  Verified: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Verified' },
  Archived: { color: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400', label: 'Archived' },
};

const CATEGORIES: AssetCategory[] = ['Property', 'Vehicle', 'Gold', 'Other'];


// ─── Register Asset Modal ─────────────────────────────────────────────────────
function RegisterModal({ onClose, onRegister }: { onClose: () => void; onRegister: (a: Omit<Asset, 'id' | 'date' | 'owner'>) => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('Property');
  const [valuation, setValuation] = useState('');
  const [docHash, setDocHash] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHashing, setFileHashing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setFileHashing(true);
    setSelectedFile(file);
    try {
      const hash = await hashFile(file);
      // Prefix with 'Qm' to simulate IPFS CID style (sha256 stored locally)
      const cid = 'bb' + hash.slice(0, 44);
      setDocHash(cid);
      // Persist to IndexedDB
      const buf = await file.arrayBuffer();
      await saveFileToIDB(cid, file.name, file.type, buf);
    } catch (err) {
      console.error('File hashing failed:', err);
    } finally {
      setFileHashing(false);
    }
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !valuation) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500)); // simulate tx
    onRegister({
      name,
      category,
      valuation: Number(valuation),
      status: 'Pending',
      documentHash: docHash || `Qm${Math.random().toString(36).slice(2, 20)}`,
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, y: 16, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 8, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
          <X size={18} />
        </button>
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-900">Register New Asset</h2>
          <p className="text-slate-400 text-xs mt-1">Daftarkan aset fisik baru ke blockchain. Fee: <span className="font-bold text-slate-600">0.001 ETH</span></p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Kategori Aset</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(c => {
                const m = CATEGORY_META[c];
                return (
                  <button key={c} type="button" onClick={() => setCategory(c)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-[10px] font-black transition-all ${category === c ? `border-current ${m.color} ${m.bg}` : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                    {m.icon} {c}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Name */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Aset</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Villa Dago Pakar"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-all" />
          </div>
          {/* Valuation */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Valuasi (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><DollarSign size={15} /></span>
              <input type="number" value={valuation} onChange={e => setValuation(e.target.value)} required placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm font-bold focus:outline-none focus:border-emerald-500 transition-all" />
            </div>
          </div>

          {/* ── File Upload (IPFS-style) ── */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
              Upload Dokumen Legal <span className="text-slate-300">(PDF, Foto, SHM, BPKB)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl px-4 py-5 text-center cursor-pointer transition-all ${dragOver ? 'border-emerald-400 bg-emerald-50' :
                  selectedFile ? 'border-emerald-300 bg-emerald-50/50' :
                    'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}>
              {fileHashing ? (
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 size={16} className="animate-spin text-emerald-500" />
                  <span className="text-xs font-bold">Menghitung SHA-256 hash...</span>
                </div>
              ) : selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FolderOpen size={16} className="text-emerald-500" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-emerald-700 truncate max-w-[240px]">{selectedFile.name}</p>
                    <p className="text-[10px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB · Tersimpan di browser IndexedDB</p>
                  </div>
                  <CheckCircle2 size={14} className="text-emerald-500 ml-auto shrink-0" />
                </div>
              ) : (
                <div>
                  <Upload size={18} className="text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-400">Drag & drop atau klik untuk upload</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">PDF · JPG · PNG · DOC (maks 50MB)</p>
                </div>
              )}
            </div>
            {/* Hash display */}
            {docHash && (
              <div className="mt-2 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <Hash size={12} className="text-emerald-500 shrink-0" />
                <p className="font-mono text-[10px] text-slate-600 truncate flex-1">{docHash}</p>
                <span className="text-[9px] text-emerald-600 font-bold shrink-0">SHA-256 ✓</span>
              </div>
            )}
            {!selectedFile && (
              <div className="mt-2">
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Atau masukkan hash manual:</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Hash size={12} /></span>
                  <input value={docHash} onChange={e => setDocHash(e.target.value)} placeholder="QmHash..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-all" />
                </div>
              </div>
            )}
          </div>

          {/* Storage info */}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <FolderOpen size={15} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700 leading-relaxed">
              File disimpan di <strong>IndexedDB browser Anda</strong> (lokal, persisten). Hash SHA-256 disimpan on-chain sebagai referensi. File bisa diakses kembali kapanpun dari browser yang sama.
            </p>
          </div>

          {/* Fee warning */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700">Memanggil <code className="font-mono bg-amber-100 px-1 rounded">registerAsset()</code> — memerlukan <strong>0.001 ETH</strong> sebagai escrow validasi.</p>
          </div>
          <button type="submit" disabled={submitting || fileHashing}
            className="w-full bg-slate-900 hover:bg-emerald-600 disabled:opacity-60 text-white font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Minting...</> : <><span>Daftar & Kirim (0.001 ETH)</span> <ArrowUpRight size={16} className="group-hover:rotate-45 transition-transform" /></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function InvestorDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userWallet, setUserWallet] = useState(''); // auto-generated wallet
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [nextId, setNextId] = useState(1);

  // ── Restore session on mount (Strict RBAC Guard)
  useEffect(() => {
    const session = localStorage.getItem('bb_session');
    if (!session) { 
      router.push('/'); 
      return; 
    }

    try {
      const sess = JSON.parse(session);
      
      // Jika login sebagai role lain (misal Verificator/Admin), jangan kasih masuk
      if (sess.role !== 'user') {
        router.push(sess.role === 'admin' ? '/admin' : '/verificator');
        return;
      }

      const { name, email, wallet } = sess;
      setUserName(name || 'Investor');
      setUserEmail(email || '');
      setUserWallet(wallet || '');
      
      // Load from central DB
      fetch('/api/db?table=assets')
        .then(res => res.json())
        .then(all => {
          const parsed = all.filter((a: any) => a.ownerEmail === email || a.owner === wallet || a.owner === email);
          setAssets(parsed);
        }).catch(console.error);
    } catch (e) {
      localStorage.removeItem('bb_session');
      router.push('/');
    }
  }, [router]);

  const handleRegister = async (data: Omit<Asset, 'id' | 'date' | 'owner'>) => {
    const newAsset: Asset = {
      ...data,
      id: nextId,
      date: new Date().toLocaleDateString('id-ID'),
      owner: userWallet || userEmail,
      ownerEmail: userEmail,
    } as any;

    setAssets(prev => [...prev, newAsset]);
    setNextId(prev => prev + 1);

    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'assets', action: 'insert', payload: newAsset })
    });
  };

  const handleUpdateValuation = async (id: number) => {
    const newVal = prompt('Masukkan valuasi baru (USD):');
    if (!newVal || isNaN(Number(newVal))) return;
    const target = assets.find(a => a.id === id);
    if (!target) return;

    if (target.valuationUpdatePending) {
      alert('Anda sudah memiliki pengajuan update valuasi yang tertunda.');
      return;
    }

    const updatedAsset = {
      ...target,
      pendingValuation: Number(newVal),
      valuationUpdatePending: true
    };

    setAssets(prev => prev.map(a => a.id === id ? updatedAsset : a));

    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'assets', action: 'update', payload: updatedAsset })
    });

    alert('Permintaan update valuasi telah dikirim ke Validator.');
  };

  const handleArchive = async (id: number) => {
    if (!confirm('Yakin ingin mengarsipkan aset ini? Operasi ini tidak bisa dibatalkan.')) return;
    const target = assets.find(a => a.id === id);
    if (!target) return;
    const updatedAsset = { ...target, status: 'Archived' as AssetState };

    setAssets(prev => prev.map(a => a.id === id ? updatedAsset : a));

    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'assets', action: 'update', payload: updatedAsset })
    });
  };

  const handleTransfer = async (id: number) => {
    const to = prompt('Masukkan wallet address tujuan (0x...):');
    if (!to || !to.startsWith('0x')) return alert('Wallet address tidak valid.');

    const asset = assets.find(a => a.id === id);
    if (!asset) return;
    if (asset.status !== 'Verified') return alert('Hanya aset berstatus Verified yang bisa ditransfer.');

    if (!confirm(`Konfirmasi transfer aset #${id} ke wallet ${to}?`)) return;

    // 1. Update di Database Pusat
    // Kita cari apakah user tujuan ada di sistem (opsional, tapi bagus untuk sinkronisasi email)
    const usersRes = await fetch('/api/db?table=users');
    const allUsers: any[] = usersRes.ok ? await usersRes.json() : [];
    const targetUser = allUsers.find(u => u.wallet.toLowerCase() === to.toLowerCase());

    const updatedAsset = {
      ...asset,
      owner: to,
      ownerEmail: targetUser ? targetUser.email : `transferred_${to}` // email baru jika user terdaftar
    };

    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'assets', action: 'update', payload: updatedAsset })
    });

    // 2. Update UI (hapus dari list user saat ini karena sudah pindah tangan)
    setAssets(prev => prev.filter(a => a.id !== id));

    alert(`✅ Aset #${id} berhasil ditransfer ke ${to}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('bb_session');
    router.push('/');
  };

  // Derived stats
  const totalValue = assets.filter(a => a.status !== 'Archived').reduce((s, a) => s + a.valuation, 0);
  const verifiedCount = assets.filter(a => a.status === 'Verified').length;
  const pendingCount = assets.filter(a => a.status === 'Pending').length;

  // Category summaries
  const catSummaries = CATEGORIES.map(c => ({
    id: c,
    ...CATEGORY_META[c],
    count: assets.filter(a => a.category === c && a.status !== 'Archived').length,
    value: assets.filter(a => a.category === c && a.status !== 'Archived').reduce((s, a) => s + a.valuation, 0),
  }));

  const displayedAssets = selectedCategory
    ? assets.filter(a => a.category === selectedCategory && a.status !== 'Archived')
    : assets.filter(a => a.status !== 'Archived');

  const fmtUSD = (v: number) => '$' + v.toLocaleString('en-US');

  return (
    <>
      <AnimatePresence>
        {isModalOpen && <RegisterModal onClose={() => setIsModalOpen(false)} onRegister={handleRegister} />}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16 min-h-screen">

        {/* ── Subtle Background ── */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-50/80 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-50/60 rounded-full blur-[100px]" />
        </div>

        {/* ── Header ── */}
        <div className="pt-8 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-black text-slate-900 text-sm">{userName}</p>
              <div className="flex flex-col">
                {userWallet && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded border border-slate-200">
                      {userWallet}
                    </span>
                    <button onClick={() => { navigator.clipboard.writeText(userWallet); alert('Wallet copied!'); }} className="text-[9px] text-emerald-600 font-bold hover:underline">Copy</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Hero Stats Card ── */}
        <div className="bg-white border border-slate-200 rounded-3xl p-7 mb-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/80 rounded-full blur-[60px] pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            {/* Left: Total Value */}
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Portfolio Valuation</p>
              {assets.length === 0 ? (
                <div>
                  <p className="text-4xl font-black text-slate-300 tracking-tight">$0</p>
                  <p className="text-xs text-slate-400 mt-2">Belum ada aset terdaftar.</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{fmtUSD(totalValue)}</span>
                  {verifiedCount > 0 && (
                    <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                      {verifiedCount} Verified <CheckCircle2 size={11} className="inline ml-1" />
                    </span>
                  )}
                </motion.div>
              )}
            </div>
            {/* Right: Mini stats */}
            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xl font-black text-slate-900">{assets.filter(a => a.status !== 'Archived').length}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Assets</p>
              </div>
              <div className="text-center px-4 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xl font-black text-emerald-700">{verifiedCount}</p>
                <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">Verified</p>
              </div>
              <div className="text-center px-4 py-2.5 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xl font-black text-amber-700">{pendingCount}</p>
                <p className="text-[9px] text-amber-600 font-bold uppercase tracking-wider">Pending</p>
              </div>
              <button onClick={() => router.push('/register')}
                className="flex items-center gap-2 bg-slate-900 hover:bg-emerald-600 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all shadow-md group ml-2">
                <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Register Asset
              </button>
            </div>
          </div>
        </div>

        {/* ── Portfolio Categories ── */}
        <div className="mb-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Portfolio Category</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {catSummaries.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`text-left p-4 rounded-2xl border-2 transition-all ${selectedCategory === cat.id ? 'border-emerald-500 shadow-md shadow-emerald-500/10 bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${cat.bg} ${cat.color}`}>{cat.icon}</div>
                  <span className="text-[9px] font-black text-slate-400 uppercase">{cat.count} <span className="text-slate-300">assets</span></span>
                </div>
                <p className="font-black text-slate-800 text-sm">{cat.id}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  ✓ {CATEGORY_INSTITUTION[cat.id]}
                </p>
                <p className={`font-black text-base mt-0.5 ${cat.count > 0 ? cat.color : 'text-slate-300'}`}>
                  {cat.count > 0 ? fmtUSD(cat.value) : '$0'}
                </p>
              </button>
            ))}
          </div>
          {selectedCategory && (
            <button onClick={() => setSelectedCategory(null)} className="mt-2 text-[11px] text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1">
              <X size={11} /> Clear filter
            </button>
          )}
        </div>

        {/* ── Asset List ── */}
        <div>
          <div className="flex items-center justify-between mb-3 pl-1">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {selectedCategory ? `${selectedCategory} Assets` : 'All Assets'} — {displayedAssets.length} items
            </p>
            {assets.filter(a => a.status === 'Archived').length > 0 && (
              <button onClick={() => setSelectedCategory(null)} className="text-[11px] text-slate-400 hover:text-slate-600 font-bold">
                View Archived ({assets.filter(a => a.status === 'Archived').length})
              </button>
            )}
          </div>

          {displayedAssets.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-14 text-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 mx-auto mb-4">
                <Inbox size={24} className="text-slate-300" />
              </div>
              <p className="font-black text-slate-400 mb-1">Belum Ada Aset</p>
              <p className="text-slate-300 text-sm mb-5">Daftarkan aset fisik pertama Anda ke blockchain.</p>
              <button onClick={() => router.push('/register')} className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-emerald-700 transition-all">
                <Plus size={15} /> Register Asset Pertama
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {displayedAssets.map((asset, i) => {
                  const sm = STATUS_META[asset.status];
                  const cm = CATEGORY_META[asset.category];
                  return (
                    <motion.div key={asset.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${cm.bg} ${cm.color}`}>{cm.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-black text-slate-900">{asset.name}</p>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${sm.color}`}>{sm.label}</span>
                              {asset.valuationUpdatePending && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-200 animate-pulse">Update Pending</span>
                              )}
                              <span className="text-[9px] font-mono text-slate-400">#{asset.id}</span>
                            </div>
                            <p className="text-slate-400 text-xs mt-0.5">{asset.category} · Registered {asset.date}</p>
                            <p className="font-mono text-[10px] text-slate-300 mt-0.5 truncate" title={asset.documentHash}>📄 {asset.documentHash}</p>
                          </div>
                        </div>
                        {/* Right: valuation */}
                        <div className="text-right shrink-0">
                          <p className="font-black text-slate-900 text-lg">{fmtUSD(asset.valuation)}</p>
                          <p className="text-[10px] text-slate-400">Declared Value</p>
                        </div>
                      </div>

                      {/* Action Row */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
                        {/* updateValuation() */}
                        <button onClick={() => handleUpdateValuation(asset.id)}
                          disabled={asset.valuationUpdatePending}
                          className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-all ${asset.valuationUpdatePending ? 'bg-slate-50 text-slate-300' : 'bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600'}`}>
                          <RefreshCw size={11} className={asset.valuationUpdatePending ? '' : 'animate-spin-slow'} /> {asset.valuationUpdatePending ? 'Waiting Approval' : 'Update Valuasi'}
                        </button>
                        {/* transferAsset() — only Verified */}
                        {asset.status === 'Verified' && (
                          <button onClick={() => handleTransfer(asset.id)}
                            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg border border-slate-200 transition-all">
                            <Send size={11} /> Transfer Ownership
                          </button>
                        )}
                        {/* View stored doc from IndexedDB */}
                        <button onClick={async () => {
                          const record = await getFileFromIDB(asset.documentHash).catch(() => null);
                          if (!record) {
                            alert('File tidak ditemukan di storage lokal.\n\nFile ini mungkin diregistrasi di browser/komputer lain.\nHash: ' + asset.documentHash);
                            return;
                          }
                          const blob = new Blob([record.data], { type: record.type || 'application/octet-stream' });
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                          setTimeout(() => URL.revokeObjectURL(url), 10000);
                        }}
                          className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg border border-slate-200 transition-all">
                          <FolderOpen size={11} /> Buka Dokumen
                        </button>
                        {/* getAssetDetails info */}
                        <button onClick={() => alert(JSON.stringify({ id: asset.id, name: asset.name, category: asset.category, valuation: asset.valuation, state: asset.status, documentHash: asset.documentHash, registeredAt: asset.date }, null, 2))}
                          className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 transition-all">
                          <FileText size={11} /> Details
                        </button>
                        {/* archiveAsset() */}
                        {asset.status !== 'Archived' && (
                          <button onClick={() => handleArchive(asset.id)}
                            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg border border-red-100 transition-all ml-auto">
                            <Archive size={11} /> Archive
                          </button>
                        )}
                      </div>

                      {/* Pending notice */}
                      {asset.status === 'Pending' && (
                        <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                          <Clock size={12} className="text-amber-500 shrink-0" />
                          <p className="text-[11px] text-amber-700">Aset ini menunggu verifikasi dari Verificator resmi. Fee 0.001 ETH dalam escrow.</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
