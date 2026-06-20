"use client";
import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "../lib/api";
import { io } from "socket.io-client";
import { Send, MessageSquare, X, Paperclip, User, Lock } from "lucide-react";

const SOCKET_SERVER_URL = "http://localhost:5001";

function getCurrentUserFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return null; }
}

const bufToBase64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const base64ToBuf = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
// ChatPanel.jsx — extractable DOIT être true ici
const generateRSAKeyPair = () =>
  window.crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,          // ← true obligatoire pour pouvoir sauvegarder en localStorage
    ["encrypt", "decrypt"]
  );

// Stocker la clé dans IndexedDB (pas localStorage)
const saveKeyToIDB = async (key, name) => {
  const db = await openDB();  // ouvrir IndexedDB
  const tx = db.transaction("keys", "readwrite");
  tx.objectStore("keys").put({ id: name, key });
  await tx.done;
};

const exportPublicKey = async (publicKey) => {
  const exported = await window.crypto.subtle.exportKey("spki", publicKey);
  return bufToBase64(exported);
};

const exportPrivateKey = async (privateKey) => {
  const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
  return bufToBase64(exported);
};

const importPublicKey = async (b64) => {
  const clean = b64
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\s+/g, "");
  const buf = base64ToBuf(clean);
  return window.crypto.subtle.importKey(
    "spki", buf, { name: "RSA-OAEP", hash: "SHA-256" }, false, ["encrypt"]
  );
};

const importPrivateKey = async (b64) => {
  const clean = b64
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const buf = base64ToBuf(clean);
  return window.crypto.subtle.importKey(
    "pkcs8", buf, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]
  );
};

const getOrGenerateKeyPair = async () => {
  const storedPriv = localStorage.getItem("rsa_private_key");
  const storedPub  = localStorage.getItem("rsa_public_key");

  if (storedPriv && storedPub) {
    const privateKey = await importPrivateKey(storedPriv);
    const publicKey  = await importPublicKey(storedPub);
    return { privateKey, publicKey, publicKeyB64: storedPub };
  }

  const keyPair = await generateRSAKeyPair();
  const publicKeyB64  = await exportPublicKey(keyPair.publicKey);
  const privateKeyB64 = await exportPrivateKey(keyPair.privateKey);

  localStorage.setItem("rsa_public_key",  publicKeyB64);
  localStorage.setItem("rsa_private_key", privateKeyB64);

  return { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey, publicKeyB64 };
};

const encryptMessage = async (plaintext, recipientPublicKey) => {
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encryptedContent = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoded);
  const rawAES = await window.crypto.subtle.exportKey("raw", aesKey);
  const encryptedAESKey = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, recipientPublicKey, rawAES);
  return JSON.stringify({
    encryptedAESKey: bufToBase64(encryptedAESKey),
    iv: bufToBase64(iv),
    encryptedContent: bufToBase64(encryptedContent),
  });
};

const decryptMessage = async (ciphertextJSON, privateKey) => {
  try {
    const { encryptedAESKey, iv, encryptedContent } = JSON.parse(ciphertextJSON);
    const rawAES = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" }, privateKey, base64ToBuf(encryptedAESKey)
    );
    const aesKey = await window.crypto.subtle.importKey(
      "raw", rawAES, { name: "AES-GCM" }, false, ["decrypt"]
    );
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBuf(iv) }, aesKey, base64ToBuf(encryptedContent)
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return ciphertextJSON;
  }
};

