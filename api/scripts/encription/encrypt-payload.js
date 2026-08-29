const crypto = require('crypto');
const fs = require('fs');
const publicKey = fs.readFileSync('public.pem', 'utf8');

// PAYLAOD
const payload = {
    x1_: 11.670682051857582,
    y9: 104.91218700228426,
    ts: '2025-06-21T23:07:10.385Z',
    tc: '1',
};
const dataToEncrypt = JSON.stringify(payload);
const encryptedBuffer = crypto.publicEncrypt(
    {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
    },
    Buffer.from(dataToEncrypt, 'utf8')
);

const encryptedBase64 = encryptedBuffer.toString('base64');
console.log('🔐 Encrypted payload (base64):\n');
console.log(encryptedBase64);
