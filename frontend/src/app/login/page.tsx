'use client';

import React, { useState } from 'react';
import { useAccount, useSignMessage, useConnect } from 'wagmi';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { connect, connectors } = useConnect();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [simulatedRole, setSimulatedRole] = useState('user');
  
  // Traditional login states
  const [loginMethod, setLoginMethod] = useState<'web3' | 'traditional'>('traditional');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleWeb3Login = async () => {
    if (!isConnected || !address) {
      setError('Harap hubungkan dompet Web3 Anda.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const message = `Saya login ke Bhumi dengan dompet ini:\n${address}`;
      const signature = await signMessageAsync({ message });

      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, message, simulatedRole }),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Respons server tidak valid. Pastikan API route menyala.');
      }

      if (data.success) {
        router.push(`/dashboard/${data.role}`);
      } else {
        setError(data.message || 'Login gagal.');
      }
    } catch (err: any) {
      setError(err.message || 'Error saat menandatangani pesan');
    } finally {
      setLoading(false);
    }
  };

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Harap isi email dan password.');
      return;
    }

    setLoading(true);
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // 1. Login dengan Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authErr) throw new Error('Email atau password salah.');
      if (!authData.user) throw new Error('Gagal memuat data pengguna.');

      // 2. Ambil profil pengguna
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileErr || !profile) {
        throw new Error('Profil tidak ditemukan. Harap hubungi admin.');
      }

      // 3. Cek Status Verifikasi (Khusus Pejabat)
      if (['NOTARIS', 'AUDITOR'].includes(profile.role) && profile.verification_status === 'PENDING') {
        await supabase.auth.signOut(); // Logout kembali
        setError(`Akun Anda masih dalam status: PENDING. Menunggu persetujuan BPN Pusat.`);
        setLoading(false);
        return;
      }

      // 4. Arahkan ke dashboard sesuai Role
      switch (profile.role) {
        case 'BPN_PUSAT':
          router.push('/dashboard/bpn-pusat');
          break;
        case 'BPN_WILAYAH':
          router.push('/dashboard/bpn-wilayah');
          break;
        case 'NOTARIS':
          router.push('/dashboard/notaris');
          break;
        case 'AUDITOR':
          router.push('/dashboard/auditor');
          break;
        case 'UMUM':
        default:
          router.push('/dashboard/user');
          break;
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#fbfcf8] font-sans">
      {/* Left Pane (Image & Branding) */}
      <div className="hidden lg:flex w-1/2 bg-moss-900 relative overflow-hidden flex-col justify-between p-16">
        {/* Background elements */}
        <div className="absolute inset-0 bg-moss-800 mix-blend-overlay opacity-30"></div>
        <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-olive-500 rounded-full blur-[150px] opacity-20 -translate-y-1/2 -translate-x-1/3"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-moss-400 rounded-full blur-[120px] opacity-20 translate-y-1/3 translate-x-1/3"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex items-center gap-4"
        >
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
            <img src="/logo.png" alt="Bhumi Logo" className="h-10 w-10 object-contain brightness-0 invert" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Bhumi</h1>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 max-w-lg"
        >
          <h2 className="text-5xl font-bold text-white leading-tight mb-6">
            Masa Depan<br/>
            <span className="text-olive-300">Pertanahan.</span>
          </h2>
          <p className="text-moss-100/90 text-lg leading-relaxed">
            Portal resmi pendaftaran, verifikasi, dan transaksi hak milik lahan terintegrasi blockchain. Aman, transparan, dan dapat diandalkan.
          </p>
        </motion.div>
      </div>

      {/* Right Pane (Login form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-moss-100/50"
        >
          <div className="mb-10 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang</h3>
            <p className="text-moss-600/70 text-sm">Masuk untuk mengelola aset dan layanan Anda</p>
          </div>

          {/* Login Method Toggle */}
          <div className="flex p-1 bg-moss-50 rounded-xl mb-8">
            <button
              onClick={() => { setLoginMethod('traditional'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginMethod === 'traditional' ? 'bg-white text-moss-800 shadow-sm border border-moss-200/50' : 'text-moss-500 hover:text-moss-700'}`}
            >
              Username
            </button>
            <button
              onClick={() => { setLoginMethod('web3'); setError(''); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginMethod === 'web3' ? 'bg-white text-moss-800 shadow-sm border border-moss-200/50' : 'text-moss-500 hover:text-moss-700'}`}
            >
              Web3 Wallet
            </button>
          </div>

          {loginMethod === 'traditional' ? (
            /* Traditional Login Form */
            <form onSubmit={handleTraditionalLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-moss-800 uppercase tracking-widest mb-2">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-4 py-3 border border-moss-200 rounded-xl focus:ring-2 focus:ring-olive-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-moss-800 uppercase tracking-widest mb-2">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-moss-200 rounded-xl focus:ring-2 focus:ring-olive-500 outline-none transition-all"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-moss-600 text-white font-bold rounded-xl hover:bg-moss-700 disabled:opacity-70 transition-all shadow-lg shadow-moss-600/20 mt-6 flex justify-center items-center"
              >
                {loading ? 'Memproses...' : 'Sign In'}
              </button>
              
              <p className="text-center text-sm text-gray-500 mt-4">
                Belum punya akun? <a href="/register" className="font-bold text-moss-600 hover:underline">Daftar di sini</a>
              </p>
            </form>
          ) : (
            /* Web3 Login */
            !isConnected ? (
              <div className="flex flex-col items-center gap-8 py-4">
                <div className="w-20 h-20 bg-moss-50 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-10 h-10 text-moss-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                </div>
                <button 
                  onClick={() => connect({ connector: connectors[0] })}
                  className="py-3 px-6 bg-moss-600 text-white font-bold rounded-xl hover:bg-moss-700 transition-all"
                >
                  Connect MetaMask
                </button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="p-5 bg-moss-50 rounded-2xl border border-moss-100/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-olive-500 animate-pulse"></div>
                    <p className="text-xs font-bold text-moss-800 uppercase tracking-widest">Dompet Terhubung</p>
                  </div>
                  <p className="text-sm font-mono text-moss-700 truncate">{address}</p>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-moss-800 uppercase tracking-widest">Simulasi Peran Akses</label>
                  <div className="relative">
                    <select 
                      value={simulatedRole} 
                      onChange={(e) => setSimulatedRole(e.target.value)}
                      className="w-full pl-5 pr-12 py-4 border border-moss-200 rounded-xl appearance-none focus:ring-2 focus:ring-olive-500 bg-white text-gray-800 font-medium transition-all hover:border-moss-300 cursor-pointer shadow-sm"
                    >
                      <option value="user">👤 Pemilik Tanah (Masyarakat)</option>
                      <option value="bpn-wilayah">🏢 BPN Wilayah (Data Inputter)</option>
                      <option value="notaris">⚖️ Notaris / PPAT (Transfer Executor)</option>
                      <option value="bpn-pusat">🛡️ BPN Pusat (Validator Utama)</option>
                      <option value="auditor">🔍 Auditor / KPK (Read-Only)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-moss-600">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleWeb3Login}
                  disabled={loading}
                  className="w-full py-4 px-4 bg-moss-600 text-white font-bold rounded-xl hover:bg-moss-700 focus:ring-4 focus:ring-moss-100 disabled:opacity-70 transition-all shadow-lg shadow-moss-600/20 flex justify-center items-center gap-2 mt-4"
                >
                  {loading ? 'Memverifikasi...' : 'Sign in with Ethereum'}
                </button>
              </motion.div>
            )
          )}

          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center font-medium border border-red-100">
              {error}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
