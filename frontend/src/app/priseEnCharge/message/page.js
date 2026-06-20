"use client";
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Send, MessageSquare, User, Users, Search, Trash2, Lock } from "lucide-react";
import { apiFetch } from "../../../lib/api";

const SOCKET_SERVER_URL = "http://localhost:5001";

const formatTime = (ts) =>
  ts ? new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

const formatDate = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

// ✅ myId passé en paramètre (plus de référence à un state externe)
const getUserName = (msg, uid, myId) => {
  const u = Number(msg.senderId) !== myId ? msg.sender : msg.receiver;
  if (u?.prenomComplet && u?.nomComplet) return `${u.prenomComplet} ${u.nomComplet}`;
  if (u?.nomComplet) return u.nomComplet;
  return `Utilisateur #${uid}`;
};

// ─────────────────────────────────────────────
// UTILITAIRES CHIFFREMENT (Web Crypto API)
// ─────────────────────────────────────────────

const bufToBase64 = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));

const base64ToBuf = (b64) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
// Remplacer generateRSAKeyPair() dans ChatPanel.jsx
const generateRSAKeyPair = () =>
  window.crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    false,   // ← extractable FALSE : la clé privée ne peut plus être exportée ni volée
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
    "spki", buf,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false, ["encrypt"]
  );
};

const importPrivateKey = async (b64) => {
  const clean = b64
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const buf = base64ToBuf(clean);
  return window.crypto.subtle.importKey(
    "pkcs8", buf,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true, ["decrypt"]
  );
};

const encryptMessage = async (plaintext, recipientPublicKey) => {
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, aesKey, encoded
  );
  const rawAES = await window.crypto.subtle.exportKey("raw", aesKey);
  const encryptedAESKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" }, recipientPublicKey, rawAES
  );
  return JSON.stringify({
    encryptedAESKey: bufToBase64(encryptedAESKey),
    iv: bufToBase64(iv),
    encryptedContent: bufToBase64(encryptedContent),
  });
};

const decryptMessage = async (ciphertextJSON, privateKey) => {
  if (!ciphertextJSON) return "";

  let parsed;
  try {
    parsed = JSON.parse(ciphertextJSON);
  } catch {
    return ciphertextJSON;
  }

  if (!parsed.encryptedAESKey || !parsed.iv || !parsed.encryptedContent) {
    return ciphertextJSON;
  }

  try {
    const { encryptedAESKey, iv, encryptedContent } = parsed;
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
    return "🔒 Message chiffré (clé expirée)";
  }
};

// ─────────────────────────────────────────────
// PERSISTENCE DES CLÉS (localStorage)
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// PERSISTENCE DES CLÉS (localStorage)
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// PERSISTENCE DES CLÉS (localStorage)
// ─────────────────────────────────────────────

const getOrGenerateAdminKeyPair = async () => {
  const storedPriv = localStorage.getItem("admin_rsa_private_key");
  const storedPub  = localStorage.getItem("admin_rsa_public_key");

  if (storedPriv && storedPub) {
    const privateKey = await importPrivateKey(storedPriv);
    const publicKey  = await importPublicKey(storedPub);
    return { privateKey, publicKey, publicKeyB64: storedPub };
  }

  const keyPair = await window.crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKeyB64  = await exportPublicKey(keyPair.publicKey);
  const privateKeyB64 = await exportPrivateKey(keyPair.privateKey);

  localStorage.setItem("admin_rsa_public_key",  publicKeyB64);
  localStorage.setItem("admin_rsa_private_key", privateKeyB64);

  try {
    await apiFetch("/users/public-key", {
      method: "POST",
      body: JSON.stringify({ publicKey: publicKeyB64 }),
    });
  } catch (e) {
    console.warn("[E2EE] Impossible d'enregistrer la clé publique :", e);
  }

  return { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey };
};
export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser]   = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState("");
  const [search, setSearch]               = useState("");
  const [loading, setLoading]             = useState(true);
  const [deletingId, setDeletingId]       = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [e2eeReady, setE2eeReady]         = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null); // pour le JSX

  const socketRef         = useRef(null);
  const scrollRef         = useRef(null);
  const selectedUserRef   = useRef(null);
  const privateKeyRef     = useRef(null);
  const publicKeyRef      = useRef(null);
  const recipientKeysRef  = useRef({});
  const currentUserIdRef  = useRef(null); // ✅ pour les callbacks async

  // ── 1. Clés RSA + lecture ID depuis token ──
