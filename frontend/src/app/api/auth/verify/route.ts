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

    // Pemetaan Role dari input Frontend ke Format Database Supabase
    const roleMapping: Record<string, string> = {
      'user': 'UMUM',
      'bpn-wilayah': 'BPN_WILAYAH',
      'notaris': 'NOTARIS',
      'bpn-pusat': 'BPN_PUSAT',
      'auditor': 'AUDITOR',
    };

    const targetDbRole = roleMapping[simulatedRole || 'user'];

    // Verifikasi Role di Database Supabase
    // Menggunakan fetch biasa atau Admin Client. Untuk amannya, kita panggil anonymous client dengan supabase service key jika ada, atau sekadar public anon.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profile, error: dbErr } = await supabase
      .from('profiles')
      .select('role')
      .ilike('wallet_address', address as string)
      .single();

    if (dbErr || !profile) {
      return NextResponse.json({ success: false, message: 'Wallet Anda belum terdaftar di sistem.' }, { status: 403 });
    }

    if (profile.role !== targetDbRole) {
      return NextResponse.json({ success: false, message: `Akses ditolak. Wallet ini tidak memiliki izin untuk dasbor ${targetDbRole}.` }, { status: 403 });
    }

    const role = simulatedRole || 'user';
    
    const response = NextResponse.json({ success: true, role });
    
    // Set HTTP-Only Cookie untuk dibaca oleh Middleware Next.js
    response.cookies.set({
      name: 'user_role',
      value: role,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 hari
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
