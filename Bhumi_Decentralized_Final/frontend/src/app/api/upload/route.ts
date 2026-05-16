import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;
    if (!pinataJWT) {
      return NextResponse.json({ error: 'Pinata JWT not configured in server' }, { status: 500 });
    }

    console.log('[API Upload] Sending to Pinata...');
    const pinataData = new FormData();
    pinataData.append('file', file);

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJWT}`
      },
      body: pinataData
    });

    const resData = await res.json();
    if (!res.ok) {
      console.error('[API Upload] Pinata Error:', resData);
      return NextResponse.json({ error: resData.error?.message || 'Pinata upload failed' }, { status: res.status });
    }

    return NextResponse.json({ 
      success: true, 
      cid: resData.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${resData.IpfsHash}`
    });

  } catch (error: any) {
    console.error('[API Upload] Internal Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
