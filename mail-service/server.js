require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Konfigurasi Nodemailer dengan Gmail App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Test Koneksi SMTP saat server menyala
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to take our messages');
  }
});

// Endpoint untuk mengirim email
app.post('/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;

  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ success: false, message: 'Data email tidak lengkap (to, subject, text/html)' });
  }

  try {
    const mailOptions = {
      from: `"Bhumi System" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    res.status(200).json({ success: true, message: 'Email berhasil dikirim!', messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Gagal mengirim email.', error: error.message });
  }
});

// Endpoint Health Check
app.get('/', (req, res) => {
  res.send('Bhumi Mail Service is running!');
});

app.listen(PORT, () => {
  console.log(`Mail Service berjalan di port ${PORT}`);
});
