const crypto = require('crypto');

const generateKeyPair = () => {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding:  { type: 'spki',  format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
};

const encrypt = (data, publicKeyPem) => {
  const buffer = Buffer.from(JSON.stringify(data), 'utf8');
  return crypto.publicEncrypt(publicKeyPem, buffer).toString('base64');
};

const decrypt = (encryptedData, privateKeyPem) => {
  const buffer = Buffer.from(encryptedData, 'base64');
  const decrypted = crypto.privateDecrypt(privateKeyPem, buffer);
  return JSON.parse(decrypted.toString('utf8'));
};

module.exports = { generateKeyPair, encrypt, decrypt };