export default function ChatPanel() {
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(true);
  const [image, setImage]             = useState(null);
  const [preview, setPreview]         = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [e2eeReady, setE2eeReady]     = useState(false);
  const [receiverId, setReceiverId]   = useState(null);
const myPublicKeyRef = useRef(null);
  const fileInputRef  = useRef(null);
  const socketRef     = useRef(null);
  const scrollRef     = useRef(null);
  const privateKeyRef = useRef(null);
  const systemKeyRef  = useRef(null);

  useEffect(() => {
    const user = getCurrentUserFromToken();
    setCurrentUser(user);

    (async () => {
      // ✅ Clés persistées du bénéficiaire
const { privateKey, publicKey, publicKeyB64 } = await getOrGenerateKeyPair();
privateKeyRef.current  = privateKey;
myPublicKeyRef.current = publicKey;
      // Enregistrer la clé publique sur le serveur
      try {
        await apiFetch("/users/public-key", {
          method: "POST",
          body: JSON.stringify({ publicKey: publicKeyB64 }),
        });
      } catch (e) {
        console.warn("[E2EE] Impossible d'enregistrer la clé publique :", e);
      }

      // ✅ Récupérer la clé publique système
     // ✅ Une seule route : clé publique de l'agent + son ID
try {
  const res = await apiFetch("/users/public-key/agent");
  if (res?.publicKey) {
    systemKeyRef.current = await importPublicKey(res.publicKey);
    console.log("✅ Clé publique de l'agent chargée");
  }
  if (res?.adminId) {
    setReceiverId(res.adminId);
  }
} catch (e) {
  console.warn("[E2EE] Clé publique de l'agent introuvable :", e);
}

      setE2eeReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!e2eeReady) return;

    const token = localStorage.getItem("token");
    socketRef.current = io(SOCKET_SERVER_URL, { withCredentials: true, auth: { token } });

    // ─── 1. SOCKET receive_message : déchiffrer avant d'afficher ───
socketRef.current.on("receive_message", async (data) => {
  // ✅ AVANT : data.content s'affichait chiffré
  // ✅ APRÈS : on déchiffre avec la clé privée du bénéficiaire
  const decryptedContent = privateKeyRef.current
    ? await decryptMessage(data.content, privateKeyRef.current)
    : data.content;

  setMessages((prev) => {
    if (prev.some((m) => m.id === data.id)) return prev;
    return [...prev, { ...data, content: decryptedContent }]; // ✅ en clair
  });
});
// ─── 2. fetchMessages : déchiffrer l'historique au chargement ───
apiFetch("/messages")
  .then(async (data) => {
    const list = Array.isArray(data) ? data : [];
    
    // ✅ AVANT : list.map() sans déchiffrement → JSON chiffré affiché
    // ✅ APRÈS : déchiffrer chaque message
// Dans fetchMessages / receive_message
const decryptedList = await Promise.all(
  list.map(async (m) => {
    const isMine = Number(m.senderId) === Number(currentUser?.id);
    // ✅ Si c'est mon message, utiliser contentForSender (chiffré avec ma propre clé)
    const raw = isMine && m.contentForSender ? m.contentForSender : m.content;
    return {
      ...m,
      content: privateKeyRef.current
        ? await decryptMessage(raw, privateKeyRef.current)
        : raw,
    };
  })
);
    setMessages(decryptedList);
  })
  .catch((err) => console.error("Erreur historique:", err))
  .finally(() => setLoading(false));

    return () => socketRef.current?.disconnect();
  }, [e2eeReady]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

// ─── 3. sendMessage : bien chiffrer avec systemKey (admin), afficher en clair localement ───
// sendMessage dans ChatPanel.jsx

const sendMessage = async () => {
  if (!input.trim() && !image) return;
  const content  = input.trim();
  const tempId   = Date.now();

  let encryptedForAdmin = content;
  if (systemKeyRef.current && content) {
    encryptedForAdmin = await encryptMessage(content, systemKeyRef.current);
  }

  let encryptedForSelf = null;
  const myPubKey = myPublicKeyRef.current; // ← corrigé, plus de getMyPublicKey()
  if (myPubKey && content) {
    encryptedForSelf = await encryptMessage(content, myPubKey);
  }

  setMessages(prev => [...prev, {
    id: tempId, senderId: currentUser?.id,
    content, createdAt: new Date().toISOString()
  }]);
  setInput("");

  const formData = new FormData();
  formData.append("receiverId", receiverId || 0);
  formData.append("content", encryptedForAdmin);
  if (encryptedForSelf) formData.append("contentForSender", encryptedForSelf);
  if (image) formData.append("image", image);

  const token = localStorage.getItem("token");
  await fetch("http://localhost:5001/api/messages", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
};


  const formatTime = (ts) =>
    ts ? new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-slate-200 border border-slate-100 overflow-hidden flex flex-col h-[600px]">
      <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm" />
          <div className="relative w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <MessageSquare size={17} className="text-white" />
          </div>
        </div>
        <div>
          <h2 className="font-black text-white text-sm tracking-tight">Assistance COS UMMTO</h2>
          <p className="text-[10px] text-emerald-100 font-medium mt-0.5">Réponse en temps réel</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold border transition-all ${
            e2eeReady
              ? "bg-emerald-500/20 border-emerald-300/30 text-white"
              : "bg-white/10 border-white/20 text-white/50"
          }`}>
            <Lock size={9} />
            {e2eeReady ? "Chiffré" : "Init..."}
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-full text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            En ligne
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/60 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mr-2 shrink-0 self-end shadow-sm">
                  <User size={13} className="text-white" />
                </div>
                <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]">
                  <p className="text-sm text-slate-700 leading-relaxed">Bonjour ! Comment pouvons-nous vous aider aujourd'hui ?</p>
                  <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                    <Lock size={7} /> Support · chiffré
                  </span>
                </div>
              </div>
            )}
            {messages.map((msg, i) => {
              const isMine = Number(msg.senderId) === Number(currentUser?.id);
              return (
                <div key={msg.id != null ? String(msg.id) : `idx-${i}`} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  {!isMine && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mr-2 shrink-0 self-end shadow-sm">
                      <User size={13} className="text-white" />
                    </div>
                  )}
                  <div className={`relative max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    isMine
                      ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tr-sm shadow-emerald-500/20"
                      : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm"
                  }`}>
                    {msg.content && <p className="leading-relaxed">{msg.content}</p>}
                    {msg.image && (
  <img
    src={`http://localhost:5001/api/pieces/${msg.image}`}
    alt="pièce jointe"
    className="rounded-xl max-w-full max-h-60 cursor-pointer mt-2 border border-white/20"
    onClick={() => window.open(`http://localhost:5001/api/pieces/${msg.image}`, "_blank")}
  />
)}
                    <span className={`text-[9px] mt-1 flex items-center gap-1 ${isMine ? "text-emerald-100/80 justify-end" : "text-slate-400"}`}>
                      <Lock size={7} />
                      {isMine ? "Vous" : (msg.sender?.nomComplet || "Support")} · {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </>
        )}
      </div>

      {preview && (
        <div className="px-3 pt-2.5 bg-white border-t border-slate-100">
          <div className="relative w-16 h-16">
            <img src={preview} alt="preview" className="w-full h-full object-cover rounded-xl border border-slate-200 shadow-sm" />
            <button onClick={() => { setPreview(null); setImage(null); }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition">
              <X size={11} />
            </button>
          </div>
        </div>
      )}

      <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={e2eeReady ? "Message chiffré..." : "Initialisation..."}
          disabled={!e2eeReady}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50"
        />
        <button onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-200 text-slate-500 transition shrink-0">
          <Paperclip size={16} />
        </button>
        <button onClick={sendMessage}
          disabled={(!input.trim() && !image) || !e2eeReady}
          className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-xl flex items-center justify-center hover:from-emerald-700 hover:to-teal-700 transition shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
          <Send size={15} />
        </button>
        <input type="file" accept="image/*" ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
          }}
          className="hidden"
        />
      </div>
    </div>
  );
}