useEffect(() => {
  (async () => {
const { privateKey, publicKey } = await getOrGenerateAdminKeyPair();    privateKeyRef.current = privateKey;
    publicKeyRef.current  = publicKey;

    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.id);
        currentUserIdRef.current = payload.id;
      }
    } catch (e) {
      console.warn("Token invalide", e);
    }

    setE2eeReady(true);
  })();
}, []);
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  // ── 2. Socket ──
  useEffect(() => {
    if (!e2eeReady) return;

    const socket = io(SOCKET_SERVER_URL, { withCredentials: true });
    socketRef.current = socket;

    const onMessageReceived = async (msg) => {
      const myId = currentUserIdRef.current; // ✅ toujours à jour

      if (Number(msg.senderId) === myId) {
        // Message envoyé par moi-même (echo du serveur) → remplacer le temp
        const uid = Number(msg.receiverId);

        setMessages((prev) => {
          const hasTempId = prev.some((m) => typeof m.id === "string" && m.id.startsWith("temp-"));
          if (hasTempId) {
            const lastTempIdx = [...prev].reverse().findIndex(
              (m) => typeof m.id === "string" && m.id.startsWith("temp-")
            );
            const realIdx = prev.length - 1 - lastTempIdx;
            const updated = [...prev];
            updated[realIdx] = { ...msg, content: prev[realIdx].content };
            return updated;
          }
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        setConversations((prev) =>
          prev.map((c) => c.userId === uid ? { ...c, lastTime: msg.createdAt } : c)
        );
        return;
      }

      // Message reçu d'un bénéficiaire
      const isRelevant =
        Number(msg.senderId) === Number(selectedUserRef.current?.userId) ||
        Number(msg.receiverId) === Number(selectedUserRef.current?.userId);

      let decryptedContent = msg.content;
      if (privateKeyRef.current) {
        decryptedContent = await decryptMessage(msg.content, privateKeyRef.current);
      }
      const decryptedMsg = { ...msg, content: decryptedContent };

      if (isRelevant) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, decryptedMsg];
        });
      }

      const uid = Number(msg.senderId) === myId
        ? Number(msg.receiverId)
        : Number(msg.senderId);

      setConversations((prev) =>
        prev.map((c) =>
          c.userId === uid
            ? { ...c, lastMessage: decryptedContent, lastTime: msg.createdAt }
            : c
        )
      );
    };

    socket.on("receive_message", onMessageReceived);
    fetchConversations();

    return () => {
      socket.off("receive_message", onMessageReceived);
      socket.disconnect();
    };
  }, [e2eeReady]);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── fetchConversations ──
  const fetchConversations = async () => {
    try {
      const myId = currentUserIdRef.current; // ✅ ref, pas state
      const data = await apiFetch("/messages");
      if (!data) return;

      const list = Array.isArray(data) ? data
        : Array.isArray(data?.messages) ? data.messages
        : Array.isArray(data?.data) ? data.data : [];

      const map = {};
      for (const msg of list) {
        const uid = Number(msg.senderId) === myId
          ? Number(msg.receiverId)
          : Number(msg.senderId);

        const raw = Number(msg.senderId) === myId && msg.contentForSender
          ? msg.contentForSender
          : msg.content;

        let previewContent = raw;
        if (privateKeyRef.current) {
          previewContent = await decryptMessage(raw, privateKeyRef.current);
        }

        if (!map[uid] || new Date(msg.createdAt) > new Date(map[uid].lastTime)) {
          map[uid] = {
            userId: uid,
            name: getUserName(msg, uid, myId), // ✅ myId passé en paramètre
            lastMessage: previewContent,
            lastTime: msg.createdAt,
            unread: 0,
          };
        }
      }

      setConversations(Object.values(map).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime)));
    } catch (e) { console.error("Erreur conversations:", e); }
    finally { setLoading(false); }
  };

  // ── selectUser ──
  const selectUser = async (conv) => {
    setSelectedUser(conv);
    setConfirmDelete(null);
    setConversations((prev) => prev.map((c) => c.userId === conv.userId ? { ...c, unread: 0 } : c));

    try {
      const myId = currentUserIdRef.current; // ✅ ref
      const data = await apiFetch(`/messages?userId=${conv.userId}`);
      const list = Array.isArray(data) ? data
        : Array.isArray(data?.messages) ? data.messages
        : Array.isArray(data?.data) ? data.data : [];

      const filtered = list.filter((m) =>
        Number(m.senderId) === conv.userId || Number(m.receiverId) === conv.userId
      );

      const decryptedList = await Promise.all(
        filtered.map(async (m) => {
          const raw = Number(m.senderId) === myId && m.contentForSender
            ? m.contentForSender
            : m.content;
          return {
            ...m,
            content: privateKeyRef.current
              ? await decryptMessage(raw, privateKeyRef.current)
              : raw,
          };
        })
      );
      setMessages(decryptedList);
    } catch (e) { setMessages([]); }
  };

  // ── sendReply ──
  const sendReply = async () => {
    if (!input.trim() || !selectedUser) return;

    const plaintext = input.trim();
    const myId = currentUserIdRef.current; // ✅ ref

    // Récupérer la clé publique du bénéficiaire
    let recipientKey = recipientKeysRef.current[selectedUser.userId];
    if (!recipientKey) {
      try {
        const keyData = await apiFetch(`/users/public-key/${selectedUser.userId}`);
        if (keyData?.publicKey) {
          recipientKey = await importPublicKey(keyData.publicKey);
          recipientKeysRef.current[selectedUser.userId] = recipientKey;
        }
      } catch (e) {
        console.warn("[E2EE] Clé publique du destinataire introuvable.", e);
      }
    }

    const encryptedForRecipient = recipientKey
      ? await encryptMessage(plaintext, recipientKey)
      : plaintext;

    const encryptedForSelf = publicKeyRef.current
      ? await encryptMessage(plaintext, publicKeyRef.current)
      : plaintext;

    // ✅ Afficher en clair localement
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: tempId,
      senderId: myId,
      receiverId: selectedUser.userId,
      content: plaintext,
      createdAt: new Date().toISOString(),
    }]);
    setInput("");

    // ✅ Envoyer via HTTP pour sauvegarder contentForSender en BDD
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:5001/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          receiverId: selectedUser.userId,
          content: encryptedForRecipient,
          contentForSender: encryptedForSelf,
        }),
      });
    } catch (err) {
      console.error("Erreur envoi:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };


  const filteredConvs = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans">

      {/* ── HEADER ── */}
      <header className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white px-6 py-4 flex items-center gap-3 shadow-lg shadow-emerald-900/20">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
          <MessageSquare size={18} />
        </div>
        <div>
          <h1 className="font-black text-base tracking-tight">Messagerie Administration</h1>
          <p className="text-[11px] text-emerald-200 font-medium">UMMTO — Espace de réponse aux demandes</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-full font-bold border backdrop-blur-sm transition-all ${
            e2eeReady
              ? "bg-emerald-500/20 border-emerald-300/30 text-emerald-100"
              : "bg-white/10 border-white/20 text-white/50"
          }`}>
            <Lock size={10} />
            {e2eeReady ? "Chiffrement actif" : "Initialisation…"}
          </div>
          <div className="flex items-center gap-2 text-[11px] bg-white/15 border border-white/20 px-3 py-1.5 rounded-full font-bold backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Admin connecté
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">

        {/* ── SIDEBAR ── */}
        <aside className="w-80 bg-white border-r border-slate-100 flex flex-col shrink-0 shadow-sm">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition-all font-medium text-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
            <Users size={13} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {conversations.length} conversation{conversations.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-medium">Aucune conversation</div>
            ) : (
              filteredConvs.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => selectUser(conv)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-slate-50 hover:bg-emerald-50/40 transition-all text-left ${
                    selectedUser?.userId === conv.userId
                      ? "bg-emerald-50 border-l-4 border-l-emerald-600"
                      : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shrink-0 border border-emerald-100">
                    <User size={15} className="text-emerald-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-800 truncate uppercase tracking-tight">{conv.name}</p>
                      <span className="text-[9px] text-slate-400 shrink-0 ml-1 font-medium">
                        {formatDate(conv.lastTime)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ── ZONE CONVERSATION ── */}
        <main className="flex-1 flex flex-col bg-slate-50">
          {!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center border border-emerald-100 shadow-sm">
                <MessageSquare size={28} className="text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="font-black text-sm text-slate-600 uppercase tracking-tight">Sélectionnez une conversation</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Cliquez sur un utilisateur dans la liste à gauche</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header conversation */}
              <div className="bg-white border-b border-slate-100 px-6 py-3.5 flex items-center gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center border border-emerald-100">
                  <User size={15} className="text-emerald-700" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedUser.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium">ID : {selectedUser.userId}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                    <Lock size={9} />
                    E2EE
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    En ligne
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-slate-400 text-xs py-10 font-medium italic">
                    Aucun message dans cette conversation.
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    // ✅ currentUserId (state) utilisé ici pour le rendu JSX
                    const isAdmin = Number(msg.senderId) === Number(currentUserId);
                    const isConfirming = confirmDelete === msg.id;
                    const isDeleting = deletingId === msg.id;

                    return (
                      <div
                        key={msg.id || i}
                        className={`flex items-end gap-2 group ${isAdmin ? "justify-end" : "justify-start"}`}
                      >
                        {!isAdmin && (
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 border border-slate-200">
                            <User size={13} className="text-slate-500" />
                          </div>
                        )}

                        <div className={`flex flex-col ${isAdmin ? "items-end" : "items-start"} max-w-[70%]`}>
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                              isAdmin
                                ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-tr-none shadow-emerald-200"
                                : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                            }`}
                          >
                            <p className="leading-relaxed font-medium">{msg.content}</p>
                            {msg.image && (
                              <img src={`http://localhost:5001/api/pieces/${msg.image}/raw`} alt="pièce jointe" alt="Attachement"
                                className="mt-2 rounded-xl max-w-full h-auto border border-slate-100"
                                onError={(e) => (e.target.style.display = "none")} />
                            )}
                            <span className={`text-[9px] mt-1 flex items-center gap-1 font-medium ${isAdmin ? "text-emerald-200 justify-end" : "text-slate-400"}`}>
                              <Lock size={7} />
                              {isAdmin ? "Vous (Admin)" : selectedUser.name} · {formatTime(msg.createdAt || msg.timestamp)}
                            </span>
                          </div>

                         
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>

              {/* Input */}
              <div className="bg-white border-t border-slate-100 p-4 flex gap-2 items-end shadow-sm">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder={`Répondre à ${selectedUser.name}...`}
                  rows={1}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 resize-none transition-all font-medium text-slate-700"
                  style={{ minHeight: "42px", maxHeight: "120px" }}
                />
                <button
                  onClick={sendReply}
                  disabled={!input.trim() || !e2eeReady}
                  className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-xl flex items-center justify-center hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95"
                  title={!e2eeReady ? "Initialisation du chiffrement..." : "Envoyer"}
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}