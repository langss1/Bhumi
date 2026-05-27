import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Baca konfigurasi environment dari frontend
const envPath = path.join(__dirname, '../Bhumi_Decentralized_Final/frontend/.env.local');
dotenv.config({ path: envPath });

// Konfigurasi ABI Smart Contract
const CONTRACT_JSON_PATH = process.env.CONTRACT_ABI_PATH || path.join(__dirname, '../Bhumi_Decentralized_Final/frontend/src/contracts/LandRegistry.json');

// Inisialisasi Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("⚠️ WARNING: Kredensial NEXT_PUBLIC_SUPABASE_URL atau ANON key tidak ditemukan di .env.local!");
}

const supabase = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_KEY || 'placeholder');

// Konfigurasi Node RPC Fallback (Agar tidak terpaku pada 1 laptop)
const NODE_URLS = [
    process.env.NEXT_PUBLIC_RPC_URL, // Coba dari .env dulu (opsional)
    'http://10.223.153.80:8545',     // Node 1: Gilang
    'http://10.223.153.176:8545',    // Node 2: Arin
    'http://10.223.153.30:8545',     // Node 3: Ihab
].filter(Boolean); // Hapus jika ada yang kosong

/**
 * Mencari Node Blockchain pertama yang hidup (Online)
 */
async function getActiveProvider() {
    for (const url of NODE_URLS) {
        try {
            console.log(`[Jaringan] Mengecek koneksi ke: ${url}`);
            const tempProvider = new ethers.JsonRpcProvider(url);
            await tempProvider.getNetwork(); // Tes koneksi (akan error jika mati)
            return { provider: tempProvider, url: url };
        } catch (error) {
            console.log(`[Jaringan] ❌ Node ${url} sedang mati atau terputus.`);
        }
    }
    return null; // Semua mati
}

/**
 * Mengambil detail aset dari blockchain dan menyimpannya ke Supabase
 */
async function upsertAssetToSupabase(tokenId, contract, txHash = 'SYNC') {
    try {
        const land = await contract.getLandDetails(tokenId);

        let owner = 'Unknown';
        try {
            owner = await contract.ownerOf(tokenId);
        } catch (e) {
            // Abaikan jika token belum di-mint secara penuh
        }

        // Mempersiapkan struktur metadata
        const metadata = {
            asset_id: Number(tokenId),
            asset_name: `Tanah NIB ${land[2]}`, // land[2] adalah NIB
            category: 'Tanah Sertifikat',
            status: land[4] ? 'Sengketa' : 'Verified', // land[4] adalah isDisputed
            valuation: Number(land[1]) * 1500000, // Simulasi harga: Luas (land[1]) * 1.5jt
            owner_wallet: owner,
            document_hash: land[3].length > 0 ? land[3][land[3].length - 1] : '', // land[3] adalah kumpulan ipfsHashes
            tx_hash: txHash
        };

        // 1. Simpan metadata ke tabel asset_metadata
        const { error: errorAsset } = await supabase.from('asset_metadata').upsert(metadata);

        if (errorAsset) {
            console.error(`[Supabase] ❌ Gagal menyimpan metadata Token ${tokenId}:`, errorAsset.message);
        } else {
            console.log(`[Supabase] ✅ Metadata berhasil disinkronisasi untuk Token ${tokenId}`);
        }

        // 2. Catat log aktivitas ke tabel activity_log
        const { error: errorLog } = await supabase.from('activity_log').insert({
            asset_id: Number(tokenId),
            actor_wallet: owner,
            action: txHash === 'SYNC' ? 'historical_sync' : 'verified_on_chain',
            tx_hash: txHash
        });

        if (errorLog) {
            console.error(`[Supabase] ❌ Gagal mencatat log aktivitas Token ${tokenId}:`, errorLog.message);
        }

    } catch (err) {
        console.error(`[Supabase] ❌ Gagal memproses Token ${tokenId}:`, err.message);
    }
}

async function main() {
    console.log('=============================================');
    console.log(' 🌐 BHUMI WEB 2.5 - SUPABASE INDEXER        ');
    console.log('=============================================');
    console.log(`Database   : Supabase (${SUPABASE_URL})`);

    if (!fs.existsSync(CONTRACT_JSON_PATH)) {
        console.error('\n❌ ERROR: File ABI Contract (LandRegistry.json) tidak ditemukan.');
        console.error('Pastikan kamu sudah melakukan compile/deploy dari Hardhat.');
        return;
    }

    // MENCARI NODE YANG HIDUP SECARA OTOMATIS
    const activeConnection = await getActiveProvider();

    if (!activeConnection) {
        console.error('\n🚨 KRITIS: SELURUH NODE (Gilang, Arin, Ihab) SEDANG MATI!');
        console.error('Silakan cek ZeroTier atau nyalakan minimal satu laptop.');
        console.log('Mencoba ulang dalam 10 detik...\n');
        setTimeout(main, 10000);
        return;
    }

    const provider = activeConnection.provider;
    console.log(`\n✅ TERHUBUNG KE NODE: ${activeConnection.url}`);

    const contractData = JSON.parse(fs.readFileSync(CONTRACT_JSON_PATH, 'utf8'));

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || contractData.address;

    if (!contractAddress || contractAddress === "0x") {
        console.error('\n⏳ Address Smart Contract belum tersedia di .env.local atau JSON. Menunggu...');
        setTimeout(main, 5000);
        return;
    }

    const contract = new ethers.Contract(contractAddress, contractData.abi, provider);

    console.log(`Memantau jaringan Blockchain pada Contract: ${contractAddress}`);

    // ==========================================
    // 1. SINKRONISASI HISTORIS (Saat Startup)
    // ==========================================
    console.log('\n[Sinkronisasi] Memulai penarikan data historis dari Blockchain ke Supabase...');
    try {
        const totalLands = await contract.getTotalLands();
        console.log(`[Sinkronisasi] Ditemukan ${totalLands} sertifikat di ledger.`);

        for (let i = 0; i < totalLands; i++) {
            await upsertAssetToSupabase(i, contract, 'SYNC');
        }
        console.log('[Sinkronisasi] Penarikan data historis selesai.');
    } catch (error) {
        console.error('[Sinkronisasi] Gagal membaca Total Lands dari blockchain:', error.message);
    }

    // ==========================================
    // 2. LISTENER REAL-TIME (Untuk Event Baru)
    // ==========================================
    console.log('\n[Listener] Indexer online. Menunggu transaksi pendaftaran tanah baru...');

    contract.on('AssetMinted', async (tokenId, owner, nib, event) => {
        console.log(`\n🔔 [EVENT BARU] AssetMinted terdeteksi!`);
        console.log(`Token ID: ${tokenId} | NIB: ${nib} | Pemilik: ${owner}`);

        // Integrasi Web 2.5: Dorong data sertifikat baru ke Supabase
        await upsertAssetToSupabase(tokenId, contract, event.log.transactionHash);
    });
}

main().catch(console.error);
