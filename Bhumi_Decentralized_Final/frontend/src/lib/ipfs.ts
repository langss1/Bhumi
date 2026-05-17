/**
 * Bang Bang Protocol — Document Storage via Supabase Storage
 *
 * MENGAPA SUPABASE STORAGE (bukan Pinata IPFS):
 * - Pinata = cloud service juga, tidak lebih "decentralized" dari Supabase untuk project ini
 * - Supabase sudah ada di stack (1 layanan, bukan 2)
 * - Supabase Storage gratis sampai 1 GB
 * - Integrasi lebih simple: upload → dapat URL publik → share ke verificator
 *
 * INTEGRITAS TERJAMIN:
 * - SHA-256 dihitung CLIENT-SIDE sebelum upload (bukan server)
 * - Hash ini yang disimpan ON-CHAIN sebagai documentHash
 * - Verificator download file → hash ulang → bandingkan dengan on-chain hash
 * - Jika hash berbeda → dokumen telah dimodifikasi → tolak!
 *
 * SETUP (1x):
 * 1. Buka Supabase Dashboard → Storage → New Bucket
 *    Name: "documents" | Public: ✅ (ON)
 * 2. Set .env.local:
 *    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 *    NEXT_PUBLIC_SUPABASE_ANON=your_anon_key
 */

import { supabase } from '@/lib/supabase';

const BUCKET = 'documents';

// Cek apakah Supabase sudah dikonfigurasi
const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== '' &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project');

// Cek apakah Pinata IPFS dikonfigurasi
const PINATA_CONFIGURED = !!process.env.NEXT_PUBLIC_PINATA_JWT;

// Export config status (dipakai di landing page)
export const STORAGE_CONFIGURED = SUPABASE_CONFIGURED || PINATA_CONFIGURED;

/** @deprecated use STORAGE_CONFIGURED */
export const IPFS_CONFIGURED    = SUPABASE_CONFIGURED;

// ─── SHA-256 client-side (integrity proof) ────────────────────────────────────
export async function computeSHA256(file: File): Promise<string> {
  const buf  = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Upload dokumen ke Supabase Storage ───────────────────────────────────────
export interface UploadResult {
  /** SHA-256 hex dari file — disimpan on-chain sebagai documentHash */
  hash: string;
  /** Supabase Storage public URL — dibagikan ke verificator */
  url: string;
  /** Path di bucket storage */
  path: string;
  /** True jika berhasil upload ke cloud, False jika hanya hitung hash */
  uploaded: boolean;
}

export async function uploadDocument(
  file: File,
  meta: { assetName: string; ownerWallet?: string }
): Promise<UploadResult> {
  // 1) Hitung SHA-256 dulu (selalu — ini integrity proof-nya)
  const hash = await computeSHA256(file);

  if (!SUPABASE_CONFIGURED && !PINATA_CONFIGURED) {
    console.warn(
      '[BangBang Storage] Cloud Storage belum dikonfigurasi.\n' +
      'Set NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_PINATA_JWT di .env.local'
    );
    return { hash, url: '', path: '', uploaded: false };
  }

  // --- OPSI 1: PINATA IPFS (VIA SERVER PROXY) --- //
  try {
    console.log("[BangBang] Uploading to Cloud via API...");
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const resData = await res.json();
    if (res.ok && resData.success) {
      console.log("[BangBang] Cloud Upload Success:", resData.url);
      return {
        hash, 
        url: resData.url,
        path: resData.cid,
        uploaded: true,
      };
    } else {
      console.warn("[BangBang] Cloud Upload failed via API, falling back to local:", resData.error);
    }
  } catch (err: any) {
    console.error("[BangBang] API Upload Error:", err.message);
  }
  
  // Fallback ke local hash jika cloud gagal (untuk demo tetap jalan walau tanpa cloud)
  return { hash, url: '', path: '', uploaded: false };

  // --- OPSI 2: SUPABASE STORAGE --- //

  // 2) Path di bucket: {hash}/{nama_file_aman}
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path     = `${hash}/${safeName}`;

  // 3) Upload ke Supabase Storage
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert:      false, // jangan overwrite (hash sama = file sama)
      metadata: {
        assetName:   meta.assetName,
        ownerWallet: meta.ownerWallet || 'unknown',
        sha256:      hash,
        uploadedAt:  new Date().toISOString(),
      },
    });

  // Jika file sudah ada (duplicate upload = file sama = hash sama), itu OK
  const err = error as any;
  if (err && !err.message?.includes('already exists')) {
    throw new Error(`Gagal upload dokumen: ${err.message}`);
  }

  // 4) Ambil public URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    hash,
    url:      data.publicUrl,
    path,
    uploaded: true,
  };
}

// ─── Buat URL dari hash yang tersimpan ────────────────────────────────────────
// (dipanggil dari verificator page untuk membuka dokumen)
export function getDocumentUrl(hash: string, filename?: string): string {
  if (!STORAGE_CONFIGURED || !hash) return '';
  // Jika ini CID (Pinata IPFS), biasanya berawalan Qm atau bafy
  if (hash.startsWith('Qm') || hash.startsWith('bafy')) {
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }
  const safeName = filename ? filename.replace(/[^a-zA-Z0-9._-]/g, '_') : 'document';
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${hash}/${safeName}`;
}

// ─── Cek apakah URL adalah Supabase/IPFS URL yang valid ───────────────────
export function isCloudStorageUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('/storage/v1/object/public/') || url.includes('/ipfs/');
}

// ─── Backward compat aliases (untuk kode yang masih pakai nama lama) ─────────
/** @deprecated use getDocumentUrl */
export function getIPFSUrl(hash: string): string {
  // Untuk backward compat: cek apakah hash berbentuk Supabase storage path
  // atau CID lama dari pinata
  if (!hash) return '';
  // Jika sudah berupa full URL (disimpan sebagai documentUrl di localStorage)
  if (hash.startsWith('http')) return hash;
  // Jika ada Supabase configured, generate URL
  if (SUPABASE_CONFIGURED) return getDocumentUrl(hash, 'document');
  return '';
}

/** @deprecated use isCloudStorageUrl */
export function isRealIPFSCID(hash: string): boolean {
  if (!hash) return false;
  // Full URL (baru)
  if (hash.startsWith('http')) return true;
  // Legacy IPFS CID
  if (hash.startsWith('Qm') || hash.startsWith('bafy')) return true;
  return false;
}

/** @deprecated use getDocumentUrl */
export function getPublicGateways(hashOrUrl: string): string[] {
  if (!hashOrUrl) return [];
  // Jika sudah URL, return langsung
  if (hashOrUrl.startsWith('http')) return [hashOrUrl];
  // Jika SHA-256 hex, generate Supabase URL
  if (SUPABASE_CONFIGURED) return [getDocumentUrl(hashOrUrl, 'document')];
  return [];
}

// ─── Helper: verifikasi integritas file yang didownload ──────────────────────
/**
 * Download file dari URL, hitung SHA-256, bandingkan dengan hash on-chain.
 * Dipakai verificator untuk membuktikan file tidak dimodifikasi.
 */
export async function verifyDocumentIntegrity(
  url: string,
  expectedHash: string
): Promise<{ valid: boolean; actualHash: string }> {
  const res    = await fetch(url);
  const buf    = await res.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const actual = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return { valid: actual === expectedHash, actualHash: actual };
}

// Re-export from supabase for use in register page
export { uploadDocumentToStorage } from '@/lib/supabase';

