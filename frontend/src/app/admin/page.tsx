'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, UserPlus, Fingerprint, Coins, Database, Trash2,
  ShieldCheck, CheckCircle2, Navigation, ArrowRight, Clock, LogOut,
  Bell, TrendingUp, Hash, RefreshCw, AlertTriangle, Activity,
  Landmark, Car, Package
} from 'lucide-react';

// ─── Institution Role Config ──────────────────────────────────────────────────
type Institution = 'BPN' | 'Samsat' | 'Pegadaian' | 'Kemenkeu';

interface InstitutionConfig {
  id: Institution;
  label: string;
  fullName: string;
  color: string;
  bg: string;
  border: string;
  icon: string; // lucide icon name
  categories: string[];
  desc: string;
}

const INSTITUTIONS: InstitutionConfig[] = [
  { id: 'BPN', label: 'BPN', fullName: 'Badan Pertanahan Nasional', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'Landmark', categories: ['Property', 'Tanah'], desc: 'Verifikasi aset berupa tanah dan properti (SHM, HGB, SHGB)' },
  { id: 'Samsat', label: 'Samsat', fullName: 'Sistem Administrasi Manunggal Satu Atap', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: 'Car', categories: ['Vehicle', 'Kendaraan'], desc: 'Verifikasi kepemilikan kendaraan bermotor (BPKB, STNK)' },
  { id: 'Pegadaian', label: 'Pegadaian', fullName: 'PT Pegadaian (Persero)', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: 'Coins', categories: ['Gold', 'Emas'], desc: 'Verifikasi aset logam mulia dan sertifikat emas (Antam, LM)' },
  { id: 'Kemenkeu', label: 'Kemenkeu', fullName: 'Kementerian Keuangan RI', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: 'Package', categories: ['Other', 'Properti Lain'], desc: 'Verifikasi aset lainnya yang tidak masuk BPN/Samsat/Pegadaian' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function sha256Hex(msg: string): Promise<string> {
  const buf = new TextEncoder().encode(msg);
  const h = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateWalletFromSeed(seed: string): Promise<string> {
  const hash = await sha256Hex(seed);
  return '0x' + hash.slice(0, 40);
}
interface PendingVerificator {
  name: string;
  username?: string;  // dari sistem baru (bb_verificator_accounts)
  wallet: string;
  institution: string;
  date: string;
}

interface ActiveVerificator {
  wallet: string;
  name: string;
  institution: string;
  appointedAt: string;
  verifiedCount: number;
}

interface UserAccount {
  email: string;
  name: string;
  wallet: string;
  registeredAt?: string;
}

interface AuditEntry {
  assetId: number;
  assetName: string;
  action: 'Verified' | 'Rejected';
  timestamp: string;
  fee: string;
}

function loadActiveVerificators(): ActiveVerificator[] {
  return JSON.parse(localStorage.getItem('bb_active_verificators') || '[]');
}

function saveActiveVerificators(v: ActiveVerificator[]) {
  localStorage.setItem('bb_active_verificators', JSON.stringify(v));
}

function loadAllAssets(): { status: string }[] {
  const all: { status: string }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('bb_assets_')) {
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      all.push(...list);
    }
  }
  return all;
}

function loadAuditLog(): AuditEntry[] {
  return JSON.parse(localStorage.getItem('bb_verif_logs') || '[]');
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newName, setNewName] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [vNIP, setVNIP] = useState('');
  const [vStep, setVStep] = useState<1 | 2>(1);
  const [selectedInst, setSelectedInst] = useState<InstitutionConfig | null>(null);
  const [pendingVerificators, setPendingVerificators] = useState<PendingVerificator[]>([]);
  const [activeVerificators, setActiveVerificators] = useState<ActiveVerificator[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [allAssets, setAllAssets] = useState<{ status: string }[]>([]);
  const [toast, setToast] = useState('');
  const [feeInput, setFeeInput] = useState('0.001');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  // Auto-generate wallet
  useEffect(() => {
    if (selectedInst && newUsername && vNIP) {
      const seed = `Admin::${selectedInst.id}::${newUsername.toLowerCase()}::${vNIP}::CreatedByAdmin`;
      generateWalletFromSeed(seed).then(setNewAddress);
    } else {
      setNewAddress('');
    }
  }, [selectedInst, newUsername, vNIP]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/db');
      const data = await res.json();
      setPendingVerificators(data.pending_verificators || []);
      setActiveVerificators(data.active_verificators || []);
      setAuditLog(data.logs || []);
      setAllAssets(data.assets || []);
      setUsers(data.users || []); // PURE CENTRAL DATA
    } catch (e) {
      console.error("Refresh failed:", e);
    }
  }, []);

  // ── Restore session on mount (Strict RBAC Guard)
  useEffect(() => {
    const session = localStorage.getItem('bb_session');
    if (!session) return; // Jika belum login, biar Login Gate Admin yang muncul
    
    try {
      const sess = JSON.parse(session);
      
      // Jika login tapi rolenya BUKAN admin (misal User/Verif iseng kesini), tendang balik!
      if (sess.role !== 'admin') {
        router.push(sess.role === 'user' ? '/user' : '/verificator');
        return;
      }
      
      setIsAuthenticated(true);
    } catch (e) {
      localStorage.removeItem('bb_session');
    }
  }, [router]);

  useEffect(() => {
    if (isAuthenticated) refresh();
  }, [isAuthenticated, refresh]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (username === 'admin' || username.startsWith('0x')) &&
      (password === 'admin' || password === 'bangbang_superadmin_2024')
    ) {
      localStorage.setItem('bb_session', JSON.stringify({ role: 'admin', wallet: username }));
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Kredensial tidak valid. Gunakan: admin / admin');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bb_session');
    router.push('/');
  };

  const handleRejectPending = async (wallet: string) => {
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'pending_verificators', action: 'delete', payload: { wallet } })
    });
    showToast('❌ Permintaan ditolak & dihapus dari queue.');
    refresh();
  };

  // ── Appoint verificator (simulate on-chain appointVerificator())
  const handleApproveVerificator = async (v: PendingVerificator) => {
    // Check duplicate
    if (activeVerificators.find(a => a.wallet.toLowerCase() === v.wallet.toLowerCase())) {
      showToast('⚠️ Wallet sudah terdaftar sebagai Verificator aktif.');
      return;
    }

    const newActive: ActiveVerificator = {
      wallet: v.wallet,
      name: v.name,
      institution: v.institution,
      appointedAt: new Date().toLocaleDateString('id-ID'),
      verifiedCount: 0,
    };

    // 1. ADD TO ACTIVE_VERIFICATORS
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'active_verificators', action: 'insert', payload: newActive })
    });

    // 2. REMOVE FROM PENDING
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'pending_verificators', action: 'delete', payload: { wallet: v.wallet } })
    });

    // 3. UPDATE STATUS IN VERIFICATORS (untuk Login)
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'verificators', action: 'update', payload: { username: v.username, status: 'approved' } })
    });

    // 4. ADD TO WHITELIST
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'verificator_whitelist', action: 'update', payload: { [v.wallet.toLowerCase()]: true } })
    });

    showToast(`✅ appointVerificator(${v.wallet}) — ${v.name} [${v.institution}] kini aktif!`);
    refresh();
  };

  const handleManualAppoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress || !newUsername || !newPassword || !selectedInst) {
      showToast('⚠️ Lengkapi semua data dan kredensial.');
      return;
    }

    const hashedPassword = await sha256Hex(newPassword);

    const newActive: ActiveVerificator = {
      wallet: newAddress,
      name: newName,
      institution: selectedInst.id,
      appointedAt: new Date().toLocaleDateString('id-ID'),
      verifiedCount: 0,
    };

    const newAccount = {
      username: newUsername.toLowerCase(),
      passwordHash: hashedPassword,
      wallet: newAddress,
      name: newName,
      institution: selectedInst.id,
      status: 'approved',
      registeredAt: new Date().toISOString()
    };

    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'batch',
        payload: [
          { table: 'active_verificators', action: 'insert', payload: newActive },
          { table: 'verificators', action: 'insert', payload: newAccount },
          { table: 'verificator_whitelist', action: 'update', payload: { [newAddress.toLowerCase()]: true } }
        ]
      })
    });

    showToast(`✅ Akun @${newUsername} aktif sebagai Validator ${selectedInst.label}!`);
    setNewAddress(''); setNewName(''); setNewUsername(''); setNewPassword(''); setVNIP('');
    setSelectedInst(null); setVStep(1);
    refresh();
  };

  // ── Revoke verificator (simulate removeVerificator())
  const handleRevoke = async (wallet: string) => {
    if (!confirm(`Cabut wewenang Verificator ${wallet}? Operasi ini tidak dapat dibatalkan.`)) return;

    // Use BATCH action to prevent race conditions in data_db.json
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'batch',
        payload: [
          { table: 'active_verificators', action: 'delete', payload: { wallet } },
          { table: 'verificator_whitelist', action: 'update', payload: { [wallet.toLowerCase()]: false } },
          { table: 'verificators', action: 'delete', payload: { wallet } }
        ]
      })
    });

    showToast(`🗑️ removeVerificator(${wallet}) — wewenang dicabut.`);
    refresh();
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Hapus akun user ${email}? Semua data aset milik email ini juga akan diarsipkan.`)) return;

    // Find assets belonging to this user to archive them
    const userAssets: any[] = (await (await fetch('/api/db?table=assets')).json());
    const assetsToArchive = userAssets.filter(a => a.ownerEmail === email && a.status !== 'Archived');

    const ops = [
      { table: 'users', action: 'delete', payload: { email } }
    ];

    assetsToArchive.forEach(a => {
      ops.push({ table: 'assets', action: 'update', payload: { id: a.id, status: 'Archived' } });
    });

    // 1. Update Central DB via BATCH
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'batch', payload: ops })
    });

    // 2. Update LocalStorage (Legacy support)
    const usersObj = JSON.parse(localStorage.getItem('bb_users') || '{}');
    delete usersObj[email];
    localStorage.setItem('bb_users', JSON.stringify(usersObj));

    showToast(`🗑️ User ${email} dan aset terkait berhasil dihapus.`);
    refresh();
  };

  // ── Stats
  const totalAssets = allAssets.length;
  const verifiedAssets = allAssets.filter(a => a.status === 'Verified').length;
  const pendingAssets = allAssets.filter(a => a.status === 'Pending').length;
  const protocolFees = (verifiedAssets * 0.001 * 0.20).toFixed(4);

  // ─── Login Gate ──────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }} transition={{ duration: 20, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-red-50/30 -z-10" />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl w-full max-w-sm">
          <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mb-5">
            <ShieldAlert size={24} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">SuperAdmin</h1>
          <p className="text-slate-400 text-sm mb-6">Login: <code className="bg-slate-100 px-1 rounded font-mono text-xs">admin</code> / <code className="bg-slate-100 px-1 rounded font-mono text-xs">admin</code></p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input value={username} onChange={e => setUsername(e.target.value)} required
              placeholder="Username atau 0x address"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 transition-colors" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Password"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 transition-colors" />
            {error && <p className="text-red-500 text-xs bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" className="w-full bg-slate-900 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group">
              Akses Console <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-8 pt-8 px-4 md:px-8 pb-16 relative min-h-screen">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Abstract bg */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-50/60 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Title (Minimalist replacement if needed, or just remove) */}
      <h2 className="text-2xl font-black text-slate-900 px-1">Ringkasan Sistem</h2>

      {/* Stats — live from localStorage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets Registered', value: totalAssets.toString(), icon: <Database size={20} className="text-blue-500" />, bg: 'bg-blue-50 border-blue-100' },
          { label: 'Protocol Fees (20%)', value: `${protocolFees} ETH`, icon: <Coins size={20} className="text-emerald-500" />, bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Active Verificators', value: activeVerificators.length.toString(), icon: <ShieldCheck size={20} className="text-purple-500" />, bg: 'bg-purple-50 border-purple-100' },
          { label: 'Pending Approval', value: pendingVerificators.length.toString(), icon: <Clock size={20} className="text-amber-500" />, bg: 'bg-amber-50 border-amber-100' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${s.bg}`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Protocol Health */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap gap-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-emerald-500" />
          <span className="text-xs font-bold text-slate-700">Verified: <span className="text-emerald-600">{verifiedAssets}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-amber-500" />
          <span className="text-xs font-bold text-slate-700">Pending: <span className="text-amber-600">{pendingAssets}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-blue-500" />
          <span className="text-xs font-bold text-slate-700">Total Escrow Processed: <span className="text-blue-600">{(verifiedAssets * 0.001).toFixed(4)} ETH</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Hash size={14} className="text-slate-400" />
          <span className="text-xs font-mono text-slate-400">Validation Fee: {feeInput} ETH</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Management Column */}
        <div className="lg:col-span-8 space-y-6">

          {/* Pending Verificators from Registration */}
          {pendingVerificators.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-3xl p-6 md:p-8">
              <h2 className="text-lg font-black text-amber-900 mb-5 flex items-center gap-3">
                <Bell className="text-amber-500" size={20} /> Permintaan Verificator — Pending ({pendingVerificators.length})
              </h2>
              <div className="space-y-3">
                {pendingVerificators.map((v, i) => (
                  <div key={i} className="bg-white border border-amber-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900">{v.name}</p>
                        {v.institution && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${v.institution === 'BPN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              v.institution === 'Samsat' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                v.institution === 'Pegadaian' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>{v.institution}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{(v as { fullInst?: string }).fullInst || v.institution}</p>
                      {v.username && <p className="font-mono text-[11px] text-slate-400 mt-0.5">@{v.username}</p>}
                      <p className="font-mono text-[11px] text-slate-400 mt-0.5">{v.wallet}</p>
                      <p className="text-[10px] text-slate-400">{v.date}</p>
                    </div>
                    <div className="flex gap-2">
                      {/* → calls appointVerificator(address, institution) on-chain */}
                      <button onClick={() => handleApproveVerificator(v)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all">
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button onClick={() => handleRejectPending(v.wallet)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white font-bold text-xs rounded-xl border border-red-100 transition-all">
                        <Trash2 size={14} /> Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {pendingVerificators.length === 0 && (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-6 flex items-center gap-3 text-slate-400">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <p className="text-sm font-bold">Tidak ada permintaan Verificator yang menunggu. ✓</p>
            </div>
          )}

          {/* Form: Appoint Verificator Manual */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 -z-10" />

            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <UserPlus className="text-emerald-500" size={24} /> Buat Akun Verificator
              </h3>
              <div className="flex gap-2">
                {[1, 2].map(s => (
                  <div key={s} className={`w-8 h-1.5 rounded-full ${vStep >= s ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {vStep === 1 ? (
                <motion.div key="vstep1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">PILIH INSTITUSI VALIDATOR</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {INSTITUTIONS.map((inst) => (
                      <button key={inst.id} onClick={() => { setSelectedInst(inst); setVStep(2); }}
                        className={`text-left p-4 rounded-2xl border-2 transition-all hover:shadow-md group ${inst.bg} ${inst.border} hover:border-emerald-400`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${inst.border} bg-white ${inst.color}`}>
                          {inst.id === 'BPN' && <Landmark size={20} />}
                          {inst.id === 'Samsat' && <Car size={20} />}
                          {inst.id === 'Pegadaian' && <Coins size={20} />}
                          {inst.id === 'Kemenkeu' && <Package size={20} />}
                        </div>
                        <p className={`font-black text-sm ${inst.color}`}>{inst.label}</p>
                        <p className="text-[10px] text-slate-500 mt-1 leading-tight font-medium">{inst.fullName}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="vstep2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${selectedInst?.bg} ${selectedInst?.border}`}>
                    <div className={`text-xs font-black ${selectedInst?.color}`}>INSTITUSI: {selectedInst?.fullName}</div>
                    <button onClick={() => setVStep(1)} className="ml-auto text-[10px] font-bold text-slate-400 hover:text-slate-600 underline">Ganti</button>
                  </div>

                  <form onSubmit={handleManualAppoint} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Data Identitas</p>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Lengkap</label>
                          <input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="e.g. Budi Iwan"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">NIP / ID Pegawai</label>
                          <input value={vNIP} onChange={e => setVNIP(e.target.value)} required placeholder="ID Resmi Institusi"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-emerald-500 transition-all" />
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                          <span>Auto-Generated Wallet Address</span>
                          <span className="text-emerald-500">SHA-256</span>
                        </p>
                        <p className="font-mono text-[11px] text-slate-600 break-all bg-white p-2 rounded-lg border border-slate-100 min-h-[40px]">
                          {newAddress || 'Isi Nama & NIP...'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Kredensial Login</p>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Username Login</label>
                          <input value={newUsername} onChange={e => setNewUsername(e.target.value)} required placeholder="username_verifikator"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-blue-500 transition-all" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Password</label>
                          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="••••••••"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all" />
                        </div>
                      </div>
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                        <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                          ⚠️ Akun ini akan langsung <strong>aktif</strong>. Wallet di-generate deterministik sehingga Verifikator tidak butuh MetaMask.
                        </p>
                      </div>
                    </div>

                    <button type="submit"
                      className="md:col-span-2 py-4 bg-slate-900 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 group">
                      Buat & Aktifkan Validator <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* List: Active Verificators */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                <ShieldCheck className="text-emerald-500" size={20} /> Active Verificators (Oracles)
              </h2>
              <span className="bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-600 border border-emerald-100">{activeVerificators.length} Active</span>
            </div>
            {activeVerificators.length === 0 ? (
              <div className="py-8 text-center">
                <AlertTriangle size={20} className="text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 text-sm font-bold">Belum ada Verificator aktif.</p>
                <p className="text-slate-300 text-xs mt-1">Approve permintaan di atas atau tunjuk secara manual.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeVerificators.map((v, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div>
                      <h4 className="font-bold text-slate-900">{v.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{v.institution}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-400 font-mono text-xs">{v.wallet}</p>
                        <span className="text-emerald-600 text-xs font-bold">{v.verifiedCount} Verified</span>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-0.5">Appointed: {v.appointedAt}</p>
                    </div>
                    {/* → calls removeVerificator(address) */}
                    <button onClick={() => handleRevoke(v.wallet)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 text-red-500 font-bold text-xs rounded-xl border border-slate-200 hover:border-red-200 transition-all mt-3 sm:mt-0">
                      <Trash2 size={14} /> Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* List: User Accounts */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                <Navigation className="text-blue-500" size={20} /> Registered User Accounts
              </h2>
              <span className="bg-blue-50 px-2.5 py-1 rounded-full text-xs font-bold text-blue-600 border border-blue-100">{users.length} Users</span>
            </div>
            {users.length === 0 ? (
              <div className="py-8 text-center">
                <AlertTriangle size={20} className="text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 text-sm font-bold">Belum ada user terdaftar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((u, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div>
                      <h4 className="font-bold text-slate-900">{u.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                      <p className="text-slate-400 font-mono text-[10px] mt-1 bg-white px-2 py-1 rounded border border-slate-200 inline-block">{u.wallet}</p>
                    </div>
                    <button onClick={() => handleDeleteUser(u.email)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 text-red-500 font-bold text-xs rounded-xl border border-slate-200 hover:border-red-200 transition-all mt-3 sm:mt-0">
                      <Trash2 size={14} /> Hapus Akun
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Admin Actions</h3>
            <div className="space-y-2">
              {/* Set Validation Fee */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="font-bold text-slate-800 text-sm">Set Validation Fee</p>
                <p className="font-mono text-[10px] text-slate-400 mb-2">setValidationFee()</p>
                <div className="flex gap-2">
                  <input value={feeInput} onChange={e => setFeeInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-red-400" />
                  <button onClick={() => { localStorage.setItem('bb_validation_fee', feeInput); showToast(`✅ Validation fee diubah ke ${feeInput} ETH`); }}
                    className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors">Set</button>
                </div>
              </div>
              {[
                { label: 'Emergency Withdraw', fn: 'emergencyWithdraw()', hint: 'Hanya jika stuck' },
                { label: 'Transfer Ownership', fn: 'transferOwnership()', hint: 'God Mode — Hati-hati!' },
              ].map((a, i) => (
                <button key={i} onClick={() => showToast(`⚠️ Simulasi: ${a.fn} — Implementasi via viem diperlukan`)}
                  className="w-full text-left p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors">
                  <p className="font-bold text-slate-800 text-sm">{a.label}</p>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className="font-mono text-[10px] text-slate-400">{a.fn}</p>
                    <p className="text-[10px] text-slate-400">{a.hint}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log — real from bb_verif_logs */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-3">
          <CheckCircle2 className="text-emerald-500" size={20} /> Audit Log: Asset Verification Events
        </h2>
        {auditLog.length === 0 ? (
          <div className="py-10 text-center">
            <Database size={24} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-bold text-sm">Belum ada aktivitas verifikasi.</p>
            <p className="text-slate-300 text-xs mt-1">Log akan muncul setelah Verificator memproses aset.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                  <th className="pb-3 pt-2">Asset ID</th>
                  <th className="pb-3 pt-2">Asset Name</th>
                  <th className="pb-3 pt-2">Waktu</th>
                  <th className="pb-3 pt-2">Fee</th>
                  <th className="pb-3 pt-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {auditLog.slice(0, 20).map((log, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-600 text-xs">
                      <span className="bg-slate-100 px-2 py-1 rounded">#{log.assetId}</span>
                    </td>
                    <td className="py-3 font-bold text-slate-900">{log.assetName}</td>
                    <td className="py-3 text-slate-400 text-sm">{log.timestamp}</td>
                    <td className="py-3 font-mono text-xs text-slate-600">{log.fee}</td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-1 rounded-full border ${log.action === 'Verified'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-red-50 text-red-500 border-red-100'
                        }`}>
                        {log.action === 'Verified' ? <CheckCircle2 size={11} /> : <Trash2 size={11} />}
                        {log.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

