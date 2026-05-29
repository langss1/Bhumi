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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Kolom Kiri: Informasi Pribadi */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 border border-moss-100 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-moss-50 rounded-xl">
              <svg className="w-5 h-5 text-moss-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-moss-900">Informasi Pribadi</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-moss-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-moss-200 rounded-xl text-sm focus:ring-2 focus:ring-olive-500 outline-none transition-all"
                />
              ) : (
                <div className="px-4 py-3 bg-moss-50/50 border border-transparent rounded-xl text-sm font-semibold text-moss-800">
                  {profile.full_name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-moss-400 uppercase tracking-widest mb-2">Email Akun (Terkunci)</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-500 flex justify-between items-center cursor-not-allowed">
                {profile.email}
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-moss-400 uppercase tracking-widest mb-2">Peran / Jabatan</label>
              <div className="px-4 py-3 bg-olive-50 border border-olive-100 rounded-xl text-sm font-bold text-olive-700 w-max">
                {profile.role}
              </div>
            </div>

            <div className="pt-4 border-t border-moss-50 flex justify-end gap-3">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => { setIsEditing(false); setFullName(profile.full_name || ''); }}
                    className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-moss-800 hover:bg-moss-900 text-white font-bold rounded-xl text-sm transition-colors shadow-md disabled:opacity-50"
                  >
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 bg-moss-100 hover:bg-moss-200 text-moss-700 font-bold rounded-xl text-sm transition-colors"
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
          className="bg-white rounded-3xl p-8 border border-moss-100 shadow-sm h-max"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 rounded-xl">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-moss-900">Keamanan Dompet (Wallet)</h3>
          </div>

          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl mb-6">
             <div className="flex gap-2">
               <svg className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               <p className="text-[10px] text-orange-800 font-bold leading-relaxed">
                 Demi keamanan, sistem tidak menyimpan <strong>Private Key</strong> Anda di database. Yang tersimpan hanyalah <strong>Wallet Address (Public)</strong> yang disembunyikan secara default.
               </p>
             </div>
          </div>

          <div className="mb-6">
            <label className="block text-[10px] font-bold text-moss-400 uppercase tracking-widest mb-2">Wallet Address (On-Chain)</label>
            <div className="relative">
              <div className={`w-full px-4 py-4 bg-moss-50 border border-moss-100 rounded-xl font-mono text-sm break-all ${!showWallet ? 'text-moss-400 select-none' : 'text-moss-900 font-semibold'}`}>
                {showWallet ? profile.wallet_address || 'Belum Dibuat' : censorAddress(profile.wallet_address)}
              </div>
              
              {!showWallet && profile.wallet_address && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-xl border border-transparent">
                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="px-5 py-2 bg-white border border-moss-200 shadow-sm hover:shadow-md hover:border-amber-300 text-moss-800 font-bold rounded-lg text-xs flex items-center gap-2 transition-all"
                  >
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    Lihat Dompet
                  </button>
                </div>
              )}
            </div>
          </div>



          {showWallet && (
            <div className="mt-4 flex gap-3">
              <button 
                onClick={() => { navigator.clipboard.writeText(profile.wallet_address); alert('Wallet disalin!'); }}
                className="flex-1 py-2.5 bg-moss-100 hover:bg-moss-200 text-moss-700 font-bold rounded-xl text-xs transition-colors"
              >
                Salin Address
              </button>
              <button 
                onClick={() => setShowWallet(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs transition-colors"
              >
                Sembunyikan
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal Verifikasi Password */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-moss-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-moss-100"
            >
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 mb-5 mx-auto">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-moss-900 text-center mb-2">Verifikasi Keamanan</h3>
              <p className="text-xs text-moss-500 text-center mb-6">
                Masukkan password akun Anda untuk melihat alamat dompet secara utuh.
              </p>

              <form onSubmit={handleVerifyPassword}>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan Password"
                  className="w-full px-4 py-3 bg-moss-50 border border-moss-100 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all mb-2"
                  autoFocus
                />
                
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
