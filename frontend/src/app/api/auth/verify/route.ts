import { NextResponse } from 'next/server';
import { verifyMessage } from 'viem';

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

    // Simulasi pengecekan database Supabase (RBAC)
    // Di produksi, kita akan melakukan query ke Supabase users table
    const role = simulatedRole || 'user';
    
    const response = NextResponse.json({ success: true, role });
    
    // Set HTTP-Only Cookie untuk dibaca oleh Middleware Next.js
    response.cookies.set({
      name: 'user_role',
      value: role,
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
