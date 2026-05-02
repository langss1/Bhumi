'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToIPFS } from '@/lib/pinata';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('gallery');

  // Form State
  const [warkahFile, setWarkahFile] = useState<File | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedHashes, setUploadedHashes] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'warkah' | 'foto') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'warkah') setWarkahFile(e.target.files[0]);
      if (type === 'foto') setFotoFile(e.target.files[0]);
    }
  };

  const handleRegisterLand = async () => {
    if (!warkahFile || !fotoFile) {
      alert("Harap unggah Warkah dan Foto Batas terlebih dahulu!");
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload ke IPFS
      const warkahHash = await uploadToIPFS(warkahFile);
      const fotoHash = await uploadToIPFS(fotoFile);
      
      setUploadedHashes({ warkah: warkahHash, foto: fotoHash });
      alert(`Berhasil! File diamankan di IPFS.\nHash Warkah: ${warkahHash}\nHash Foto: ${fotoHash}\n\nMenunggu BPN Wilayah untuk Validasi...`);
      
    } catch (error) {
      alert("Gagal mengunggah ke IPFS. Periksa API Key Pinata Anda.");
    } finally {
      setIsUploading(false);
    }
  };

  const tabs = [
    { id: 'gallery', label: 'Galeri Aset Digital' },
    { id: 'daftar', label: 'Daftar Tanah Baru' },
    { id: 'transfer', label: 'Pengajuan Jual Beli' }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Top Navigation Tabs */}
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
                layoutId="userTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-olive-500 rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {/* GALERI TAB */}
          {activeTab === 'gallery' && (
            <motion.div 
              key="gallery"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-moss-100 p-12 rounded-[2rem] shadow-sm min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h3 className="text-2xl font-black text-moss-900">Aset Tanah Saya</h3>
                  <p className="text-sm text-moss-600 mt-2">Sertifikat Hak Milik dalam bentuk ERC-721 NFT</p>
                </div>
                <span className="bg-moss-50 text-olive-600 text-sm font-black px-5 py-2.5 rounded-full border border-moss-100">0 Aset Ditemukan</span>
              </div>
              
              <div className="border-2 border-dashed border-moss-200 bg-moss-50/50 rounded-3xl p-24 text-center flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-8 border border-moss-100">
                  <svg className="w-12 h-12 text-moss-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <h4 className="text-xl font-bold text-moss-900 mb-3">Belum Ada Aset Terdaftar</h4>
                <p className="text-base text-moss-500 max-w-md">Silakan daftarkan tanah baru Anda melalui menu "Daftar Tanah Baru" dan tunggu validasi BPN.</p>
              </div>
            </motion.div>
          )}

          {/* DAFTAR TANAH BARU TAB */}
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
                  <h3 className="text-2xl font-black text-moss-900">Pendaftaran Aset Tanah</h3>
                  <p className="text-sm text-moss-600 mt-2">Unggah dokumen ke IPFS (InterPlanetary File System) untuk desentralisasi data.</p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-4">Warkah / Surat Ukur (PDF)</label>
                    <label className="border-2 border-dashed border-moss-200 rounded-2xl p-8 hover:bg-moss-50 hover:border-moss-300 transition-all cursor-pointer text-center group bg-moss-50/30 flex flex-col items-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 border border-moss-100 group-hover:border-olive-300">
                        <svg className="w-5 h-5 text-moss-400 group-hover:text-olive-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      </div>
                      <span className="text-sm font-bold text-moss-700">{warkahFile ? warkahFile.name : "Pilih Berkas Warkah"}</span>
                      <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(e, 'warkah')} />
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-4">Foto Batas Patok (JPG/PNG)</label>
                    <label className="border-2 border-dashed border-moss-200 rounded-2xl p-8 hover:bg-moss-50 hover:border-moss-300 transition-all cursor-pointer text-center group bg-moss-50/30 flex flex-col items-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 border border-moss-100 group-hover:border-olive-300">
                        <svg className="w-5 h-5 text-moss-400 group-hover:text-olive-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <span className="text-sm font-bold text-moss-700">{fotoFile ? fotoFile.name : "Pilih Berkas Foto"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'foto')} />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-3">Koordinat GPS</label>
                    <input type="text" placeholder="-6.200, 106.816" className="w-full p-4 bg-[#F9FAF8] border border-moss-200 rounded-xl focus:ring-2 focus:ring-olive-500 focus:border-olive-500 text-sm font-mono text-moss-900 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-moss-500 uppercase tracking-widest mb-3">Luas Tanah (M²)</label>
                    <input type="number" placeholder="Contoh: 150" className="w-full p-4 bg-[#F9FAF8] border border-moss-200 rounded-xl focus:ring-2 focus:ring-olive-500 focus:border-olive-500 text-sm font-mono text-moss-900 transition-all" />
                  </div>
                </div>
                
                <div className="pt-6">
                  <button 
                    onClick={handleRegisterLand}
                    disabled={isUploading}
                    className="w-full py-5 bg-moss-700 hover:bg-moss-800 text-white text-base font-bold rounded-xl shadow-[0_8px_20px_rgba(138,154,91,0.3)] transition-all disabled:opacity-50"
                  >
                    {isUploading ? 'Menyandikan ke IPFS...' : 'Kirim & Daftarkan ke Jaringan'}
                  </button>
                  {uploadedHashes.warkah && (
                    <div className="mt-4 p-4 bg-olive-50 rounded-xl border border-olive-100 text-xs font-mono text-moss-700 break-all">
                      <p>Warkah: ipfs://{uploadedHashes.warkah}</p>
                      <p>Foto: ipfs://{uploadedHashes.foto}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TRANSFER TAB */}
          {activeTab === 'transfer' && (
            <motion.div 
              key="transfer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-moss-900 p-12 rounded-[2rem] shadow-2xl relative overflow-hidden max-w-4xl border border-moss-800"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-olive-500 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10">
                <div className="mb-10">
                  <h3 className="text-2xl font-black text-white">Balik Nama (Jual Beli)</h3>
                  <p className="text-base text-moss-200 mt-3 max-w-2xl leading-relaxed">Pindahkan kepemilikan aset NFT ke dompet pihak lain. Proses ini mensyaratkan mekanisme <span className="text-white font-bold">Multi-Signature</span> (Penjual, Pembeli, dan Notaris) agar sah di mata hukum dan blockchain.</p>
                </div>
                
                <div className="bg-moss-950/50 border border-moss-800 p-8 rounded-2xl mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-bold text-moss-400 uppercase tracking-widest mb-3">ID Token (NFT)</label>
                      <input type="text" placeholder="Contoh: 12" className="w-full p-4 bg-moss-900/50 border border-moss-700 rounded-xl focus:ring-2 focus:ring-olive-500 text-base font-mono text-white placeholder-moss-600 transition-all" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-moss-400 uppercase tracking-widest mb-3">Alamat Dompet Pembeli</label>
                      <input type="text" placeholder="0x..." className="w-full p-4 bg-moss-900/50 border border-moss-700 rounded-xl focus:ring-2 focus:ring-olive-500 text-base font-mono text-white placeholder-moss-600 transition-all" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="px-10 py-5 bg-olive-500 hover:bg-olive-400 text-moss-950 text-base font-black rounded-xl transition-colors shadow-[0_0_30px_rgba(107,142,35,0.4)]">
                    Inisiasi Smart Contract
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
