'use client';

/**
 * /daftarvalidator — Halaman Registrasi Validator Institusi
 *
 * Role mapping sesuai kategori aset:
 *   Tanah/Properti → BPN (Badan Pertanahan Nasional)
 *   Kendaraan      → Samsat
 *   Emas           → Pegadaian
 *   Lainnya        → Kemenkeu (Kementerian Keuangan)
 *
 * Wallet address dibuat OTOMATIS via SHA-256 hash dari data unik instansi.
 * Login validator ada di /verificator (bukan halaman utama).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Landmark, Car, Coins, Package, ShieldCheck, Hash,
  ArrowRight, CheckCircle2, AlertTriangle, ChevronRight,
  Building2, Lock, Eye, EyeOff, RefreshCw, Copy, Check
} from 'lucide-react';
import type { VerificatorAccount } from '@/app/page';

// ─── Institution Role Config ──────────────────────────────────────────────────
type Institution = 'BPN' | 'Samsat' | 'Pegadaian' | 'Kemenkeu';

interface InstitutionConfig {
  id: Institution;
  label: string;
  fullName: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  categories: string[];
  desc: string;
}

const INSTITUTIONS: InstitutionConfig[] = [
  {
    id: 'BPN',
    label: 'BPN',
    fullName: 'Badan Pertanahan Nasional',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <Landmark size={22} />,
    categories: ['Property', 'Tanah'],
    desc: 'Verifikasi aset berupa tanah dan properti (SHM, HGB, SHGB)',
  },
  {
    id: 'Samsat',
    label: 'Samsat',
    fullName: 'Sistem Administrasi Manunggal Satu Atap',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: <Car size={22} />,
    categories: ['Vehicle', 'Kendaraan'],
    desc: 'Verifikasi kepemilikan kendaraan bermotor (BPKB, STNK)',
  },
  {
    id: 'Pegadaian',
    label: 'Pegadaian',
    fullName: 'PT Pegadaian (Persero)',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: <Coins size={22} />,
    categories: ['Gold', 'Emas'],
    desc: 'Verifikasi aset logam mulia dan sertifikat emas (Antam, LM)',
  },
  {
    id: 'Kemenkeu',
    label: 'Kemenkeu',
    fullName: 'Kementerian Keuangan RI',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: <Package size={22} />,
    categories: ['Other', 'Properti Lain'],
    desc: 'Verifikasi aset lainnya yang tidak masuk BPN/Samsat/Pegadaian',
  },
];

// ─── Crypto Helpers ───────────────────────────────────────────────────────────
async function sha256Hex(msg: string): Promise<string> {
  const buf  = new TextEncoder().encode(msg);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Membuat Ethereum-style wallet address dari hash data unik validator.
 * Format: 0x + 40 hex chars (20 bytes) dari SHA-256(seed).
 * Ini bukan private key nyata — hanya deterministic ID untuk simulasi.
 */
async function generateWalletFromSeed(seed: string): Promise<string> {
  const hash = await sha256Hex(seed);
  return '0x' + hash.slice(0, 40); // Ambil 20 bytes pertama = 40 hex chars
}

