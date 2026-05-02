'use client';

import React from 'react';
import { useReadContract } from 'wagmi';
import { LandRegistryABI } from '@/lib/abi';
import { LAND_REGISTRY_ADDRESS } from '@/lib/wagmi';

interface LandRowProps {
  tokenId: number;
}

function LandRow({ tokenId }: LandRowProps) {
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
    <tr className={`bg-white hover:bg-moss-50/50 transition-colors border-b border-moss-50 ${land.isDisputed ? 'border-l-4 border-l-red-500' : ''}`}>
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
