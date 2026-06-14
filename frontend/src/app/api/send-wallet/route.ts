import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, name, address, privateKey } = await req.json();

    if (!email || !address || !privateKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #2F4F4F; border-bottom: 2px solid #2F4F4F; padding-bottom: 10px;">Selamat Datang di Bhumi Web3</h2>
        <p>Halo <strong>${name}</strong>,</p>
        <p>Pendaftaran Anda telah disetujui. Berikut adalah informasi Dompet Digital (Wallet) Anda untuk mengakses layanan sistem sertifikasi tanah digital (BPN):</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 5px 0; font-size: 12px; color: #6c757d; font-weight: bold;">WALLET ADDRESS (PUBLIC)</p>
          <p style="margin: 0 0 20px 0; font-family: monospace; word-break: break-all; color: #495057;">${address}</p>
          
          <p style="margin: 0 0 5px 0; font-size: 12px; color: #dc3545; font-weight: bold;">PRIVATE KEY (RAHASIA)</p>
          <p style="margin: 0; font-family: monospace; word-break: break-all; color: #dc3545;">${privateKey}</p>
        </div>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>PENTING:</strong> Simpan Private Key Anda dengan aman. Jangan pernah membagikannya kepada siapa pun. Impor Private Key ini ke dompet MetaMask Anda untuk mulai bertransaksi.
          </p>
        </div>
      </div>
    `;

    const mailServiceUrl = process.env.MAIL_SERVICE_URL;
    if (!mailServiceUrl) {
      throw new Error('MAIL_SERVICE_URL is not configured');
    }

    const response = await fetch(mailServiceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: 'Informasi Akses Wallet Bhumi Web3 Anda',
        html: htmlContent
      })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email via VPS');
    }

    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Error in send-wallet API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
