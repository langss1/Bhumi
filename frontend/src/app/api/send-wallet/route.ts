import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email, name, address, privateKey } = await req.json();

    if (!email || !address || !privateKey) {
      return NextResponse.json(
        { error: 'Email, address, and privateKey are required' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'uangku.apps@gmail.com',
        pass: process.env.SMTP_PASS || 'csqoxiwzwpadaokq',
      },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #2F4F4F; border-bottom: 2px solid #2F4F4F; padding-bottom: 10px;">Selamat Datang di Bhumi Web3</h2>
          <p>Halo <strong>${name || 'Pengguna'}</strong>,</p>
          <p>Pendaftaran Anda telah disetujui. Berikut adalah informasi Dompet Digital (Wallet) Anda untuk mengakses layanan sistem sertifikasi tanah digital (BPN):</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Wallet Address (Public)</p>
              <p style="margin: 5px 0 15px 0; font-family: monospace; font-size: 14px; color: #334155; word-break: break-all;">${address}</p>
              
              <p style="margin: 0; font-size: 12px; color: #991b1b; font-weight: bold; text-transform: uppercase;">Private Key (Rahasia)</p>
              <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 14px; color: #b91c1c; word-break: break-all;">${privateKey}</p>
          </div>
          
          <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 10px 15px; margin-bottom: 20px;">
              <p style="margin: 0; color: #c2410c; font-size: 14px;"><strong>PENTING:</strong> Simpan Private Key Anda dengan aman. Jangan pernah membagikannya kepada siapa pun. Impor Private Key ini ke dompet MetaMask Anda untuk mulai bertransaksi.</p>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">Terima kasih,<br>Tim Bhumi Decentralized</p>
      </div>
    `;

    await transporter.sendMail({
      from: '"Bhumi Web3" <no-reply@bhumi.web3>',
      to: email,
      subject: 'Informasi Akses Wallet Bhumi Web3 Anda',
      html: htmlContent,
    });

    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}
