"use client";
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Send, MessageSquare, User, Users, Search, Circle } from "lucide-react";

const SOCKET_SERVER_URL = "http://localhost:5001";
const ADMIN_ID = 999;



// ─── UTILITAIRES ──────────────────────────────────────────────────────────────
const formatTime = (ts) =>
  ts ? new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

const formatDate = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

// ─── PAGE ADMIN MESSAGERIE ────────────────────────────────────────────────────
export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState([]); // liste des utilisateurs ayant écrit
  const [selectedUser, setSelectedUser]   = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState("");
  const [search, setSearch]               = useState("");
  const [loading, setLoading]             = useState(true);
  const socketRef                         = useRef(null);
  const scrollRef                         = useRef(null);

useEffect(() => {
  socketRef.current = io(SOCKET_SERVER_URL, { withCredentials: true });

  socketRef.current.on("receive_message", (msg) => {
    setMessages((prev) => [...prev, msg]);

    setConversations((prev) => {
      const exists = prev.find((c) => c.userId === msg.senderId);

      if (exists) {
        return prev.map((c) =>
          c.userId === msg.senderId
            ? {
                ...c,
                lastMessage: msg.content,
                lastTime: msg.createdAt,
                unread:
                  selectedUser?.userId === msg.senderId
                    ? 0
                    : (c.unread || 0) + 1,
              }
            : c
        );
      }

      return [
        {
          userId: msg.senderId,
          name: `Utilisateur #${msg.senderId}`,
          lastMessage: msg.content,
          lastTime: msg.createdAt,
          unread: 1,
        },
        ...prev,
      ];
    });
  });

  fetchConversations();

  return () => socketRef.current?.disconnect();
}, []);


  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Chargement des conversations (sidebar) ──────────────────────────────────
  const fetchConversations = async () => {
    try {
      const res = await fetch(`${SOCKET_SERVER_URL}/api/messages`);
      const ct  = res.headers.get("content-type");
      if (!res.ok || !ct?.includes("application/json")) throw new Error();
      const data = await res.json();

      // Grouper par senderId pour avoir une conversation par utilisateur
      const map = {};
      data.forEach((msg) => {
        const uid = msg.senderId === ADMIN_ID ? msg.receiverId : msg.senderId;
        if (!map[uid]) map[uid] = { userId: uid, name: `Utilisateur #${uid}`, lastMessage: msg.content, lastTime: msg.createdAt, unread: 0 };
        else { map[uid].lastMessage = msg.content; map[uid].lastTime = msg.createdAt; }
      });

      setConversations(Object.values(map).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime)));
    } catch (e) {
      console.error("Erreur conversations:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Sélection d'un utilisateur → charge ses messages ───────────────────────
  const selectUser = async (conv) => {
    setSelectedUser(conv);
    setInput("");
    // Marquer comme lu
    setConversations((prev) => prev.map((c) => c.userId === conv.userId ? { ...c, unread: 0 } : c));

    try {
      const res  = await fetch(`${SOCKET_SERVER_URL}/api/messages?userId=${conv.userId}`);
      const ct   = res.headers.get("content-type");
      if (!res.ok || !ct?.includes("application/json")) throw new Error();
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erreur messages:", e);
      setMessages([]);
    }
  };

  // ── Envoi d'une réponse ─────────────────────────────────────────────────────
const sendReply = () => {
  if (!input.trim() || !selectedUser || !socketRef.current) return;

  socketRef.current.emit("send_message", {
    senderId: ADMIN_ID,
    receiverId: selectedUser.userId,
    content: input.trim(),
  });

  setInput("");
};
  const filteredConvs = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* ── HEADER ── */}
      <header className="bg-green-700 text-white px-6 py-4 flex items-center gap-3 shadow-md">
        <MessageSquare size={22} />
        <div>
          <h1 className="font-black text-base tracking-tight">Messagerie Administration</h1>
          <p className="text-[11px] text-green-200">COS UMMTO — Espace de réponse aux demandes</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px] bg-white/20 px-3 py-1.5 rounded-full font-bold">
          <Circle size={8} className="fill-green-300 text-green-300" />
          Admin connecté
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">

        {/* ── SIDEBAR CONVERSATIONS ── */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-green-500 border-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100">
            <Users size={13} className="text-gray-400" />
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
              {conversations.length} conversation{conversations.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-10 text-gray-400">
                <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs">Aucune conversation</div>
            ) : (
              filteredConvs.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => selectUser(conv)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition text-left ${
                    selectedUser?.userId === conv.userId ? "bg-green-50 border-l-4 border-l-green-600" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <User size={16} className="text-green-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-800 truncate">{conv.name}</p>
                      <span className="text-[9px] text-gray-400 shrink-0 ml-1">{formatDate(conv.lastTime)}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-green-600 text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ── ZONE CONVERSATION ── */}
        <main className="flex-1 flex flex-col bg-gray-50">
          {!selectedUser ? (
            // État vide
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center">
                <MessageSquare size={28} className="text-gray-400" />
              </div>
              <p className="font-semibold text-sm">Sélectionnez une conversation</p>
              <p className="text-xs text-gray-400">Cliquez sur un utilisateur dans la liste à gauche</p>
            </div>
          ) : (
            <>
              {/* Header conversation */}
              <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                  <User size={16} className="text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{selectedUser.name}</p>
                  <p className="text-[10px] text-gray-400">ID : {selectedUser.userId}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-[10px] text-green-600 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  En ligne
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 text-xs py-10">Aucun message dans cette conversation.</div>
                ) : (
                  messages.map((msg, i) => {
                    const isAdmin = Number(msg.senderId) === Number(ADMIN_ID);
                    return (
                      <div key={msg.id || i} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                        {!isAdmin && (
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center mr-2 shrink-0 self-end">
                            <User size={13} className="text-gray-500" />
                          </div>
                        )}
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                          isAdmin
                            ? "bg-green-700 text-white rounded-tr-none"
                            : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                        }`}>
                          <p className="leading-relaxed">{msg.content}</p>
                          <span className={`text-[9px] mt-1 block ${isAdmin ? "text-green-200 text-right" : "text-gray-400"}`}>
                            {isAdmin ? "Vous (Admin)" : selectedUser.name} · {formatTime(msg.createdAt || msg.timestamp)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>

              {/* Input réponse */}
              <div className="bg-white border-t border-gray-200 p-4 flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder={`Répondre à ${selectedUser.name}...`}
                  rows={1}
                  className="flex-1 bg-gray-100 border-none rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-600 resize-none"
                  style={{ minHeight: "42px", maxHeight: "120px" }}
                />
                <button
                  onClick={sendReply}
                  disabled={!input.trim()}
                  className="w-10 h-10 bg-green-700 text-white rounded-full flex items-center justify-center hover:bg-green-800 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
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