async function hashPassword(pw: string): Promise<string> {
  return sha256Hex(pw);
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
function getVerificatorAccounts(): VerificatorAccount[] {
  return JSON.parse(localStorage.getItem('bb_verificator_accounts') || '[]');
}
function saveVerificatorAccounts(accounts: VerificatorAccount[]) {
  localStorage.setItem('bb_verificator_accounts', JSON.stringify(accounts));
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DaftarValidatorPage() {
  const router = useRouter();

  // Step UI: 1=pilih institusi, 2=isi form, 3=sukses
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedInst, setSelectedInst] = useState<InstitutionConfig | null>(null);

  // Form fields
  const [vUsername,    setVUsername]    = useState('');
  const [vName,        setVName]        = useState('');
  const [vNIP,         setVNIP]         = useState('');  // Nomor Induk Pegawai
  const [vPw,          setVPw]          = useState('');
  const [vPwConfirm,   setVPwConfirm]   = useState('');
  const [showPw,       setShowPw]       = useState(false);
  const [showPwC,      setShowPwC]      = useState(false);

  // Generated wallet
  const [generatedWallet, setGeneratedWallet] = useState('');
  const [isGenerating,    setIsGenerating]    = useState(false);
  const [walletCopied,    setWalletCopied]    = useState(false);

  // Submit state
  const [error,     setError]     = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [registeredAccount, setRegisteredAccount] = useState<VerificatorAccount | null>(null);

  const clear = () => setError('');

  // Auto-generate wallet saat username atau NIP berubah
  const generateWallet = useCallback(async () => {
    if (!vUsername.trim() && !vNIP.trim()) {
      setGeneratedWallet('');
      return;
    }
    setIsGenerating(true);
    const inst = selectedInst?.id || 'UNKNOWN';
    const seed = `BangBang::${inst}::${vUsername.toLowerCase()}::${vNIP}::${Date.now()}`;
    const wallet = await generateWalletFromSeed(seed);
    setGeneratedWallet(wallet);
    setIsGenerating(false);
  }, [vUsername, vNIP, selectedInst]);

  // Generate wallet setiap kali data identitas sudah lengkap (Username + Nama + NIP)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Hanya generate kalau SEMUA field utama sudah diisi minimal beberapa karakter
      if (vUsername.length >= 3 && vName.length >= 3 && vNIP.length >= 5) {
        generateWallet();
      } else {
        setGeneratedWallet(''); // Reset kalau ada yang dihapus
      }
    }, 600); // debounce 600ms biar gak terlalu berat
    return () => clearTimeout(timer);
  }, [vUsername, vName, vNIP, generateWallet]);

  const copyWallet = async () => {
    if (!generatedWallet) return;
    await navigator.clipboard.writeText(generatedWallet);
    setWalletCopied(true);
    setTimeout(() => setWalletCopied(false), 2000);
  };

  const regenerateWallet = () => generateWallet();

  // ── Pilih Institusi → Step 2
  const handleSelectInstitution = (inst: InstitutionConfig) => {
    setSelectedInst(inst);
    setStep(2);
    clear();
  };

  // ── Submit Registrasi Validator
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clear();

    if (!vUsername.trim())     return setError('Username wajib diisi.');
    if (!vName.trim())         return setError('Nama lengkap wajib diisi.');
    if (!vNIP.trim())          return setError('NIP/ID Pegawai wajib diisi.');
    if (!vPw.trim())           return setError('Password wajib diisi.');
    if (vPw.length < 8)        return setError('Password minimal 8 karakter.');
    if (vPw !== vPwConfirm)    return setError('Konfirmasi password tidak cocok.');
    if (!generatedWallet)      return setError('Wallet belum di-generate. Isi username & NIP dulu.');

    if (!/^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(vUsername))
      return setError('Username: 3-20 karakter, diawali huruf, boleh huruf/angka/underscore.');

    const accounts = getVerificatorAccounts();
    if (accounts.find(a => a.username.toLowerCase() === vUsername.toLowerCase()))
      return setError('Username sudah digunakan. Pilih username lain.');
    if (accounts.find(a => a.wallet.toLowerCase() === generatedWallet.toLowerCase()))
      return setError('Wallet address sudah terdaftar. Regenerate wallet.');

    setIsHashing(true);
    const passwordHash = await hashPassword(vPw);
    setIsHashing(false);

    const newAccount: VerificatorAccount = {
      username:     vUsername.toLowerCase(),
      name:         vName,
      wallet:       generatedWallet,
      institution:  selectedInst!.id,
      passwordHash,
      status:       'pending',
      registeredAt: new Date().toISOString(),
    };

    // SAVE TO CENTRAL DB (untuk Sync Chrome/Edge)
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'verificators', action: 'insert', payload: newAccount })
    });

    const pendingData = {
      name:        vName,
      username:    vUsername.toLowerCase(),
      wallet:      generatedWallet,
      institution: selectedInst!.id,
      fullInst:    selectedInst!.fullName,
      nip:         vNIP,
      date:        new Date().toLocaleDateString('id-ID'),
    };
    
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'pending_verificators', action: 'insert', payload: pendingData })
    });

    setRegisteredAccount(newAccount);
    setStep(3);
  };

  const inst = selectedInst;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">

      {/* Abstract Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-[-15%] w-[450px] h-[450px] bg-blue-100/30 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] bg-purple-100/30 rounded-full blur-[80px]" />
      </div>



      <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">
            Jadi Bagian dari <span className="text-emerald-600">Tim Verifikator</span>
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-lg mx-auto">
            Bantu kami mastiin semua aset fisik yang masuk itu beneran asli dan sah. Kamu punya peran penting buat jaga kepercayaan di BangBang Protocol.
          </p>
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3].map(s => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  step > s ? 'bg-emerald-500 text-white' :
                  step === s ? 'bg-slate-900 text-white' :
                  'bg-slate-200 text-slate-400'
                }`}>{step > s ? <CheckCircle2 size={14} /> : s}</div>
                {s < 3 && <div className={`w-12 h-0.5 rounded-full transition-all ${step > s ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-center gap-12 mt-2 text-[10px] font-bold text-slate-400">
            <span className={step >= 1 ? 'text-slate-700' : ''}>Pilih Kantor</span>
            <span className={step >= 2 ? 'text-slate-700' : ''}>Isi Data</span>
            <span className={step >= 3 ? 'text-emerald-600' : ''}>Beres!</span>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Pilih Institusi ── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 pl-1">
                Pilih instansi tempat kamu bertugas ya
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {INSTITUTIONS.map((inst) => (
                  <motion.button
                    key={inst.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectInstitution(inst)}
                    className={`text-left p-6 bg-white border-2 rounded-3xl shadow-sm hover:shadow-md transition-all group ${inst.border} hover:border-current`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border-2 ${inst.bg} ${inst.border} ${inst.color}`}>
                      {inst.icon}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-black text-lg ${inst.color}`}>{inst.label}</p>
                        <p className="text-xs font-bold text-slate-500 mt-0.5 leading-snug">{inst.fullName}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 mt-1 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">{inst.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {inst.categories.map(c => (
                        <span key={c} className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${inst.bg} ${inst.border} ${inst.color} uppercase tracking-wider`}>{c}</span>
                      ))}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Info box */}
              <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-3">
                <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pendaftaran validator akan diverifikasi oleh SuperAdmin sebelum akun aktif.
                  Wallet address di-generate otomatis berdasarkan data identitas Anda — tidak memerlukan MetaMask maupun private key.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Form Data Diri ── */}
          {step === 2 && inst && (
            <motion.div key="step2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              {/* Selected Institution Badge */}
              <div className={`flex items-center gap-3 p-4 rounded-2xl border-2 mb-6 ${inst.bg} ${inst.border}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inst.color}`}>{inst.icon}</div>
                <div className="flex-1">
                  <p className={`font-black ${inst.color}`}>{inst.label} — {inst.fullName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{inst.desc}</p>
                </div>
                <button onClick={() => { setStep(1); setGeneratedWallet(''); }}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-600 border border-slate-200 px-2 py-1 rounded-lg transition-all">
                  Ganti
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h2 className="font-black text-slate-900">Isi Data Diri Dulu</h2>

                  {/* Username */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                      Username Unikmu <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={vUsername}
                      onChange={e => { setVUsername(e.target.value); clear(); }}
                      placeholder="bpn_jakarta (3-20 karakter)"
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none transition-all placeholder:font-sans placeholder:text-slate-300 ${
                        inst.id === 'BPN' ? 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 border-slate-200' :
                        inst.id === 'Samsat' ? 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 border-slate-200' :
                        inst.id === 'Pegadaian' ? 'focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 border-slate-200' :
                        'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 border-slate-200'
                      }`}
                    />
                    <p className="text-[10px] text-slate-400 mt-1 pl-1">Buat login nanti di portal verifikasi ya.</p>
                  </div>

                  {/* Nama Lengkap */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                      Nama Aslimu <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={vName}
                      onChange={e => setVName(e.target.value)}
                      placeholder="Tulis nama lengkap kamu di sini"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-slate-400 transition-all placeholder:text-slate-300"
                    />
                  </div>

                  {/* NIP */}
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                      NIP atau ID Karyawan <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={vNIP}
                      onChange={e => { setVNIP(e.target.value); clear(); }}
                      placeholder="Nomor Induk Pegawai / ID Resmi"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-slate-400 transition-all placeholder:font-sans placeholder:text-slate-300"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 pl-1">Data ini kita pakai buat bikin ID dompet digitalmu secara otomatis.</p>
                  </div>
                </div>

                {/* Wallet Address — Auto Generated */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-black text-slate-900">ID Dompet Digitalmu</h2>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Otomatis</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Tenang, ID dompet ini muncul sendiri kok dari gabungan data kamu. Gak perlu pakai MetaMask segala.
                  </p>

                  <div className={`relative rounded-2xl border-2 p-4 transition-all ${
                    generatedWallet ? `${inst.bg} ${inst.border}` : 'bg-slate-50 border-dashed border-slate-200'
                  }`}>
                    {isGenerating ? (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Hash size={14} className="animate-pulse" />
                        <span className="text-xs font-bold">Lagi bikin wallet...</span>
                      </div>
                    ) : generatedWallet ? (
                      <div className="space-y-2">
                        <p className={`font-mono text-sm break-all font-bold ${inst.color}`}>{generatedWallet}</p>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={copyWallet}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 border border-slate-200 bg-white px-2.5 py-1 rounded-lg transition-all">
                            {walletCopied ? <><Check size={10} className="text-emerald-500" /> Copied!</> : <><Copy size={10} /> Copy</>}
                          </button>
                          <button type="button" onClick={regenerateWallet}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700 border border-slate-200 bg-white px-2.5 py-1 rounded-lg transition-all">
                            <RefreshCw size={10} /> Regenerate
                          </button>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <CheckCircle2 size={10} className="text-emerald-500" /> SHA-256 deterministic
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Hash size={14} />
                        <span className="text-xs font-bold">Lengkapi Nama, Username, & NIP buat dapetin wallet...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-black text-slate-900">Buat Password Login</h2>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Lock size={10} />
                      <span>Keamanan SHA-256</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                      Password <span className="text-red-400">*</span> <span className="font-normal text-slate-300">(Minimal 8 karakter ya, biar aman)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={vPw}
                        onChange={e => setVPw(e.target.value)}
                        placeholder="Min. 8 karakter"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-slate-400 transition-all"
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                      Ketik Ulang Password <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPwC ? 'text' : 'password'}
                        value={vPwConfirm}
                        onChange={e => setVPwConfirm(e.target.value)}
                        placeholder="Ulangi password"
                        className={`w-full bg-slate-50 border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 transition-all ${
                          vPwConfirm && vPw !== vPwConfirm
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-400/10'
                            : vPwConfirm && vPw === vPwConfirm
                            ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-400/10'
                            : 'border-slate-200 focus:border-slate-400 focus:ring-slate-400/10'
                        }`}
                      />
                      <button type="button" onClick={() => setShowPwC(!showPwC)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPwC ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {vPwConfirm && vPw !== vPwConfirm && (
                      <p className="text-red-500 text-[10px] mt-1 pl-1">Password tidak cocok</p>
                    )}
                    {vPwConfirm && vPw === vPwConfirm && (
                      <p className="text-emerald-600 text-[10px] mt-1 pl-1 flex items-center gap-1"><CheckCircle2 size={10} /> Password cocok</p>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                    <Hash size={12} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Password di-hash menggunakan <strong>SHA-256</strong> sebelum disimpan. Plain text tidak pernah tersimpan.
                    </p>
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-xs bg-red-50 border border-red-100 px-4 py-3 rounded-xl">{error}</p>
                )}

                <button type="submit" disabled={isHashing || !generatedWallet}
                  className={`w-full font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-lg disabled:opacity-60 text-white ${
                    inst.id === 'BPN' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/15' :
                    inst.id === 'Samsat' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/15' :
                    inst.id === 'Pegadaian' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/15' :
                    'bg-purple-600 hover:bg-purple-700 shadow-purple-600/15'
                  }`}
                >
                  {isHashing
                    ? 'Lagi ngunci data kamu...'
                    : <><span>Daftar Jadi Verifikator {inst.label} Sekarang!</span> <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></>
                  }
                </button>
              </form>
            </motion.div>
          )}

          {/* ── STEP 3: Sukses ── */}
          {step === 3 && registeredAccount && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="bg-white border border-emerald-200 rounded-3xl p-8 shadow-xl max-w-lg mx-auto">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Pendaftaranmu Berhasil Dikirim!</h2>
                <p className="text-slate-500 text-sm mb-6">
                  Akun Validator <strong className="text-slate-800">@{registeredAccount.username}</strong> dari{' '}
                  <strong className="text-slate-800">{registeredAccount.institution}</strong> sudah kami catat.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3 mb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Akun</p>
                  {[
                    { label: 'Username', value: `@${registeredAccount.username}`, mono: true },
                    { label: 'Institusi', value: registeredAccount.institution },
                    { label: 'Wallet', value: `${registeredAccount.wallet.slice(0,10)}...${registeredAccount.wallet.slice(-8)}`, mono: true },
                    { label: 'Status', value: 'Menunggu Persetujuan Admin' },
                  ].map((f, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                      <span className="text-xs text-slate-400 font-bold">{f.label}</span>
                      <span className={`text-xs font-bold text-slate-800 ${f.mono ? 'font-mono' : ''}`}>{f.value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-left mb-6">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">Langkah Selanjutnya</p>
                  <ol className="text-xs text-amber-700 space-y-1.5">
                    <li>1. Tunggu persetujuan <strong>SuperAdmin</strong> di <code className="bg-amber-100 px-1 rounded">/admin</code></li>
                    <li>2. Setelah disetujui, login di <strong>/verificator</strong></li>
                    <li>3. Gunakan username & password yang sudah dibuat</li>
                  </ol>
                </div>

                <div className="flex flex-col gap-3">
                  <button onClick={() => router.push('/verificator')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                    <ShieldCheck size={16} /> Login ke Portal Validator
                  </button>
                  <button onClick={() => router.push('/')}
                    className="w-full border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-bold py-3 rounded-xl transition-all text-sm">
                    Kembali ke Beranda
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
