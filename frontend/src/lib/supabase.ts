/**
 * Supabase client for Bang Bang Protocol
 *
 * ══════════════════════════════════════════════════
 * ARSITEKTUR DATA — VOLATILITY CONCEPT
 * ══════════════════════════════════════════════════
 *
 * ON-CHAIN (Source of Truth — immutable, trustless):
 *   ✅ Asset state (status, owner, valuation)
 *   ✅ documentHash (SHA-256 untuk verifikasi integritas)
 *   ✅ Escrow ETH (0.001 per aset)
 *   ✅ RBAC (isVerificator mapping)
 *
 * OFF-CHAIN — SUPABASE DATABASE (queryable, searchable):
 *   📋 verificator_accounts  → username, nama, wallet, password_hash, status
 *   📋 asset_metadata        → nama, kategori, documentUrl (Storage URL)
 *   📋 activity_log          → riwayat verified/rejected + tx_hash
 *
 * OFF-CHAIN — SUPABASE STORAGE (file storage):
 *   🗂️  Bucket: 'documents'  → file PDF/JPG/PNG
 *   🌐 URL publik: accessible dari browser/komputer MANA SAJA
 *   🔒 Integritas: SHA-256 client-side → hash di-store on-chain
 *
 * ══════════════════════════════════════════════════
 * SETUP (1x):
 *   1. Buat project di https://app.supabase.com (free)
 *   2. Jalankan SQL schema di SQL Editor (lihat bawah)
 *   3. Buat Storage bucket "documents" (Public: ON)
 *   4. Set .env.local:
 *      NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 *      NEXT_PUBLIC_SUPABASE_ANON=your_anon_key
 * ══════════════════════════════════════════════════
 *
 * SQL SCHEMA (jalankan di Supabase SQL Editor):
 *
 *   CREATE TABLE users (
 *     wallet_address TEXT PRIMARY KEY,
 *     display_name   TEXT,
 *     email          TEXT UNIQUE,
 *     avatar_url     TEXT,
 *     password       TEXT, -- optional if using hashed password
 *     created_at     TIMESTAMPTZ DEFAULT NOW()
 *   );
 *
 *   CREATE TABLE verificator_accounts (
 *     username      TEXT PRIMARY KEY,
 *     name          TEXT NOT NULL,
 *     wallet        TEXT NOT NULL UNIQUE,
 *     institution   TEXT NOT NULL,
 *     password_hash TEXT NOT NULL,
 *     status        TEXT DEFAULT 'pending',
 *     registered_at TIMESTAMPTZ DEFAULT NOW()
 *   );
 *
 *   CREATE TABLE asset_metadata (
 *     asset_id      BIGINT PRIMARY KEY,
 *     asset_name    TEXT NOT NULL,
 *     category      TEXT NOT NULL,
 *     status        TEXT DEFAULT 'Pending',
 *     valuation     NUMERIC DEFAULT 0,
 *     owner_email   TEXT,
 *     owner_wallet  TEXT NOT NULL,
 *     document_hash TEXT NOT NULL,
 *     document_url  TEXT,
 *     tx_hash       TEXT,
 *     created_at    TIMESTAMPTZ DEFAULT NOW()
 *   );
 *
 *   CREATE TABLE activity_log (
 *     id           SERIAL PRIMARY KEY,
 *     asset_id     BIGINT,
 *     actor_wallet TEXT NOT NULL,
 *     action       TEXT NOT NULL,
 *     tx_hash      TEXT,
 *     timestamp    TIMESTAMPTZ DEFAULT NOW()
 *   );
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  || '';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const SUPABASE_READY = !!(SUPABASE_URL && SUPABASE_ANON && !SUPABASE_URL.includes('your-project'));

if (!SUPABASE_READY && typeof window !== 'undefined') {
  console.warn(
    '[BangBang] Supabase belum dikonfigurasi.\n' +
    'Set NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON di .env.local\n' +
    'Buat project gratis di https://app.supabase.com'
  );
}

export const supabase = createClient(
  SUPABASE_URL  || 'https://placeholder.supabase.co',
  SUPABASE_ANON || 'placeholder'
);

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface DBProfile {
  id:                  string;
  email:               string;
  full_name:           string | null;
  wallet_address:      string | null;
  role:                'BPN_PUSAT' | 'BPN_WILAYAH' | 'NOTARIS' | 'AUDITOR' | 'UMUM';
  verification_status: string;
  evidence_url:        string | null;
  updated_at:          string;
}

export interface DBAssetMeta {
  asset_id:      number;
  asset_name:    string;
  category:      string;
  status:        string;
  valuation:     number;
  owner_email:   string | null;
  owner_wallet:  string;
  document_hash: string;   // SHA-256 hex — HARUS match on-chain documentHash
  document_url:  string | null;  // Supabase Storage public URL
  created_at:    string;
}

export interface DBActivity {
  id:           number;
  asset_id:     number;
  actor_wallet: string;
  action:       'registered' | 'verified' | 'rejected' | 'updated' | 'transferred' | 'archived';
  tx_hash:      string | null;
  timestamp:    string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE QUERIES
// ─────────────────────────────────────────────────────────────────────────────

// ── Profiles ─────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<DBProfile | null> {
  if (!SUPABASE_READY) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function updateProfile(userId: string, updates: Partial<DBProfile>) {
  if (!SUPABASE_READY) return null;
  return supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
}

export async function getPendingVerificators(): Promise<DBProfile[]> {
  if (!SUPABASE_READY) return [];
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('verification_status', 'PENDING')
    .in('role', ['NOTARIS', 'AUDITOR'])
    .order('updated_at', { ascending: false });
  return data || [];
}

// ── Asset metadata ───────────────────────────────────────────────────────────

export async function upsertAssetMeta(meta: Omit<DBAssetMeta, 'created_at'>) {
  if (!SUPABASE_READY) return null;
  return supabase.from('asset_metadata').upsert(meta);
}

export async function getAssetMeta(assetId: number): Promise<DBAssetMeta | null> {
  if (!SUPABASE_READY) return null;
  const { data } = await supabase
    .from('asset_metadata')
    .select('*')
    .eq('asset_id', assetId)
    .single();
  return data;
}

export async function searchAssets(query: string) {
  if (!SUPABASE_READY) return { data: [], error: null };
  return supabase
    .from('asset_metadata')
    .select('*')
    .textSearch('asset_name', query, { type: 'plain' });
}

// ── Activity log ─────────────────────────────────────────────────────────────

export async function logActivity(
  entry: Omit<DBActivity, 'id' | 'timestamp'>
) {
  if (!SUPABASE_READY) return null;
  return supabase.from('activity_log').insert({
    ...entry,
    timestamp: new Date().toISOString(),
  });
}

export async function getActivityByAsset(assetId: number): Promise<DBActivity[]> {
  if (!SUPABASE_READY) return [];
  const { data } = await supabase
    .from('activity_log')
    .select('*')
    .eq('asset_id', assetId)
    .order('timestamp', { ascending: false });
  return data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const BUCKET = 'documents';

export async function uploadDocumentToStorage(
  file: File,
  sha256hash: string
): Promise<{ url: string; path: string } | null> {
  if (!SUPABASE_READY) {
    console.warn('[BangBang] Supabase belum dikonfigurasi. File tidak di-upload ke cloud.');
    return null;
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path     = `${sha256hash}/${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert:      false, 
    });

  if (error && !error.message.toLowerCase().includes('already exists')) {
    console.error('[BangBang] Upload failed:', error.message);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { url: data.publicUrl, path };
}

export function getStoragePublicUrl(sha256hash: string, filename: string = 'document'): string {
  if (!SUPABASE_READY || !sha256hash) return '';
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(`${sha256hash}/${safeName}`);
  return data.publicUrl;
}
