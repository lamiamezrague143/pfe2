"use client";
import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "../lib/api";
import { io } from "socket.io-client";


import { Send, MessageSquare, X, Paperclip, User } from "lucide-react";

const SOCKET_SERVER_URL = "http://localhost:5001";

// ─── Lire l'ID depuis le token JWT (plus de hardcode) ────────────────────────
function getCurrentUserFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload; // { id, role, nom, ... }
  } catch {
    return null;
  }
}

// ─── CHAT PANEL ───────────────────────────────────────────────────────────────
export default function ChatPanel() {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(true);
  const [image, setImage]         = useState(null);
  const [preview, setPreview]     = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const fileInputRef = useRef(null);
  const socketRef    = useRef(null);
  const scrollRef    = useRef(null);

  // ─── Init user depuis token
  useEffect(() => {
    const user = getCurrentUserFromToken();
    setCurrentUser(user);
  }, []);

  // ─── Socket + historique
  useEffect(() => {
    const token = localStorage.getItem("token");

    socketRef.current = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      auth: { token }, // envoyer le token au socket aussi
    });

    socketRef.current.on("receive_message", (data) => {
      setMessages((prev) => {
        // éviter les doublons
        if (prev.some((m) => m.id === data.id)) return prev;
        // remplacer le message optimiste (id temporaire Date.now() > 1e12)
        return [...prev.filter((m) => m.id < 1e12 === false || typeof m.id !== "number"), data];
      });
    });

    apiFetch("/messages")
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Erreur historique:", err))
      .finally(() => setLoading(false));

    return () => socketRef.current?.disconnect();
  }, []);

  // ─── Scroll automatique
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Envoi message
  const sendMessage = async () => {
    if (!input.trim() && !image) return;

    const token   = localStorage.getItem("token");
    const content = input.trim();
    const senderId = currentUser?.id;

    // Message optimiste
    const tempId  = Date.now();
    const tempMsg = {
      id: tempId,
      senderId,
      receiverId: 2, // agent par défaut
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInput("");

    try {
      const formData = new FormData();
      formData.append("receiverId", 2);
      formData.append("content", content);
      if (image) formData.append("image", image);

      await fetch("http://localhost:5001/api/messages", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // PAS de Content-Type pour FormData
        },
        body: formData,
      });

      // reset image
      setImage(null);
      setPreview(null);
    } catch (err) {
      console.error("Erreur envoi:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const formatTime = (ts) =>
    ts ? new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 bg-green-700 text-white flex items-center gap-3">
        <MessageSquare size={20} />
        <div>
          <h2 className="font-bold text-sm">Assistance COS UMMTO</h2>
          <p className="text-[10px] text-green-100 italic">Réponse en temps réel</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
          En ligne
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]">
                  <p className="text-sm text-gray-700">Bonjour ! Comment pouvons-nous vous aider aujourd'hui ?</p>
                  <span className="text-[9px] text-gray-400 mt-1 block">Support</span>
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              // ✅ Comparer avec l'ID du token, pas un hardcode
              const isMine = Number(msg.senderId) === Number(currentUser?.id);

              return (
                <div key={msg.id || i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  {!isMine && (
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center mr-2 shrink-0 self-end">
                      <User size={13} className="text-green-700" />
                    </div>
                  )}
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    isMine
                      ? "bg-green-700 text-white rounded-tr-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                  }`}>
                    {msg.content && <p className="leading-relaxed">{msg.content}</p>}
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="pièce jointe"
                        className="rounded-lg max-w-full max-h-60 cursor-pointer mt-2"
                        onClick={() => window.open(msg.image, "_blank")}
                      />
                    )}
                    <span className={`text-[9px] mt-1 block ${isMine ? "text-green-200 text-right" : "text-gray-400"}`}>
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

      {/* Preview image */}
      {preview && (
        <div className="px-3 pt-2 bg-white border-t border-gray-100">
          <div className="relative w-16 h-16">
            <img src={preview} alt="preview" className="w-full h-full object-cover rounded-lg border" />
            <button
              onClick={() => { setPreview(null); setImage(null); }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
            >
              <X size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Écrivez votre message..."
          className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-600"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition"
        >
          <Paperclip size={16} />
        </button>
        <button
          onClick={sendMessage}
          disabled={!input.trim() && !image}
          className="w-10 h-10 bg-green-700 text-white rounded-full flex items-center justify-center hover:bg-green-800 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={15} />
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
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