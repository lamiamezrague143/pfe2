// lib/crypto.js

export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"]
  );
  const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  return {
    publicKeyB64: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
    privateKeyB64: btoa(String.fromCharCode(...new Uint8Array(privateKey))),
  };
};

// Chiffrement hybride : AES chiffre le texte, RSA chiffre la clé AES
export const encryptMessage = async (text, publicKeyB64) => {
  if (!publicKeyB64) throw new Error("Clé publique manquante");

  // 1. Générer une clé AES temporaire
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Chiffrer le texte avec AES
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoded
  );

  // 3. Exporter la clé AES brute
  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

  // 4. Chiffrer la clé AES avec RSA
  const binaryRsaKey = Uint8Array.from(atob(publicKeyB64), c => c.charCodeAt(0));
  const rsaPublicKey = await window.crypto.subtle.importKey(
    "spki", binaryRsaKey,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false, ["encrypt"]
  );
  const encryptedAesKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    rsaPublicKey,
    rawAesKey
  );

  // 5. Sérialiser : iv + encryptedAesKey + ciphertext en base64
  const payload = {
    iv: btoa(String.fromCharCode(...iv)),
    key: btoa(String.fromCharCode(...new Uint8Array(encryptedAesKey))),
    data: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
  };

  return btoa(JSON.stringify(payload));
};

// Déchiffrement hybride
export const decryptMessage = async (encryptedB64, privateKeyB64) => {
  if (!encryptedB64 || !privateKeyB64) throw new Error("Données manquantes");

  const payload = JSON.parse(atob(encryptedB64));
  const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
  const encryptedAesKey = Uint8Array.from(atob(payload.key), c => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(payload.data), c => c.charCodeAt(0));

  // 1. Déchiffrer la clé AES avec RSA
  const binaryRsaKey = Uint8Array.from(atob(privateKeyB64), c => c.charCodeAt(0));
  const rsaPrivateKey = await window.crypto.subtle.importKey(
    "pkcs8", binaryRsaKey,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false, ["decrypt"]
  );
  const rawAesKey = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    rsaPrivateKey,
    encryptedAesKey
  );

  // 2. Importer la clé AES
  const aesKey = await window.crypto.subtle.importKey(
    "raw", rawAesKey,
    { name: "AES-GCM" },
    false, ["decrypt"]
  );

  // 3. Déchiffrer le texte avec AES
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
};