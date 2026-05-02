const QRCode = require('qrcode');
const path   = require('path');
const fs     = require('fs');

const url = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const out = path.join(__dirname, '..', 'public', 'qr.png');

QRCode.toFile(out, url, {
  width: 400,
  margin: 2,
  color: { dark: '#3a2e22', light: '#f4ecdb' },
}, (err) => {
  if (err) {
    console.error('QR generation failed:', err);
    process.exit(0); // non-fatal — build continues
  } else {
    console.log(`QR code generated → ${out} (URL: ${url})`);
  }
});
