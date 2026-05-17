import { NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, signature, message, simulatedRole } = body;

    if (!address || !signature || !message) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    // Verify the SIWE signature using viem
    const valid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!valid) {
      return NextResponse.json({ success: false, message: 'Signature tidak valid!' }, { status: 401 });
    }

    // Cek Role di Supabase berdasarkan Wallet Address
    let role = 'user'; // Default route jika tidak ditemukan
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, verification_status')
        .ilike('wallet_address', address) // Gunakan ilike agar case-insensitive (0xAbC == 0xabc)
        .single();
        
      if (profile && !error) {
        // Jika status PENDING dan bukan BPN, arahkan ke UMUM agar tidak bisa mengakses dashboard sensitif
        if (['NOTARIS', 'AUDITOR'].includes(profile.role) && profile.verification_status === 'PENDING') {
          role = 'user';
        } else {
          role = profile.role;
        }
      }
    } catch (e) {
      console.error("Supabase Query Error:", e);
      role = 'user';
    }
    
    // Normalisasi string role untuk mencocokkan format routing Next.js (misal: BPN_WILAYAH -> bpn-wilayah)
    // Pengecualian: UMUM -> user
    let routeRole = role.toLowerCase().replace('_', '-');
    if (routeRole === 'umum') routeRole = 'user';
    
    const response = NextResponse.json({ success: true, role: routeRole });
    
    // Set HTTP-Only Cookie untuk dibaca oleh Middleware Next.js
    response.cookies.set({
      name: 'user_role',
      value: routeRole,
      path: '/',
      httpOnly: false, // Set false for testing if frontend needs it, but middleware reads it either way
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 hari
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
