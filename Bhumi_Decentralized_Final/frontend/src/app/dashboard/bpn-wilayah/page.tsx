'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';
import { uploadToIPFS } from '@/lib/pinata';
import LandLedger from '@/components/LandLedger';
import { supabase } from '@/lib/supabase';

export default function BpnWilayahDashboard() {
  const [activeTab, setActiveTab] = useState('daftar');
  
  // Form State
  const [searchType, setSearchType] = useState('email');
  const [searchName, setSearchName] = useState('');
  const [searchStatus, setSearchStatus] = useState({ loading: false, message: '', type: '' });
  const [walletAddress, setWalletAddress] = useState('');
  const [foundEmail, setFoundEmail] = useState('');
  const [gps, setGps] = useState('');
  const [area, setArea] = useState('');
  const [nib, setNib] = useState('');
  const [warkahFile, setWarkahFile] = useState<File | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedHashes, setUploadedHashes] = useState<Record<string, string>>({});

  const { writeContractAsync, isPending: isMintPending } = useWriteContract();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'warkah' | 'foto') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'warkah') setWarkahFile(e.target.files[0]);
      if (type === 'foto') setFotoFile(e.target.files[0]);
    }
  };

  const handleSearchUser = async () => {
    if (!searchName) return;
    setSearchStatus({ loading: true, message: 'Mencari ke database...', type: 'info' });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_address, full_name, email')
        .eq(searchType === 'email' ? 'email' : 'wallet_address', searchName)
        .limit(1)
        .single();
        
      if (error || !data) {
        setSearchStatus({ loading: false, message: 'Data tidak ditemukan di sistem.', type: 'error' });
        setWalletAddress('');
        setFoundEmail('');
      } else if (!data.wallet_address) {
        setSearchStatus({ loading: false, message: `Ditemukan akun ${data.full_name}, tapi akun ini belum dibuatkan Wallet oleh Pusat.`, type: 'error' });
        setWalletAddress('');
        setFoundEmail('');
      } else {
        setWalletAddress(data.wallet_address);
        setFoundEmail(data.email);
        setSearchStatus({ loading: false, message: `Ditemukan: ${data.full_name}`, type: 'success' });
      }
    } catch (err) {
      setSearchStatus({ loading: false, message: 'Terjadi kesalahan pencarian.', type: 'error' });
      setWalletAddress('');
      setFoundEmail('');
    }
  };

  const handleRegisterLand = async () => {
    if (!walletAddress || !gps || !area || !nib || !warkahFile || !fotoFile) {
      alert("Harap lengkapi semua field dan unggah dokumen!");
      return;
    }

    try {
      setIsUploading(true);
      
      // 1. Upload ke IPFS
      let warkahHash = uploadedHashes.warkah;
      let fotoHash = uploadedHashes.foto;
      
      if (!warkahHash || !fotoHash) {
        warkahHash = await uploadToIPFS(warkahFile);
        fotoHash = await uploadToIPFS(fotoFile);
        setUploadedHashes({ warkah: warkahHash, foto: fotoHash });
      }
      
      setIsUploading(false);

      // 2. Mint NFT ke Blockchain
      const txHash = await writeContractAsync({
        address: LAND_REGISTRY_ADDRESS,
        abi: LandRegistryABI,
        functionName: 'requestLandMinting',
        args: [
          walletAddress as `0x${string}`,
          gps,
          BigInt(area),
          nib,
          [warkahHash, fotoHash]
        ],
        
      });

      alert(`Transaksi dikirim ke Blockchain!\nMenunggu konfirmasi blok... TxHash: ${txHash}`);
      
    } catch (error: any) {
      console.error(error);
      alert("Terjadi kesalahan: " + (error.message || "Gagal memproses"));
    } finally {
      setIsUploading(false);
    }
  };

  const tabs = [
    { id: 'daftar', label: 'Input Pendaftaran Baru' },
    { id: 'history', label: 'Riwayat Pendaftaran' }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-4 mb-10 border-b border-moss-100 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-6 py-4 text-sm font-bold tracking-wide transition-colors ${
              activeTab === tab.id ? 'text-moss-900' : 'text-moss-400 hover:text-moss-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="bpnTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-olive-500 rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'daftar' && (
            <motion.div 
              key="daftar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-moss-100 p-12 rounded-[2rem] shadow-sm max-w-4xl"
            >
              <div className="flex items-center gap-5 mb-10">
                <div className="w-16 h-16 bg-olive-50 rounded-2xl flex items-center justify-center border border-olive-100">
                  <svg className="w-8 h-8 text-olive-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-moss-900">Input Data Aset Tanah</h3>
                  <p className="text-sm text-moss-600 mt-2">Upload Warkah ke IPFS & Cetak Sertifikat NFT ke Jaringan Blockchain</p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="bg-moss-50/30 p-6 rounded-2xl border border-moss-100">
                  <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-3">Pencarian Akun (Pemilik Tanah)</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select 
                      value={searchType} 
                      onChange={(e) => setSearchType(e.target.value)}
                      className="p-4 bg-white border border-moss-200 rounded-xl focus:ring-2 focus:ring-olive-500 text-sm font-medium transition-all min-w-[120px] outline-none"
                    >
                      <option value="email">Email</option>
                      <option value="wallet">Wallet Address</option>
                    </select>
                    <input 
                      type="text" 
                      value={searchName} 
                      onChange={(e) => setSearchName(e.target.value)} 
                      placeholder={searchType === 'email' ? 'contoh@gmail.com' : '0x...'} 
                      className="flex-1 p-4 bg-white border border-moss-200 rounded-xl focus:ring-2 focus:ring-olive-500 text-sm font-medium transition-all outline-none" 
                    />
                    <button 
                      onClick={handleSearchUser}
                      disabled={searchStatus.loading}
                      className="px-6 py-4 bg-moss-600 hover:bg-moss-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {searchStatus.loading ? 'Mencari...' : 'Cari Data'}
                    </button>
                  </div>
                  
                  {searchStatus.message && (
                    <div className={`mt-3 text-xs font-bold ${searchStatus.type === 'error' ? 'text-red-500' : searchStatus.type === 'success' ? 'text-olive-600' : 'text-moss-500'}`}>
                      {searchStatus.message}
                    </div>
                  )}

                  {walletAddress && foundEmail && (
                    <div className="mt-4 p-4 bg-white border border-olive-200 rounded-xl shadow-sm">
                      <span className="text-[10px] uppercase text-moss-400 font-bold block mb-2">Data Ditemukan & Terhubung:</span>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-moss-800">
                          <strong className="text-moss-900">Email:</strong> {foundEmail}
                        </span>
                        <span className="text-sm font-medium text-moss-800 break-all">
                          <strong className="text-moss-900">Wallet:</strong> <span className="font-mono bg-moss-50 px-1 rounded">{walletAddress}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-4">Warkah / Surat Ukur (PDF)</label>
                    <label className="border-2 border-dashed border-moss-200 rounded-2xl p-8 hover:bg-moss-50 transition-all cursor-pointer text-center group bg-moss-50/30 flex flex-col items-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 border border-moss-100">
                        <svg className="w-5 h-5 text-moss-400 group-hover:text-olive-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      </div>
                      <span className="text-sm font-bold text-moss-700">{warkahFile ? warkahFile.name : "Pilih Berkas Warkah"}</span>
                      <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(e, 'warkah')} />
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-4">Foto Batas Patok</label>
                    <label className="border-2 border-dashed border-moss-200 rounded-2xl p-8 hover:bg-moss-50 transition-all cursor-pointer text-center group bg-moss-50/30 flex flex-col items-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 border border-moss-100">
                        <svg className="w-5 h-5 text-moss-400 group-hover:text-olive-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <span className="text-sm font-bold text-moss-700">{fotoFile ? fotoFile.name : "Pilih Berkas Foto"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'foto')} />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-3">NIB</label>
                    <input type="text" value={nib} onChange={(e) => setNib(e.target.value)} placeholder="12345" className="w-full p-4 bg-[#F9FAF8] border border-moss-200 rounded-xl focus:ring-2 focus:ring-olive-500 text-sm font-mono transition-all" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-3">Koordinat GPS</label>
                    <input type="text" value={gps} onChange={(e) => setGps(e.target.value)} placeholder="-6.20, 106.81" className="w-full p-4 bg-[#F9FAF8] border border-moss-200 rounded-xl focus:ring-2 focus:ring-olive-500 text-sm font-mono transition-all" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-3">Luas (M²)</label>
                    <input type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="150" className="w-full p-4 bg-[#F9FAF8] border border-moss-200 rounded-xl focus:ring-2 focus:ring-olive-500 text-sm font-mono transition-all" />
                  </div>
                </div>
                
                <div className="pt-6 border-t border-moss-100">
                  <button 
                    onClick={handleRegisterLand}
                    disabled={isUploading || isMintPending}
                    className="w-full py-5 bg-moss-700 hover:bg-moss-800 text-white text-base font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                  >
                    {isUploading ? '1. Mengunggah ke IPFS...' : isMintPending ? '2. Mencetak ke Blockchain...' : 'Daftarkan Tanah ke Blockchain'}
                  </button>
                  {uploadedHashes.warkah && (
                    <div className="mt-4 p-4 bg-olive-50 rounded-xl text-xs font-mono text-moss-700 break-all border border-olive-100">
                      Berhasil di-upload ke IPFS!<br/>
                      Warkah: ipfs://{uploadedHashes.warkah}<br/>
                      Foto: ipfs://{uploadedHashes.foto}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-moss-100 p-8 rounded-[2rem] shadow-sm"
            >
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-moss-900 mb-2">Riwayat Pendaftaran</h3>
                <p className="text-moss-500">Anda dapat memantau sertifikat yang Anda cetak di sini.</p>
              </div>
              <LandLedger />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
