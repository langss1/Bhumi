'use client';

import React, { useState } from 'react';
import { useReadContract } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';

interface LandRowProps {
  tokenId: number;
}

function LandRow({ tokenId }: LandRowProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { data: land, isLoading } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getLandDetails',
    args: [BigInt(tokenId)],
  });

  const { data: owner } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)],
  });

  if (isLoading) return (
    <tr className="animate-pulse bg-white border-b border-moss-50">
      <td colSpan={5} className="px-6 py-4 text-center text-moss-300">Memuat data...</td>
    </tr>
  );

  if (!land) return null;

  return (
    <>
      <tr 
        onClick={() => setShowDetails(true)}
        className={`bg-white hover:bg-moss-50/50 transition-colors border-b border-moss-50 cursor-pointer ${land.isDisputed ? 'border-l-4 border-l-red-500' : ''}`}
      >
        <td className="px-6 py-4 font-mono text-xs font-bold text-moss-900">#{tokenId}</td>
        <td className="px-6 py-4 font-mono text-xs text-moss-600 truncate max-w-[120px]">{owner as string}</td>
        <td className="px-6 py-4">
          <span className="text-xs font-bold text-moss-800">{land.nib}</span>
          <div className="text-[10px] text-moss-500 mt-0.5">{land.gpsCoordinates}</div>
        </td>
        <td className="px-6 py-4">
          <span className="text-xs font-medium text-moss-700">{land.area.toString()} m²</span>
        </td>
        <td className="px-6 py-4 text-center">
          {land.isDisputed ? (
            <span className="bg-red-50 text-red-700 text-[10px] font-black px-3 py-1 rounded-full border border-red-100 uppercase tracking-wider">Sengketa</span>
          ) : (
            <span className="bg-olive-50 text-olive-700 text-[10px] font-black px-3 py-1 rounded-full border border-olive-100 uppercase tracking-wider">Terverifikasi</span>
          )}
        </td>
      </tr>

      {/* Detail Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-moss-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl relative">
            <button onClick={() => setShowDetails(false)} className="absolute top-8 right-8 text-moss-400 hover:text-moss-900 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-2xl font-black text-moss-900 mb-6 font-display uppercase tracking-tight">Detail Sertifikat Digital</h3>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-[#F9FAF8] p-5 rounded-2xl border border-moss-100">
                <div className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">Nomor Identifikasi Bidang (NIB)</div>
                <div className="font-bold text-moss-900">{land.nib}</div>
              </div>
              <div className="bg-[#F9FAF8] p-5 rounded-2xl border border-moss-100">
                <div className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">Luas Lahan Terukur</div>
                <div className="font-bold text-moss-900">{land.area.toString()} m²</div>
              </div>
              <div className="bg-[#F9FAF8] p-5 rounded-2xl border border-moss-100 col-span-2">
                <div className="text-[10px] font-black text-moss-400 uppercase tracking-widest mb-1">Titik Koordinat (Geo-Location)</div>
                <div className="font-mono text-sm text-moss-900 font-bold">{land.gpsCoordinates}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black text-moss-900 uppercase tracking-widest">Dokumen Tersemat (IPFS)</h4>
              <div className="flex flex-col gap-3">
                {land.ipfsHashes.map((hash, idx) => (
                  <a key={idx} href={`https://gateway.pinata.cloud/ipfs/${hash}`} target="_blank" rel="noreferrer" 
                    className="flex items-center justify-between p-4 bg-white border border-moss-200 rounded-xl hover:border-olive-500 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-moss-50 rounded flex items-center justify-center text-moss-400 group-hover:text-olive-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      </div>
                      <span className="text-xs font-bold text-moss-700">{idx === 0 ? 'Warkah / Surat Ukur' : idx === 1 ? 'Foto Batas Bidang' : `Dokumen Tambahan #${idx-1}`}</span>
                    </div>
                    <span className="text-[10px] font-mono text-moss-300 group-hover:text-olive-400">LIHAT DATA</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function LandLedger() {
  const { data: totalLands, isLoading: isCountLoading } = useReadContract({
    address: LAND_REGISTRY_ADDRESS,
    abi: LandRegistryABI,
    functionName: 'getTotalLands',
    query: {
      refetchInterval: 5000,
    }
  });

  if (isCountLoading) return <div className="p-10 text-center text-moss-500">Menghubungkan ke Blockchain...</div>;

  const total = Number(totalLands || 0);

  if (total === 0) return (
    <div className="p-20 text-center bg-moss-50/50 rounded-3xl border-2 border-dashed border-moss-200">
      <p className="text-moss-400 font-bold">Belum ada data tanah di Ledger Blockchain</p>
    </div>
  );

  return (
    <div className="bg-white border border-moss-100 rounded-[2rem] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-[#F9FAF8] border-b border-moss-100">
            <tr>
              <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">ID</th>
              <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">Pemilik (Wallet)</th>
              <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">Informasi Lahan</th>
              <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest">Luas</th>
              <th className="px-6 py-4 text-[11px] font-black text-moss-400 uppercase tracking-widest text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(total)].map((_, i) => (
              <LandRow key={i} tokenId={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
