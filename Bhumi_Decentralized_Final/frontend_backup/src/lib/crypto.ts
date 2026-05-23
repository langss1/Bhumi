/**
 * crypto.ts — Enkripsi/Dekripsi Data Sensitif Tanah
 * Menggunakan AES-GCM (256-bit) via Web Crypto API (built-in browser).
 * Tidak memerlukan library tambahan.
 */

const PASSPHRASE = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'bhumi-bpn-sistem-pertanahan-2024';
const SALT = 'bhumi-salt-v1';

async function getDerivedKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(PASSPHRASE),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Enkripsi teks menjadi string base64 yang aman disimpan di blockchain/IPFS.
 */
export async function encryptData(plainText: string): Promise<string> {
  if (!plainText) return plainText;
  try {
    const key = await getDerivedKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plainText)
    );
    // Gabungkan IV + ciphertext, lalu encode ke base64
    const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
    return 'ENC:' + btoa(String.fromCharCode(...combined));
  } catch (e) {
    console.error('Enkripsi gagal:', e);
    return plainText;
  }
}

/**
 * Dekripsi string base64 kembali ke teks asli.
 * Jika data tidak terenkripsi (data lama), kembalikan apa adanya.
 */
export async function decryptData(encryptedText: string): Promise<string> {
  if (!encryptedText || !encryptedText.startsWith('ENC:')) {
    return encryptedText; // Data lama / tidak terenkripsi, tampilkan apa adanya
  }
  try {
    const key = await getDerivedKey();
    const base64 = encryptedText.slice(4); // Hapus prefix 'ENC:'
    const combined = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error('Dekripsi gagal:', e);
    return '[Data Terenkripsi]';
  }
}

/**
 * Helper: cek apakah string sudah dienkripsi
 */
export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith('ENC:');
}
