'use client';

/**
 * VERIFICATOR — Proof-of-Access Mining System
 *
 * LOGIN:    Username + Password (SHA-256 hashed) — bukan random wallet
 * DOKUMEN:  IPFS gateway URL (accessible dari browser/komputer MANAPUN)
 * MINING:   SHA256(docHash + walletVerificator + nonce) → must start "000"
 * REWARD:   0.0008 ETH per verified asset (80% of validation fee)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Hash, Wallet, CheckCircle, XCircle,
  Clock, Search, RefreshCw, Zap, Lock, FileText,
  ChevronDown, ChevronUp, History, Coins, Inbox,
  Activity, Info, FolderOpen, Cpu, ExternalLink,
  TrendingUp, AlertTriangle, X, Eye, EyeOff, User, 
  Landmark, LogOut
} from 'lucide-react';
import { getIPFSUrl, isRealIPFSCID, getPublicGateways } from '@/lib/ipfs';
import { useVerifyAsset } from '@/hooks/useBangBang';
import { useAccount } from 'wagmi';
import type { VerificatorAccount } from '@/app/page';

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function sha256(msg: string): Promise<string> {
  const buf = new TextEncoder().encode(msg);
  const h = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(pw: string): Promise<string> { return sha256(pw); }

// IndexedDB fallback (jika file tersimpan di browser lokal)
async function getFileFromIDB(hash: string): Promise<{ name: string; type: string; data: ArrayBuffer } | null> {
  try {
    const db: IDBDatabase = await new Promise((res, rej) => {
      const req = indexedDB.open('BangBangFiles', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('documents', { keyPath: 'hash' });
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    return new Promise((res, rej) => {
      const tx = db.transaction('documents', 'readonly');
      const req = tx.objectStore('documents').get(hash);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => rej(req.error);
    });
  } catch { return null; }
}

// ─── Status ────────────────────────────────────────────────────────────────────
type AssetState = 'Pending' | 'Verified' | 'Selesai' | 'Rejected' | 'Archived' | 'Arsip';

interface QueueItem {
  id: number;
  name: string;
  category: string;
  owner: string;
  ownerEmail: string;
  valuation: number;
  date: string;
  documentHash: string;
  status: AssetState;
  valuationUpdatePending?: boolean;
  pendingValuation?: number;
}

interface MiningState {
  assetId: number;
  running: boolean;
  nonce: number;
  hashrate: number;
  proofHash: string;
  solved: boolean;
  totalTried: number;
  elapsed: number;
}

interface VerifyLog {
  id: number;
  assetId: number;
  assetName: string;
  action: 'Verified' | 'Rejected';
  timestamp: string;
  fee: string;
  proofHash?: string;
  nonce?: number;
  txHash?: string;
}

// ─── Mining config ────────────────────────────────────────────────────────────
const PROOF_DIFFICULTY = 3;
const PROOF_TARGET = '0'.repeat(PROOF_DIFFICULTY);

// ─── Component ────────────────────────────────────────────────────────────────
export default function VerificatorPage() {
  const router = useRouter();

  // ── Auth state (username + password — BUKAN random wallet)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [connected, setConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<VerificatorAccount | null>(null);
  const [wallet, setWallet] = useState('');

  // ── Dashboard data
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [logs, setLogs] = useState<VerifyLog[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'Pending' | 'All'>('Pending');
  const [totalEarned, setTotalEarned] = useState(0);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'queue' | 'tutorial' | 'account'>('queue');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  // ── Mining state (per asset)
  const [miningMap, setMiningMap] = useState<Record<number, MiningState>>({});
  const miningRefs = useRef<Record<number, boolean>>({});
  const timerRefs = useRef<Record<number, ReturnType<typeof setInterval>>>({});

  // ── File viewer modal
  const [fileModalHash, setFileModalHash] = useState<string | null>(null);
  const [fileRecord, setFileRecord] = useState<{ name: string; url: string; isIPFS: boolean } | null>(null);
  const [ipfsGateways, setIpfsGateways] = useState<string[]>([]);
  const [fileLoading, setFileLoading] = useState(false);

  // ── Restore session on mount (Strict RBAC Guard)
  useEffect(() => {
    const raw = localStorage.getItem('bb_session');
    if (!raw) {
      setConnected(false); // Pastikan login gate muncul
      return;
    }

    try {
      const sess = JSON.parse(raw);
      // Jika login sebagai role lain (misal User), tendang balik ke tempat asalnya
      if (sess.role !== 'verificator') {
         router.push(sess.role === 'admin' ? '/admin' : '/user');
         return;
      }

      if (!sess.username) return;

      fetch('/api/db?table=verificators')
        .then(res => res.json())
        .then(all => {
          const acc = all.find((a: any) => a.username === sess.username);
          if (acc && acc.status === 'approved') {
            setCurrentAccount(acc); setWallet(acc.wallet); setConnected(true);
          } else {
            // Akun mungkin di-suspend atau belum approved
            disconnect();
          }
        }).catch(console.error);
    } catch (e) {
      localStorage.removeItem('bb_session');
    }
  }, [router]);

  // ── Load data when connected (Filtered by Institution Categories)
  const loadQueue = useCallback(async () => {
    if (!currentAccount) return;
    try {
      // Map instansi ke daftar kategori yang relevan
      const categoryMap: Record<string, string[]> = {
        'BPN': ['Property', 'Tanah'],
        'Samsat': ['Vehicle', 'Kendaraan'],
        'Pegadaian': ['Gold', 'Emas', 'Logam Mulia'],
        'Kemenkeu': ['Other', 'Properti Lain', 'Sertifikat']
      };

      const validCategories = categoryMap[currentAccount.institution] || [];

      const resAssets = await fetch('/api/db?table=assets');
      const allAssets: QueueItem[] = resAssets.ok ? await resAssets.json() : [];
      
      // Filter: Hanya tampilkan aset yang sesuai dengan kategori instansi verifikator
      setQueue(allAssets.filter(a => validCategories.includes(a.category)));
    } catch (e) { console.error(e) }
  }, [currentAccount]);

  useEffect(() => {
    if (!connected || !wallet) return;
    loadQueue();
    // Fetch logs from Central DB & FILTER by Verificator Wallet
    fetch('/api/db?table=logs')
      .then(res => res.json())
      .then(stored => {
        // Hanya ambil log yang dikerjakan oleh wallet verifikator ini
        const myLogs = stored.filter((l: any) => l.verificator === wallet);
        setLogs(myLogs);
        setTotalEarned(myLogs.filter((l: VerifyLog) => l.action === 'Verified').length * 0.0008);
      }).catch(console.error);
  }, [connected, wallet, loadQueue]);

  // ── Login
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); setLoginError(''); setIsLoggingIn(true);

    // Tarik list validator dari CENTRAL DB (agar Sync)
    const res = await fetch('/api/db?table=verificators');
    const allAccounts: VerificatorAccount[] = res.ok ? await res.json() : [];

    const acc = allAccounts.find(a => a.username === username.trim().toLowerCase());
    if (!acc) {
      setIsLoggingIn(false);
      return setLoginError('Username tidak ditemukan. Pastikan sudah mendaftar.');
    }
    if (acc.status !== 'approved') {
      setIsLoggingIn(false);
      return setLoginError(`Akun belum disetujui SuperAdmin. Status: ${acc.status}.`);
    }
    const hash = await hashPassword(password);
    if (hash !== acc.passwordHash) {
      setIsLoggingIn(false);
      return setLoginError('Password salah.');
    }
    setCurrentAccount(acc); setWallet(acc.wallet); setConnected(true);
    localStorage.setItem('bb_session', JSON.stringify({
      role: 'verificator', username: acc.username, name: acc.name, wallet: acc.wallet, institution: acc.institution
    }));
    setIsLoggingIn(false);
  }, [username, password]);

  const disconnect = () => {
    setConnected(false); setCurrentAccount(null); setWallet('');
    localStorage.removeItem('bb_session');
    Object.keys(miningRefs.current).forEach(id => { miningRefs.current[Number(id)] = false; });
  };

  // ── Mining: SHA256(docHash + wallet + nonce) → must start with PROOF_TARGET
  const startMining = useCallback(async (item: QueueItem) => {
    if (miningRefs.current[item.id]) return;
    miningRefs.current[item.id] = true;
    const startTime = Date.now();
    let nonce = 0, batchStart = Date.now();

    setMiningMap(prev => ({
      ...prev,
      [item.id]: { assetId: item.id, running: true, nonce: 0, hashrate: 0, proofHash: '', solved: false, totalTried: 0, elapsed: 0 },
    }));

    timerRefs.current[item.id] = setInterval(() => {
      setMiningMap(prev => ({
        ...prev,
        [item.id]: { ...prev[item.id], elapsed: Math.floor((Date.now() - startTime) / 1000) },
      }));
    }, 500);

    const BATCH = 50;
    while (miningRefs.current[item.id]) {
      const input = `${item.documentHash}::${wallet}::${nonce}`;
      const hash = await sha256(input);
      nonce++;

      if (nonce % BATCH === 0) {
        const now = Date.now();
        const hr = Math.round(BATCH / ((now - batchStart) / 1000));
        batchStart = now;
        setMiningMap(prev => ({
          ...prev,
          [item.id]: { ...prev[item.id], nonce, hashrate: hr, totalTried: nonce, proofHash: hash.slice(0, 16) + '...' },
        }));
        await new Promise(r => setTimeout(r, 0));
      }

      if (hash.startsWith(PROOF_TARGET)) {
        clearInterval(timerRefs.current[item.id]);
        miningRefs.current[item.id] = false;
        setMiningMap(prev => ({
          ...prev,
          [item.id]: {
            assetId: item.id, running: false, nonce, hashrate: 0,
            proofHash: hash, solved: true, totalTried: nonce,
            elapsed: Math.floor((Date.now() - startTime) / 1000),
          },
        }));
        return;
      }
    }
    clearInterval(timerRefs.current[item.id]);
    setMiningMap(prev => ({ ...prev, [item.id]: { ...prev[item.id], running: false } }));
  }, [wallet]);

  const stopMining = (assetId: number) => {
    miningRefs.current[assetId] = false;
    clearInterval(timerRefs.current[assetId]);
    setMiningMap(prev => ({ ...prev, [assetId]: { ...prev[assetId], running: false } }));
  };

  const { verify, isPending: isVerifyPending } = useVerifyAsset();
  const { address: connectedWallet } = useAccount();

  // ── Submit verification (after proof solved)
  const handleVerify = async (item: QueueItem) => {
    const m = miningMap[item.id];
    if (!m?.solved) return;

    // ON-CHAIN VERIFICATION (Web3)
    let verifyTxHash = '';
    if (connectedWallet) {
      try {
        const tx = await verify(BigInt(item.id));
        verifyTxHash = tx;
      } catch (err: any) {
        console.error("Verification TX Failed:", err);
        if (!confirm("Transaksi Blockchain gagal di Metamask. Tetap simpan secara lokal (Simulasi)?")) return;
      }
    }

    // Update Asset Status di Central DB
    const updatedAsset = { ...item, status: 'Verified' as AssetState, txHash: verifyTxHash };
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'assets', action: 'update', payload: updatedAsset })
    });

    // Catat ke log (Sertakan identitas verifikator)
    const log: VerifyLog & { verificator: string; institution: string } = {
      id: Date.now(),
      assetId: item.id,
      assetName: item.name,
      action: 'Verified',
      timestamp: new Date().toLocaleString('id-ID'),
      fee: '0.0008 ETH',
      proofHash: m.proofHash,
      nonce: m.nonce,
      txHash: verifyTxHash,
      verificator: wallet, 
      institution: currentAccount?.institution || 'Unknown'
    };

    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'logs', action: 'insert', payload: log })
    });

    setLogs([log, ...logs]); setTotalEarned(p => p + 0.0008);
    setMiningMap(p => { const n = { ...p }; delete n[item.id]; return n; });
    loadQueue(); setExpandedId(null);
  };

  const handleReject = async (item: QueueItem) => {
    if (!confirm(`Tolak dan refund escrow ke owner "${item.name}"?`)) return;

    const updatedAsset = { ...item, status: 'Archived' as AssetState };
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'assets', action: 'update', payload: updatedAsset })
    });

    const log: VerifyLog & { verificator: string; institution: string } = { 
      id: Date.now(), 
      assetId: item.id, 
      assetName: item.name, 
      action: 'Rejected', 
      timestamp: new Date().toLocaleString('id-ID'), 
      fee: 'Refunded',
      verificator: wallet,
      institution: currentAccount?.institution || 'Unknown'
    };
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'logs', action: 'insert', payload: log })
    });

    setLogs([log, ...logs]); loadQueue(); setExpandedId(null);
  };

  const handleApproveValuation = async (item: QueueItem) => {
    if (!confirm(`Setujui pembaruan valuasi dari $${item.valuation.toLocaleString()} ke $${item.pendingValuation?.toLocaleString()}?`)) return;

    const updatedAsset = {
      ...item,
      valuation: item.pendingValuation,
      valuationUpdatePending: false,
      pendingValuation: null
    };

    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'assets', action: 'update', payload: updatedAsset })
    });

    const log: VerifyLog = { id: Date.now(), assetId: item.id, assetName: item.name, action: 'Verified', timestamp: new Date().toLocaleString('id-ID'), fee: 'Valuation Approved' };
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'logs', action: 'insert', payload: log })
    });

    showToast('✅ Valuasi disetujui secara on-chain.');
    loadQueue();
  };

  const handleRejectValuation = async (item: QueueItem) => {
    if (!confirm(`Tolak pembaruan valuasi untuk ${item.name}?`)) return;

    const updatedAsset = {
      ...item,
      valuationUpdatePending: false,
      pendingValuation: null
    };

    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'assets', action: 'update', payload: updatedAsset })
    });

    loadQueue();
  };

  // ── Open document: Cloud/IPFS dulu (global access), fallback IndexedDB (local)
  const openDocument = async (hash: string, directUrl?: string) => {
    setFileLoading(true); setFileModalHash(hash); setIpfsGateways([]);

    // 1) Cek apakah kita punya URL Awan langsung (Supabase/Pinata)
    if (directUrl && directUrl.startsWith('http')) {
      setFileRecord({ name: hash.slice(0, 20) + '...', url: directUrl, isIPFS: directUrl.includes('/ipfs/') });
      setFileLoading(false);
      return;
    }

    // 2) IPFS CID Legacy — fallback
    const ipfsUrl = getIPFSUrl(hash);
    if (ipfsUrl) {
      const gateways = getPublicGateways(hash);
      setIpfsGateways(gateways);
      setFileRecord({ name: hash.slice(0, 20) + '...', url: ipfsUrl, isIPFS: true });
      setFileLoading(false);
      return;
    }

    // 2) Fallback: IndexedDB (only on same browser/device)
    const rec = await getFileFromIDB(hash);
    if (rec) {
      const blob = new Blob([rec.data], { type: rec.type || 'application/octet-stream' });
      setFileRecord({ name: rec.name, url: URL.createObjectURL(blob), isIPFS: false });
    } else {
      setFileRecord(null);
    }
    setFileLoading(false);
  };

  const closeFileModal = () => {
    if (fileRecord && !fileRecord.isIPFS) URL.revokeObjectURL(fileRecord.url);
    setFileRecord(null); setFileModalHash(null); setIpfsGateways([]);
  };

  // ── Derived
  const pendingItems = queue.filter(a => a.status === 'Pending');
  const displayedQueue = queue.filter(a => {
    // Tampilkan jika: 
    // 1. Statusnya 'Pending' (registrasi baru)
    // 2. Ada update valuasi yang tertunda (registrasi lama tapi minta update)
    const isPendingAct = a.status === 'Pending' || a.valuationUpdatePending;
    const matchF = filter === 'All' || isPendingAct;
    const matchS = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.owner.toLowerCase().includes(search.toLowerCase());
    return matchF && matchS;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // LOGIN GATE — username + password (bukan random wallet!)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
        <div className="absolute w-[400px] h-[400px] bg-emerald-100/40 rounded-full blur-[80px] pointer-events-none top-0 left-0" />
        <div className="absolute w-[300px] h-[300px] bg-purple-100/30 rounded-full blur-[80px] pointer-events-none bottom-0 right-0" />

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl w-full max-w-md relative z-10">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">Portal Verifikator</h1>
              <p className="text-[11px] text-slate-400">Sistem Pencarian Bukti Akses</p>
            </div>
          </div>


          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Username</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2"><User size={14} className="text-slate-400" /></div>
                <input value={username} onChange={e => setUsername(e.target.value)} required
                  placeholder="username_verificator"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-mono focus:outline-none focus:border-emerald-500 transition-colors placeholder:font-sans placeholder:text-slate-300" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {loginError && <p className="text-red-500 text-xs bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{loginError}</p>}
            <button type="submit" disabled={isLoggingIn}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
              <ShieldCheck size={16} /> {isLoggingIn ? 'Memverifikasi...' : 'Masuk ke Portal'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center space-y-1">
            <p className="text-[11px] text-slate-400">
              Belum punya akun?{' '}
              <button onClick={() => router.push('/daftarvalidator')} className="text-emerald-600 font-bold hover:underline">Daftar di portal Validator</button>
            </p>
            <p className="text-[11px] text-slate-300">Akun harus disetujui SuperAdmin setelah mendaftar</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20 min-h-screen">

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 z-[500] bg-slate-900 border border-slate-700 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center font-black text-[10px]">✓</div>
            <span className="text-sm font-bold tracking-tight">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-50/60 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-50/60 rounded-full blur-[100px]" />
      </div>

      {/* ── Document Viewer Modal ── */}
      <AnimatePresence>
        {fileModalHash && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div>
                  <p className="font-black text-slate-900">Document Viewer</p>
                  <p className="font-mono text-[10px] text-slate-400 mt-0.5 break-all">{fileModalHash}</p>
                </div>
                <button onClick={closeFileModal} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-5">
                {fileLoading ? (
                  <div className="flex items-center justify-center h-48 gap-3 text-slate-400">
                    <Cpu size={20} className="animate-pulse" /><span className="text-sm font-bold">Membuka dokumen...</span>
                  </div>
                ) : fileRecord?.isIPFS ? (
                  <div className="space-y-4">
                    {/* IPFS — accessible from anywhere */}
                    <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                      <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-emerald-800 text-sm">File tersedia di IPFS</p>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          File ini dapat diakses dari <strong>browser manapun di seluruh dunia</strong> via IPFS gateway. Tidak terbatas pada browser atau komputer tertentu.
                        </p>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <iframe src={fileRecord.url} className="w-full h-[45vh]" title="Document preview" />
                    </div>

                    {/* Gateway links */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Public Gateways (buka dari device manapun)</p>
                      {ipfsGateways.map((gw, i) => (
                        <a key={i} href={gw} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-xs font-mono text-slate-600 hover:text-blue-700 transition-all">
                          <ExternalLink size={11} className="shrink-0" />
                          <span className="truncate">{gw}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : fileRecord ? (
                  // IndexedDB fallback
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-amber-800 text-sm">File dari cache lokal</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          File ini ditemukan di IndexedDB browser ini. Untuk akses global, owner perlu upload ke IPFS (aktifkan Pinata di .env.local).
                        </p>
                      </div>
                    </div>
                    <iframe src={fileRecord.url} className="w-full h-[45vh] rounded-xl border border-slate-200" title="Document" />
                  </div>
                ) : (
                  // Not found anywhere
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
                    <AlertTriangle size={28} className="text-amber-400" />
                    <div>
                      <p className="font-black text-slate-700">File tidak ditemukan</p>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Hash ini belum di-upload ke IPFS. Dalam produksi, setiap file otomatis di-pin ke Pinata sehingga verificator manapun dapat mengaksesnya via URL global.
                      </p>
                    </div>
                    <div className="font-mono text-[10px] bg-slate-100 rounded-xl px-3 py-2 text-slate-500 break-all w-full max-w-sm">
                      {fileModalHash}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-8 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-black text-slate-900 text-lg tracking-tight">{currentAccount?.name || 'Verificator'}</p>
              <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck size={9} /> Verificator Oracle
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadQueue} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 border border-slate-200 px-3 py-2 rounded-xl transition-all">
            <RefreshCw size={12} /> Refresh Data
          </button>
        </div>
      </div>


      {/* ── Stats (Filtered by Verificator's Work) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Antrean Masuk', value: pendingItems.length, icon: <Clock size={16} className="text-amber-500" />, bg: 'bg-amber-50 border-amber-100', c: 'text-amber-900' },
          { label: 'Berhasil Dicek', value: logs.filter(l => l.action === 'Verified').length, icon: <CheckCircle size={16} className="text-emerald-500" />, bg: 'bg-emerald-50 border-emerald-100', c: 'text-emerald-900' },
          { label: 'Ditolak', value: logs.filter(l => l.action === 'Rejected').length, icon: <XCircle size={16} className="text-red-400" />, bg: 'bg-red-50 border-red-100', c: 'text-red-900' },
          { label: 'Upah (ETH)', value: `${totalEarned.toFixed(4)} ETH`, icon: <Coins size={16} className="text-blue-500" />, bg: 'bg-blue-50 border-blue-100', c: 'text-blue-900' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${s.bg}`}>{s.icon}</div>
            <div>
              <p className={`text-xl font-black ${s.c}`}>{s.value}</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs Switcher ── */}
      <div className="flex bg-white/50 backdrop-blur border border-slate-200 p-1 rounded-2xl mb-6 w-full sm:w-fit overflow-x-auto">
        {[
          { id: 'queue', label: 'Antrian Kerja', icon: <Inbox size={16} /> },
          { id: 'tutorial', label: 'Panduan & Tutorial', icon: <Info size={16} /> },
          { id: 'account', label: 'Info Akun', icon: <User size={16} /> }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Main Panel ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Left Content: Queue or Tutorial ── */}
        <div className={`${activeTab === 'queue' ? 'xl:col-span-2' : 'xl:col-span-3'} space-y-5 transition-all duration-500`}>
          {activeTab === 'queue' ? (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h2 className="font-black text-slate-900">Antrian Aset</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Ada {pendingItems.length} aset nih yang nunggu dicek</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex bg-slate-50 rounded-xl p-0.5 border border-slate-200">
                {(['Pending', 'All'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter === f ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="relative flex-1">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari aset..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {displayedQueue.length === 0 ? (
              <div className="py-14 text-center">
                <Inbox size={24} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-bold text-sm">Tidak ada aset ditemukan</p>
                <p className="text-slate-300 text-xs mt-1">{filter === 'Pending' ? 'Semua aset sudah diproses.' : 'Belum ada aset terdaftar.'}</p>
              </div>
            ) : displayedQueue.map(item => {
              const m = miningMap[item.id];
              const hasMined = m?.solved;
              const isMining = m?.running;
              return (
                <div key={item.id}>
                  <div className="p-5 hover:bg-slate-50/50 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${hasMined ? 'bg-emerald-100 border border-emerald-200' : isMining ? 'bg-orange-100 border border-orange-200' : 'bg-slate-100'}`}>
                          {hasMined ? <CheckCircle size={16} className="text-emerald-500" /> : isMining ? <Zap size={16} className="text-orange-500 animate-pulse" /> : <FileText size={16} className="text-slate-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${item.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : item.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{item.status}</span>
                            {hasMined && <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">⛏️ Proof Ready</span>}
                            {isMining && <span className="text-[9px] font-black text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full animate-pulse">Mining...</span>}
                            {isRealIPFSCID(item.documentHash) && <span className="text-[9px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">🌐 IPFS</span>}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-slate-400">
                            <span>{item.category}</span>
                            <span className="text-slate-200">·</span>
                            <span className="font-mono">{item.owner.slice(0, 12)}...</span>
                            <span className="text-slate-200">·</span>
                            <span>{item.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-black text-slate-900 text-base">${item.valuation.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">Declared</p>
                        </div>
                        {expandedId === item.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === item.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-100">
                        <div className="p-5 bg-slate-50/50 space-y-4">

                          {/* Details grid */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            {[
                              { label: 'ID Aset', value: `#${item.id}` },
                              { label: 'Kategori', value: item.category },
                              { label: 'Status Sekarang', value: item.status },
                              { label: 'Email Pemilik', value: item.ownerEmail },
                              { label: 'Tanggal Daftar', value: item.date },
                              { label: 'Nilai Aset', value: `$${item.valuation.toLocaleString()}` },
                            ].map((d, i) => (
                              <div key={i} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{d.label}</p>
                                <p className="font-bold text-slate-800 truncate">{d.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Document hash + open button */}
                          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Document Hash</p>
                            <div className="flex items-start gap-2">
                              <Hash size={12} className={`shrink-0 mt-0.5 ${isRealIPFSCID(item.documentHash) ? 'text-blue-500' : 'text-slate-400'}`} />
                              <p className="font-mono text-xs text-slate-700 break-all flex-1 leading-relaxed">{item.documentHash}</p>
                              <div className="flex flex-col gap-1.5 shrink-0">
                                {item.documentUrl ? (
                                  <a href={item.documentUrl} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-[10px] rounded-lg border border-blue-100 transition-all">
                                    <ExternalLink size={10} /> Cloud
                                  </a>
                                ) : (
                                  <button onClick={e => { e.stopPropagation(); openDocument(item.documentHash, item.documentUrl); }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black text-[10px] rounded-lg border border-slate-200 transition-all">
                                    <FolderOpen size={10} /> Lokal
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Mining panel */}
                          {item.status === 'Pending' && (
                            <div className={`rounded-2xl border p-4 ${hasMined ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-900 border-slate-700'}`}>
                              <div className="flex items-center gap-2 mb-3">
                                <Cpu size={14} className={hasMined ? 'text-emerald-500' : 'text-orange-400'} />
                                <p className={`font-black text-sm ${hasMined ? 'text-emerald-800' : 'text-white'}`}>
                                  {hasMined ? '✅ Proof-of-Access Solved!' : '⛏️ Proof-of-Access Mining'}
                                </p>
                              </div>

                              {!hasMined && (
                                <div className="space-y-2 mb-3">
                                  <div className="font-mono text-[10px] text-slate-400 bg-slate-800 rounded-xl px-3 py-2 leading-relaxed">
                                    <p className="text-slate-500 mb-1">Cara sistem kita nemuin bukti:</p>
                                    <p>SHA256(<span className="text-blue-300">&quot;{item.documentHash.slice(0, 12)}...&quot;</span></p>
                                    <p className="pl-6">+ <span className="text-purple-300">&quot;{wallet.slice(0, 10)}...&quot;</span></p>
                                    <p className="pl-6">+ <span className="text-amber-300">nonce</span>) → diawali <span className="text-orange-300">&quot;{PROOF_TARGET}&quot;</span></p>
                                  </div>
                                  {m && (
                                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                                      <div className="bg-slate-800 rounded-lg px-2 py-1.5 text-center">
                                        <p className="text-slate-500">Nonce</p><p className="text-white font-mono font-bold">{m.nonce.toLocaleString()}</p>
                                      </div>
                                      <div className="bg-slate-800 rounded-lg px-2 py-1.5 text-center">
                                        <p className="text-slate-500">Kec. Mining</p><p className="text-orange-400 font-bold">{m.hashrate}</p>
                                      </div>
                                      <div className="bg-slate-800 rounded-lg px-2 py-1.5 text-center">
                                        <p className="text-slate-500">Waktu</p><p className="text-white font-bold">{m.elapsed}s</p>
                                      </div>
                                    </div>
                                  )}
                                  {m?.running && (
                                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                      <motion.div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                                        animate={{ width: ['10%', '80%', '30%', '70%', '50%'] }}
                                        transition={{ duration: 1.5, repeat: Infinity }} />
                                    </div>
                                  )}
                                </div>
                              )}

                              {hasMined && (
                                <div className="space-y-2 mb-3">
                                  <div className="font-mono text-[10px] text-emerald-700 bg-emerald-100 rounded-xl px-3 py-2 space-y-1">
                                    <p><span className="text-emerald-600">Nonce:</span> <strong>{m.nonce.toLocaleString()}</strong></p>
                                    <p><span className="text-emerald-600">Kode Bukti:</span> <span className="break-all">{m.proofHash.slice(0, 48)}...</span></p>
                                    <p><span className="text-emerald-600">Total Percobaan:</span> {m.totalTried.toLocaleString()} dalam {m.elapsed}s</p>
                                  </div>
                                  <p className="text-[11px] text-emerald-700 font-bold">Bukti valid — kamu terbukti memiliki hash dokumen ini. Submit verifikasi!</p>
                                </div>
                              )}

                              <div className="flex gap-2 flex-wrap">
                                {!hasMined && !isMining && (
                                  <button onClick={e => { e.stopPropagation(); startMining(item); }}
                                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/20">
                                    <Zap size={13} /> Start Mining Proof
                                  </button>
                                )}
                                {isMining && (
                                  <button onClick={e => { e.stopPropagation(); stopMining(item.id); }}
                                    className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all">
                                    ⏹ Stop
                                  </button>
                                )}
                                {hasMined && (
                                  <>
                                    <button onClick={e => { e.stopPropagation(); handleVerify(item); }}
                                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-2.5 rounded-xl transition-all">
                                      <CheckCircle size={15} /> Selesaikan Verifikasi (Submit)
                                    </button>
                                    <button onClick={e => { e.stopPropagation(); handleReject(item); }}
                                      className="flex items-center gap-2 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white font-black text-sm px-4 py-2.5 rounded-xl border border-red-100 transition-all">
                                      <XCircle size={15} /> Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {item.status !== 'Pending' && (
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold ${item.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                              {item.status === 'Verified' ? <><CheckCircle size={15} /> Asset sudah terverifikasi</> : <><XCircle size={15} /> Asset ditolak / diarsipkan</>}
                            </div>
                          )}

                          {item.valuationUpdatePending && (
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <RefreshCw size={14} className="text-blue-500 animate-spin-slow" />
                                <p className="font-black text-blue-900 text-sm">Permintaan Update Valuasi</p>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Valuasi Saat Ini:</span>
                                <span className="font-black text-slate-900">${item.valuation.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Valuasi Baru diajukan:</span>
                                <span className="font-black text-blue-600 text-lg">${(item.pendingValuation || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={e => { e.stopPropagation(); handleApproveValuation(item); }}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-2 rounded-xl transition-all">
                                  Setujui Valuasi
                                </button>
                                <button onClick={e => { e.stopPropagation(); handleRejectValuation(item); }}
                                  className="px-4 bg-white hover:bg-red-50 text-red-500 font-black text-xs py-2 rounded-xl border border-red-100 transition-all">
                                  Tolak
                                </button>
                              </div>
                            </div>
                          )}

                          {item.status === 'Pending' && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-xs flex justify-between">
                              <span className="text-emerald-700">Kamu (80%) ← <strong>0.0008 ETH</strong></span>
                              <span className="text-slate-500">SuperAdmin (20%) ← 0.0002 ETH</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
              </div>
            </div>
          ) : activeTab === 'tutorial' ? (
            /* ── TUTORIAL TAB ── */
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} 
              className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <Info size={20} />
                </div>
                Gimana Sih Cara Kerjanya?
              </h2>
              <p className="text-slate-400 text-sm mb-10 pl-1">Pelajari alur teknis dari verifikasi berkas hingga cairnya reward ETH di dompetmu.</p>

              <div className="space-y-12">
                {[
                  { 
                    title: '1. Integritas Data (SHA-256 Hashing)', 
                    desc: 'Setiap dokumen yang diupload owner punya "sidik jari digital" unik yang disebut SHA-256 Hash. Kalau isi dokumen berubah satu titik pun, kodenya bakal ganti total. Tugasmu adalah memastikan hash yang ada di sistem cocok dengan dokumen fisik yang kamu periksa.',
                    icon: <Hash className="text-blue-500" />,
                    color: 'bg-blue-50',
                    tag: 'Integritas'
                  },
                  { 
                    title: '2. Proof-of-Access (Nonce Mining)', 
                    desc: 'Untuk membuktikan kamu punya akses ke berkas tersebut, kamu harus melakukan "Mining". Sistem akan mengacak angka rahasia (Nonce) dan menggabungkannya dengan Hash Dokumen + Alamat Wallet kamu. Kamu harus menemukan Nonce yang menghasilkan kode berawalan setidaknya tiga angka nol ("000"). Ini memastikan verifikator beneran kerja, bukan bot.',
                    icon: <Zap className="text-orange-500" />,
                    color: 'bg-orange-50',
                    tag: 'Proof-of-Work'
                  },
                  { 
                    title: '3. Finalisasi & On-Chain Reward', 
                    desc: 'Begitu Nonce ditemukan, kamu bisa menekan tombol "Selesaikan Verifikasi". Sistem bakal ngirim bukti kerja kamu ke Smart Contract di blockchain. Jika beneran sah, status aset bakal berubah jadi "Selesai" secara permanen, dan kamu otomatis dapet jatah upah 0.0008 ETH langsung ke Metamask.',
                    icon: <Coins className="text-emerald-500" />,
                    color: 'bg-emerald-50',
                    tag: 'Income'
                  }
                ].map((s, i) => (
                  <div key={i} className="flex gap-6 relative group">
                    {i < 2 && <div className="absolute left-7 top-14 bottom-[-48px] w-px bg-slate-100" />}
                    <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-sm relative z-10 transition-transform group-hover:scale-110 ${s.color}`}>
                      {s.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-lg font-black text-slate-900">{s.title}</h3>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-200">{s.tag}</span>
                      </div>
                      <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-14 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
                  <ShieldCheck size={180} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-16 h-16 bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 rounded-3xl flex items-center justify-center shrink-0">
                    <Lock size={30} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-black text-xl mb-2 text-emerald-400">Penting untuk Verificator</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="flex items-start gap-2">
                          <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-1" />
                          <p className="text-slate-400 text-xs">Pastikan Metamask terhubung ke jaringan <strong>Base Sepolia</strong> sebelum klik Submit.</p>
                       </div>
                       <div className="flex items-start gap-2">
                          <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-1" />
                          <p className="text-slate-400 text-xs">Makin tinggi spesifikasi komputermu, proses <strong>Mining</strong> akan makin instan.</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── ACCOUNT TAB ── */
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} 
              className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <User size={20} />
                </div>
                Informasi Akun Oracle
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  {[
                    { label: 'Nama Lengkap', value: currentAccount?.name, icon: <User size={14} /> },
                    { label: 'Username', value: `@${currentAccount?.username}`, icon: <Hash size={14} /> },
                    { label: 'Institusi Resmi', value: currentAccount?.institution, icon: <Landmark size={14} /> },
                    { label: 'Status Akun', value: currentAccount?.status, icon: <ShieldCheck size={14} /> },
                  ].map((f, i) => (
                    <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        {f.icon} {f.label}
                      </p>
                      <p className="font-bold text-slate-900">{f.value || '-'}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                   <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={80} /></div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">System Wallet (Hot Wallet)</p>
                      <p className="font-mono text-xs text-emerald-400 break-all mb-4 relative z-10">{wallet}</p>
                      <button onClick={() => { navigator.clipboard.writeText(wallet); alert('Copied!'); }}
                        className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black transition-all">
                        Copy Address
                      </button>
                   </div>
                   
                   <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Penghasilan</p>
                      <p className="text-3xl font-black text-emerald-700">{totalEarned.toFixed(4)} ETH</p>
                      <p className="text-[10px] text-emerald-600/60 mt-1">Komisi ini otomatis masuk ke Metamask kamu setiap transaksi sukses.</p>
                   </div>

                   <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                         <Wallet size={12} /> Terhubung ke Metamask
                      </p>
                      <p className="font-mono text-[11px] text-blue-700 break-all">
                        {connectedWallet || 'Tidak terdeteksi. Pastikan Metamask menyala!'}
                      </p>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* ── Right Panel ── */}
        <div className="space-y-4">
          {/* Activity Log (HANYA ADA DI TAB ANTRIAN KERJA) */}
          {activeTab === 'queue' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
                <History size={14} className="text-slate-400" /> Riwayat Kerjamu
              </h3>
              {logs.length === 0 ? (
                <div className="py-8 text-center">
                  <TrendingUp size={20} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs font-bold">Belum ada aktivitas</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {logs.map((log, i) => (
                    <div key={i} className={`px-3 py-2.5 rounded-xl text-[11px] border ${log.action === 'Verified' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                      <div className="flex items-start gap-2">
                        {log.action === 'Verified' ? <CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" /> : <XCircle size={12} className="text-red-400 shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 truncate">{log.assetName}</p>
                          <p className="text-slate-400 text-[10px]">{log.timestamp} · Upah: {log.fee}</p>
                          {log.proofHash && <p className="font-mono text-[9px] text-slate-300 truncate mt-0.5">proof: {log.proofHash.slice(0, 20)}...</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



