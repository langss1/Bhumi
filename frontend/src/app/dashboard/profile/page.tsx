'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Wallet security state
  const [showWallet, setShowWallet] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
        setFullName(data?.full_name || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) return alert("Nama tidak boleh kosong");
    
    setIsSaving(true);
    try {
      const { supabase, updateProfile } = await import('@/lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await updateProfile(user.id, { full_name: fullName });
        if (error) throw error;
        
        setProfile({ ...profile, full_name: fullName });
        setIsEditing(false);
        alert('Profil berhasil diperbarui!');
      }
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setVerifying(true);
    setErrorMsg('');
    
    try {
      const { supabase } = await import('@/lib/supabase');
      // We verify the password by attempting to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: password
      });

      if (error) {
        setErrorMsg('Password salah. Silakan coba lagi.');
      } else {
        // Password is correct
        setShowWallet(true);
        setShowPasswordModal(false);
        setPassword('');
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan sistem.');
    } finally {
      setVerifying(false);
    }
  };

  const censorAddress = (address: string | null) => {
    if (!address) return 'Belum Dibuat';
    return `0x••••••••••••••••••••••••••••••••••••••`;
  };

  const censorPrivateKey = (pk: string | null) => {
    if (!pk) return 'Tidak tersedia di database';
    return `0x••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••`;
  };

  if (loading) return <div className="p-8 text-center text-moss-500 font-medium">Memuat profil...</div>;
  if (!profile) return <div className="p-8 text-center text-red-500 font-medium">Profil tidak ditemukan.</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-8 relative">
        <button 
          onClick={() => router.back()}
          className="absolute -top-6 -left-2 p-2 text-moss-500 hover:text-moss-900 transition-colors flex items-center gap-1 text-xs font-bold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Kembali ke Dashboard
        </button>
        <h2 className="text-3xl font-black text-moss-900 tracking-tight mt-6">Pengaturan Profil</h2>
        <p className="text-sm text-moss-500 mt-2">Kelola informasi pribadi dan amankan dompet digital Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Kolom Kiri: Informasi Pribadi */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-moss-900 rounded-3xl p-5 md:p-6 border border-moss-800 shadow-2xl shadow-moss-900/30 relative overflow-hidden transition-all flex flex-col h-full"
        >
          {/* Decorative Background */}
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-olive-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-moss-800 relative z-10 shrink-0">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl shadow-inner border border-white/10">
              <svg className="w-5 h-5 text-olive-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Informasi Pribadi</h3>
              <p className="text-[11px] text-olive-200/70 mt-1 font-medium">Detail profil akun resmi Anda.</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10 flex-1 flex flex-col">
            <div className="group">
              <label className="block text-[10px] font-black text-olive-300/70 uppercase tracking-widest mb-1.5 group-focus-within:text-emerald-400 transition-colors">Nama Lengkap</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border-2 border-olive-500/50 rounded-xl text-sm font-bold text-emerald-400 focus:border-olive-400 outline-none transition-all shadow-inner"
                />
              ) : (
                <div className="px-4 py-3 bg-black/20 border-2 border-moss-800 rounded-xl text-sm font-black text-emerald-100 shadow-inner">
                  {profile.full_name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-olive-300/70 uppercase tracking-widest mb-1.5">Email Akun (Terkunci)</label>
              <div className="px-4 py-3 bg-black/40 border-2 border-moss-800 rounded-xl text-sm font-bold text-moss-500 flex justify-between items-center cursor-not-allowed shadow-inner">
                {profile.email}
                <svg className="w-4 h-4 text-moss-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-olive-300/70 uppercase tracking-widest mb-1.5">Peran / Jabatan</label>
              <div className="px-4 py-2.5 bg-emerald-900/40 border border-emerald-500/30 rounded-lg text-sm font-black text-emerald-400 w-max tracking-wide shadow-inner">
                {profile.role.replace('_', ' ')}
              </div>
            </div>

            <div className="pt-5 mt-auto flex justify-end gap-3 border-t border-moss-800">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => { setIsEditing(false); setFullName(profile.full_name || ''); }}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm transition-all hover:-translate-y-0.5"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-olive-500 hover:bg-olive-400 text-moss-900 font-black rounded-xl text-sm transition-all shadow-lg hover:shadow-olive-500/50 hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold rounded-xl text-sm transition-all hover:-translate-y-0.5"
                >
                  Edit Profil
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Kolom Kanan: Dompet Web3 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-moss-900 rounded-3xl p-5 md:p-6 border border-moss-800 shadow-2xl shadow-moss-900/30 relative overflow-hidden flex flex-col h-full"
        >
          {/* Decorative Background */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-olive-500 rounded-full blur-[90px] opacity-20 pointer-events-none"></div>

          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-moss-800 relative z-10 shrink-0">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl shadow-inner border border-white/10">
              <svg className="w-5 h-5 text-olive-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Keamanan Dompet</h3>
              <p className="text-[11px] text-olive-200/70 mt-1 font-medium">Wallet Address & Private Key Anda.</p>
            </div>
          </div>

          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-5 relative z-10 shrink-0">
             <div className="flex gap-2.5 items-start">
               <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               <p className="text-[10px] text-red-200 font-medium leading-relaxed">
                 Demi keamanan, <strong className="text-white">Private Key</strong> dan <strong className="text-white">Wallet Address</strong> Anda disembunyikan. Jangan berikan Private Key Anda ke siapapun.
               </p>
             </div>
          </div>

          <div className="space-y-4 relative z-10 flex-1 flex flex-col">
            <div>
              <label className="block text-[10px] font-black text-olive-300/70 uppercase tracking-widest mb-1.5">Wallet Address (On-Chain)</label>
              <div className="relative group">
                <div className={`w-full px-4 py-3 bg-black/40 border ${!showWallet ? 'border-moss-800 text-moss-500' : 'border-olive-500/50 text-emerald-400'} rounded-xl font-mono text-xs break-all transition-all shadow-inner`}>
                  {showWallet ? profile.wallet_address || 'Belum Dibuat' : censorAddress(profile.wallet_address)}
                </div>
                
                {!showWallet && profile.wallet_address && (
                  <div className="absolute inset-0 flex items-center justify-center bg-moss-900/40 backdrop-blur-[2px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button 
                      onClick={() => setShowPasswordModal(true)}
                      className="px-5 py-2 bg-olive-500 hover:bg-olive-400 text-moss-900 font-black rounded-lg text-xs flex items-center gap-2 transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-olive-500/50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Lihat Dompet
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-olive-300/70 uppercase tracking-widest mb-1.5">Private Key (Hashed)</label>
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl mb-2 shadow-inner">
                <p className="text-[10px] text-red-400 font-bold leading-relaxed">
                  <span className="text-red-300">🔒 Kunci Permanen:</span> Private Key Anda telah di-hash secara satu arah (SHA-256) di database dan tidak dapat dilihat kembali. Kunci asli hanya dikirimkan 1x ke email Anda saat pendaftaran.
                </p>
              </div>
              <div className="w-full px-4 py-3 bg-black/40 border border-moss-800 text-moss-500 rounded-xl font-mono text-[10px] sm:text-xs break-all shadow-inner">
                {profile.private_key ? `${profile.private_key} (Hashed)` : 'Tidak tersedia di database'}
              </div>
            </div>

            <AnimatePresence>
              {showWallet && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-auto pt-5 flex gap-3 relative z-10 overflow-hidden">
                  <button 
                    onClick={() => { navigator.clipboard.writeText(profile.wallet_address); alert('Wallet disalin!'); }}
                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold rounded-xl text-xs transition-all hover:-translate-y-0.5"
                  >
                    Salin Address
                  </button>

                  <button 
                    onClick={() => setShowWallet(false)}
                    className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 text-red-300 font-bold rounded-xl text-xs transition-all hover:-translate-y-0.5"
                  >
                    Tutup
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Modal Verifikasi Password */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-moss-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl border border-moss-100"
            >
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 mb-5 mx-auto">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-moss-900 text-center mb-2">Verifikasi Keamanan</h3>
              <p className="text-xs text-moss-500 text-center mb-6">
                Masukkan password akun Anda untuk melihat alamat dompet secara utuh.
              </p>

              <form onSubmit={handleVerifyPassword}>
                <div className="relative mb-2">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan Password"
                    className="w-full pl-4 pr-12 py-3 bg-moss-50 border border-moss-100 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
                
                {errorMsg && <p className="text-[10px] font-bold text-red-500 mb-4 px-1">{errorMsg}</p>}
                {!errorMsg && <div className="mb-4"></div>}

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => { setShowPasswordModal(false); setErrorMsg(''); setPassword(''); }}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={verifying || !password}
                    className="flex-1 py-3 bg-moss-800 hover:bg-moss-900 text-white font-bold rounded-xl text-sm transition-colors shadow-md disabled:opacity-50"
                  >
                    {verifying ? 'Mengecek...' : 'Verifikasi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
