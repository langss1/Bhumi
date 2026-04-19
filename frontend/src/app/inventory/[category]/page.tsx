'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Landmark, Car, Coins, ArrowUpRight } from 'lucide-react';

const DETAILED_ASSETS = {
  property: [
    { id: 101, name: "Premium Villa Dago", valuation: "$850,000", status: "Verified", location: "Bandung, ID" },
    { id: 102, name: "Penthouse Menteng", valuation: "$420,000", status: "Pending", location: "Jakarta, ID" },
    { id: 103, name: "Apartment SCBD Tower A", valuation: "$320,000", status: "Verified", location: "Jakarta, ID" },
  ],
  vehicle: [
    { id: 201, name: "Porsche 911 GT3", valuation: "$220,000", status: "Review", year: "2023" },
    { id: 202, name: "Tesla Model S Plaid", valuation: "$110,000", status: "Verified", year: "2024" },
  ],
  gold: [
    { id: 301, name: "Gold Bullion 24k (100g)", valuation: "$7,500", status: "Verified", purity: "99.9%" },
    { id: 302, name: "Antam Gold Bar (50g)", valuation: "$3,750", status: "Verified", purity: "99.9%" },
  ]
};

const CATEGORY_ICONS = {
  property: <Landmark className="text-emerald-600" size={24} />,
  vehicle: <Car className="text-blue-600" size={24} />,
  gold: <Coins className="text-amber-600" size={24} />,
};

export default function InventoryCategoryPage() {
  const params = useParams();
  const category = (params.category as string)?.toLowerCase() || 'property';
  const assets = DETAILED_ASSETS[category as keyof typeof DETAILED_ASSETS] || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pt-8 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
               {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 capitalize">{category} Inventory</h1>
              <p className="text-sm text-slate-400">Manage your specific {category} assets</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Asset Name</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Valuation</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {assets.map((asset: any) => (
              <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="font-bold text-slate-900">{asset.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{asset.location || asset.year || asset.purity}</div>
                </td>
                <td className="px-8 py-6 font-bold text-slate-900">
                  {asset.valuation}
                </td>
                <td className="px-8 py-6">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                    asset.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    {asset.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="p-2 text-slate-300 hover:text-emerald-500 transition-colors">
                    <ArrowUpRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
