'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Hash, Trophy, Activity, Play, Square, RefreshCw,
  Info, CheckCircle2, Clock, Cpu, TrendingUp, Database
} from 'lucide-react';

// ─── SHA-256 in browser via SubtleCrypto ──────────────────────────────────────
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface MinerState {
  id: number;
  name: string;
  color: string;
  hashrate: number;      // hashes per second
  nonce: number;
  currentHash: string;
  solved: boolean;
  winCount: number;
}

interface Block {
  index: number;
  data: string;
  nonce: number;
  hash: string;
  winner: string;
  difficulty: number;
  timestamp: string;
  hashesComputed: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ValidatorPoWPage() {
  const [difficulty, setDifficulty] = useState(3); // leading zeros required
  const [mining, setMining] = useState(false);
  const [miners, setMiners] = useState<MinerState[]>([
    { id: 1, name: 'Satoshi Node', color: 'from-orange-500 to-amber-400', hashrate: 0, nonce: 0, currentHash: '', solved: false, winCount: 0 },
    { id: 2, name: 'Vitalik Node', color: 'from-purple-500 to-indigo-400', hashrate: 0, nonce: 0, currentHash: '', solved: false, winCount: 0 },
    { id: 3, name: 'Hal Finney Node', color: 'from-emerald-500 to-teal-400', hashrate: 0, nonce: 0, currentHash: '', solved: false, winCount: 0 },
  ]);
  const [blockchain, setBlockchain] = useState<Block[]>([]);
  const [currentBlockData, setCurrentBlockData] = useState('BangBang::AssetRegistry::2024');
  const [winner, setWinner] = useState<string | null>(null);
  const [totalHashes, setTotalHashes] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const miningRef = useRef(false);
  const startTimeRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const winnerDeclared = useRef(false);

  const target = '0'.repeat(difficulty);

  const stopMining = useCallback(() => {
    miningRef.current = false;
    setMining(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const resetRound = () => {
    stopMining();
    winnerDeclared.current = false;
    setWinner(null);
    setTotalHashes(0);
    setElapsedTime(0);
    setMiners(prev => prev.map(m => ({ ...m, nonce: 0, hashrate: 0, currentHash: '', solved: false })));
  };

  const startMining = async () => {
    resetRound();
    await new Promise(r => setTimeout(r, 80)); // let state clear

    miningRef.current = true;
    winnerDeclared.current = false;
    setMining(true);
    setWinner(null);
    startTimeRef.current = Date.now();

    // Timer
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);

    // Each miner gets a slight random speed advantage (race condition simulation)
    const speeds = [1, 1.3, 0.9].map(s => s * (0.7 + Math.random() * 0.6));

    // Run miners in parallel with different nonce spaces
    const minerPromises = [0, 1, 2].map(async (mi) => {
      const nonce_offset = mi * 100000; // each miner starts from different nonce range
      let nonce = nonce_offset;
      let hashes = 0;
      const speedFactor = speeds[mi];
      const hrUpdateInterval = 100; // update hashrate every 100 hashes
      let batchStart = Date.now();

      while (miningRef.current && !winnerDeclared.current) {
        const hashInput = `${currentBlockData}:${blockchain.length}:${nonce}`;
        const hash = await sha256(hashInput);
        hashes++;
        nonce++;

        // Update display
        if (hashes % hrUpdateInterval === 0) {
          const now = Date.now();
          const elapsed = (now - batchStart) / 1000;
          const hr = Math.round(hrUpdateInterval / elapsed * speedFactor);
          batchStart = now;

          setMiners(prev => prev.map((m, i) =>
            i === mi ? { ...m, nonce, currentHash: hash, hashrate: hr } : m
          ));
          setTotalHashes(prev => prev + hrUpdateInterval);

          // Throttle faster miners more (simulate network conditions)
          await new Promise(r => setTimeout(r, Math.max(1, Math.floor(10 / speedFactor))));
        }

        if (hash.startsWith(target) && !winnerDeclared.current) {
          winnerDeclared.current = true;

          const winMiner = miners[mi].name;
          const newBlock: Block = {
            index: blockchain.length,
            data: currentBlockData,
            nonce,
            hash,
            winner: winMiner,
            difficulty,
            timestamp: new Date().toLocaleString('id-ID'),
            hashesComputed: hashes,
          };

          setBlockchain(prev => [newBlock, ...prev.slice(0, 9)]);
          setWinner(winMiner);
          setMiners(prev => prev.map((m, i) =>
            i === mi
              ? { ...m, solved: true, currentHash: hash, nonce, winCount: m.winCount + 1 }
              : m
          ));
          stopMining();
          return;
        }
      }
    });

    await Promise.race(minerPromises);
  };

  useEffect(() => {
    return () => {
      miningRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const difficultyLabel = ['', '', 'Easy (2)', 'Medium (3)', 'Hard (4)', 'Expert (5)'];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 pb-20 pt-8 min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-orange-50/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-50/50 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-full text-orange-700 text-[10px] font-black uppercase tracking-wider mb-4">
          <Cpu size={11} /> Proof-of-Work Simulator
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-3">
          Validator Race Condition<br />
          <span className="text-orange-500">Hash-Based Consensus</span>
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Simulasi bagaimana jutaan validator bersaing menemukan hash SHA-256 dengan awalan nol tertentu.
          Yang pertama menemukan valid hash menang dan mendapat reward block — ini adalah <strong>Proof of Work</strong>.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-slate-900 rounded-2xl p-5 mb-6 flex flex-wrap gap-6 items-center">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-orange-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 leading-relaxed">
            <p className="text-white font-bold mb-1">Cara Kerja PoW:</p>
            <p>Setiap validator mencoba jutaan kombinasi <code className="text-orange-300 bg-slate-800 px-1 rounded">hash(data + nonce)</code> sampai hasilnya dimulai dengan <code className="text-orange-300 bg-slate-800 px-1 rounded">{target}</code>.
            Semakin tinggi difficulty, semakin langka hash yang valid, dan semakin lama waktu miningnya.</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Block Data (Payload)</label>
            <input value={currentBlockData} onChange={e => setCurrentBlockData(e.target.value)}
              disabled={mining}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-orange-400 transition-colors disabled:opacity-60" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Difficulty: {difficultyLabel[difficulty]} — Target: <code className="text-orange-500 bg-orange-50 px-1 rounded">{target}...</code>
            </label>
            <div className="flex items-center gap-3">
              <input type="range" min={2} max={5} value={difficulty} onChange={e => setDifficulty(Number(e.target.value))}
                disabled={mining}
                className="flex-1 accent-orange-500" />
              <span className="text-2xl font-black text-slate-900 w-8 text-center">{difficulty}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={startMining} disabled={mining}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20">
            <Play size={16} /> {mining ? 'Mining...' : 'Start Mining Race'}
          </button>
          {mining && (
            <button onClick={stopMining}
              className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black px-6 py-3 rounded-xl transition-all">
              <Square size={16} /> Stop
            </button>
          )}
          <button onClick={resetRound} disabled={mining}
            className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold px-4 py-3 rounded-xl transition-all disabled:opacity-40">
            <RefreshCw size={14} /> Reset
          </button>
          {mining && (
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-orange-400 animate-pulse" />
              <span className="font-mono text-slate-600">{elapsedTime}s · {totalHashes.toLocaleString()} hashes computed</span>
            </div>
          )}
        </div>
      </div>

      {/* Winner Banner */}
      <AnimatePresence>
        {winner && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-6 mb-6 text-white flex items-center gap-4 shadow-xl shadow-orange-500/20">
            <Trophy size={32} className="shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">🏆 Block Winner!</p>
              <p className="text-2xl font-black">{winner}</p>
              <p className="text-orange-100 text-sm">Valid hash ditemukan setelah {totalHashes.toLocaleString()} percobaan · {elapsedTime}s</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Miners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {miners.map((miner, i) => (
          <motion.div key={miner.id}
            animate={miner.solved ? { scale: [1, 1.03, 1] } : {}}
            className={`relative bg-white border-2 rounded-3xl p-5 shadow-sm overflow-hidden transition-all ${
              miner.solved ? 'border-amber-400 shadow-amber-100' :
              mining ? 'border-slate-200' : 'border-slate-100'
            }`}>

            {/* Gradient header */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${miner.color}`} />

            {miner.solved && (
              <div className="absolute top-3 right-3">
                <CheckCircle2 size={20} className="text-amber-500" />
              </div>
            )}

            <div className="mb-4">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r ${miner.color} rounded-full text-white text-[10px] font-black mb-2`}>
                <Cpu size={10} /> Node {miner.id}
              </div>
              <h3 className="font-black text-slate-900">{miner.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                🏆 Wins: {miner.winCount}
              </p>
            </div>

            <div className="space-y-2.5">
              {/* Hashrate */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold">Hashrate</span>
                <span className="font-mono text-xs font-black text-slate-700 flex items-center gap-1">
                  <Zap size={10} className="text-yellow-400" />
                  {mining && !miner.solved ? `${miner.hashrate.toLocaleString()} H/s` : miner.solved ? '✅ Found!' : '—'}
                </span>
              </div>

              {/* Nonce */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold">Nonce</span>
                <span className="font-mono text-xs text-slate-600">{miner.nonce.toLocaleString()}</span>
              </div>

              {/* Current Hash */}
              <div>
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mb-1">Current Hash</span>
                <div className={`font-mono text-[10px] break-all rounded-lg px-2 py-1.5 ${
                  miner.solved ? 'bg-amber-50 text-amber-700' :
                  miner.currentHash.startsWith(target.slice(0, 1)) ? 'bg-orange-50 text-orange-600' :
                  'bg-slate-50 text-slate-500'
                }`}>
                  {miner.currentHash ? miner.currentHash.slice(0, 32) + '...' : '—'}
                </div>
              </div>

              {/* Mining animation */}
              {mining && !miner.solved && (
                <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${miner.color} rounded-full`}
                    animate={{ width: ['10%', '90%', '30%', '70%', '50%'] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Blockchain */}
      {blockchain.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h2 className="font-black text-slate-900 mb-5 flex items-center gap-2">
            <Database size={18} className="text-orange-400" /> Simulated Blockchain
            <span className="text-xs text-slate-400 font-normal ml-1">({blockchain.length} blocks)</span>
          </h2>
          <div className="space-y-3">
            {blockchain.map((block, i) => (
              <motion.div key={block.index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex flex-col md:flex-row gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center font-black text-orange-600 text-sm">
                    #{block.index}
                  </div>
                  {i === 0 && (
                    <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">Latest</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-mono text-[10px] text-slate-500 break-all">
                    <span className="text-orange-500 font-black">{target}</span>{block.hash.slice(difficulty, 24)}...
                  </p>
                  <div className="flex flex-wrap gap-3 text-[10px] text-slate-400">
                    <span>🏆 <strong className="text-slate-600">{block.winner}</strong></span>
                    <span>⛏️ Nonce: <code className="font-mono">{block.nonce.toLocaleString()}</code></span>
                    <span>🔢 Hashes: {block.hashesComputed.toLocaleString()}</span>
                    <span>💎 Difficulty: {block.difficulty}</span>
                    <span>⏱️ {block.timestamp}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Concept Explanation */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: <Activity size={18} className="text-orange-500" />,
            title: 'Race Condition',
            desc: 'Jutaan validator berlomba secara paralel. Tidak ada yang bisa memprediksi siapa yang menang — murni probabilistik berdasarkan kecepatan hash.',
          },
          {
            icon: <Hash size={18} className="text-purple-500" />,
            title: 'SHA-256 Hash Puzzle',
            desc: 'Untuk menemukan hash SHA-256 dengan N leading zeros, rata-rata diperlukan 16^N percobaan. Difficulty 4 = 65.536 percobaan rata-rata.',
          },
          {
            icon: <TrendingUp size={18} className="text-emerald-500" />,
            title: 'Alternatif: PoS',
            desc: 'Bang Bang Protocol menggunakan model Verificator (seperti PoS) — bukan race by hash speed, tapi staking & reputation, lebih efisien untuk RWA.',
          },
        ].map((c, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 mb-3">
              {c.icon}
            </div>
            <h3 className="font-black text-slate-900 text-sm mb-2">{c.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
