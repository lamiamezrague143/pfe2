"use client";
import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "../lib/api";
import { io } from "socket.io-client";
import { Send, MessageSquare, X, Paperclip, User } from "lucide-react";

const SOCKET_SERVER_URL = "http://localhost:5001";

function getCurrentUserFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
}

export default function ChatPanel() {
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(true);
  const [image, setImage]             = useState(null);
  const [preview, setPreview]         = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const fileInputRef = useRef(null);
  const socketRef    = useRef(null);
  const scrollRef    = useRef(null);

  useEffect(() => {
    setCurrentUser(getCurrentUserFromToken());
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    socketRef.current = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      auth: { token },
    });

    socketRef.current.on("receive_message", (data) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev.filter((m) => m.id < 1e12 === false || typeof m.id !== "number"), data];
      });
    });

    apiFetch("/messages")
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Erreur historique:", err))
      .finally(() => setLoading(false));

    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() && !image) return;

    const token    = localStorage.getItem("token");
    const content  = input.trim();
    const senderId = currentUser?.id;
    const tempId   = Date.now();

    setMessages((prev) => [...prev, {
      id: tempId, senderId, receiverId: 2,
      content, createdAt: new Date().toISOString(),
    }]);
    setInput("");

    try {
      const formData = new FormData();
      formData.append("receiverId", 2);
      formData.append("content", content);
      if (image) formData.append("image", image);

      await fetch("http://localhost:5001/api/messages", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      setImage(null);
      setPreview(null);
    } catch (err) {
      console.error("Erreur envoi:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };
const deleteMessage = async (id) => {
  try {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:5001/api/messages/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    // retirer du state
    setMessages((prev) => prev.filter((m) => m.id !== id));
  } catch (err) {
    console.error("Erreur suppression message:", err);
  }
};
  const formatTime = (ts) =>
    ts ? new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="bg-white rounded-2xl shadow-sm shadow-slate-200 border border-slate-100 overflow-hidden flex flex-col h-[600px]">

      {/* ── Header ── */}
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
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-full text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
          En ligne
        </span>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/60 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full text-slate-400">
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
                  <span className="text-[9px] text-slate-400 mt-1 block">Support</span>
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              const isMine = Number(msg.senderId) === Number(currentUser?.id);
              return (
                <div key={msg.id || i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
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
                        src={msg.image}
                        alt="pièce jointe"
                        className="rounded-xl max-w-full max-h-60 cursor-pointer mt-2 border border-white/20"
                        onClick={() => window.open(msg.image, "_blank")}
                      />
                    )}
                    {isMine && (
  <button
    onClick={() => deleteMessage(msg.id)}
    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600"
  >
    <X size={12} />
  </button>
)}
                    <span className={`text-[9px] mt-1 block ${isMine ? "text-emerald-100/80 text-right" : "text-slate-400"}`}>
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

      {/* ── Preview image ── */}
      {preview && (
        <div className="px-3 pt-2.5 bg-white border-t border-slate-100">
          <div className="relative w-16 h-16">
            <img src={preview} alt="preview" className="w-full h-full object-cover rounded-xl border border-slate-200 shadow-sm" />
            <button
              onClick={() => { setPreview(null); setImage(null); }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition"
            >
              <X size={11} />
            </button>
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Écrivez votre message..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition shrink-0"
        >
          <Paperclip size={16} />
        </button>
        <button
          onClick={sendMessage}
          disabled={!input.trim() && !image}
          className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-xl flex items-center justify-center hover:from-emerald-700 hover:to-teal-700 transition shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
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