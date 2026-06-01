"use client";
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Send, MessageSquare, User, Users, Search, Circle, Trash2 } from "lucide-react";
import { apiFetch } from "../../../lib/api";

const SOCKET_SERVER_URL = "http://localhost:5001";
const ADMIN_ID = 999;

const formatTime = (ts) =>
  ts ? new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

const formatDate = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

// Remplace toute la fonction getUserName par :
const getUserName = (msg, uid) => {
  const u = Number(msg.senderId) !== ADMIN_ID ? msg.sender : msg.receiver;
  if (u?.prenomComplet && u?.nomComplet)
    return `${u.prenomComplet} ${u.nomComplet}`;
  if (u?.nomComplet) return u.nomComplet;
  return `Utilisateur #${uid}`;
};

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const selectedUserRef = useRef(null);

  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, { withCredentials: true });
    socketRef.current = socket;

    const onMessageReceived = (msg) => {
      const isRelevant =
        Number(msg.senderId) === Number(selectedUserRef.current?.userId) ||
        Number(msg.receiverId) === Number(selectedUserRef.current?.userId);

      if (isRelevant) {
        setMessages((prev) => {
          const exists = prev.find((m) => m.id === msg.id);
          if (exists && msg.id) return prev;
          return [...prev, msg];
        });
      }

      const uid = Number(msg.senderId) === ADMIN_ID ? Number(msg.receiverId) : Number(msg.senderId);
      setConversations((prev) =>
        prev.map((c) => c.userId === uid ? { ...c, lastMessage: msg.content, lastTime: msg.createdAt } : c)
      );
    };

    socket.on("receive_message", onMessageReceived);
    fetchConversations();

    return () => { socket.off("receive_message", onMessageReceived); socket.disconnect(); };
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fetchConversations = async () => {
    try {
      const data = await apiFetch("/messages");
      if (!data) return;

      const list = Array.isArray(data) ? data
        : Array.isArray(data?.messages) ? data.messages
        : Array.isArray(data?.data) ? data.data : [];

      const map = {};
      list.forEach((msg) => {
        const uid = Number(msg.senderId) === ADMIN_ID ? Number(msg.receiverId) : Number(msg.senderId);
        if (!map[uid] || new Date(msg.createdAt) > new Date(map[uid].lastTime)) {
          map[uid] = { userId: uid, name: getUserName(msg, uid), lastMessage: msg.content, lastTime: msg.createdAt, unread: 0 };
        }
      });

      setConversations(Object.values(map).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime)));
    } catch (e) { console.error("Erreur conversations:", e); }
    finally { setLoading(false); }
  };

  const selectUser = async (conv) => {
    setSelectedUser(conv);
    setConfirmDelete(null);
    setConversations((prev) => prev.map((c) => c.userId === conv.userId ? { ...c, unread: 0 } : c));

    try {
      const data = await apiFetch(`/messages?userId=${conv.userId}`);
      const list = Array.isArray(data) ? data
        : Array.isArray(data?.messages) ? data.messages
        : Array.isArray(data?.data) ? data.data : [];

      setMessages(list.filter((m) => Number(m.senderId) === conv.userId || Number(m.receiverId) === conv.userId));
    } catch (e) { setMessages([]); }
  };

  const sendReply = () => {
    if (!input.trim() || !selectedUser || !socketRef.current) return;

    const newMsg = {
      senderId: ADMIN_ID, receiverId: selectedUser.userId,
      content: input.trim(), createdAt: new Date().toISOString(),
    };

    socketRef.current.emit("send_message", newMsg);
    setMessages((prev) => [...prev, newMsg]);
    setConversations((prev) =>
      prev.map((c) => c.userId === selectedUser.userId ? { ...c, lastMessage: newMsg.content, lastTime: newMsg.createdAt } : c)
    );
    setInput("");
  };

  const deleteMessage = async (msgId) => {
    setDeletingId(msgId);
    try {
      await apiFetch(`/messages/${msgId}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      setConfirmDelete(null);
      await fetchConversations();
    } catch (e) { console.error("Erreur suppression:", e); }
    finally { setDeletingId(null); }
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
          <p className="text-[11px] text-emerald-200 font-medium"> UMMTO — Espace de réponse aux demandes</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[11px] bg-white/15 border border-white/20 px-3 py-1.5 rounded-full font-bold backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
          Admin connecté
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">

        {/* ── SIDEBAR ── */}
        <aside className="w-80 bg-white border-r border-slate-100 flex flex-col shrink-0 shadow-sm">

          {/* Search */}
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

          {/* Count */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
            <Users size={13} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {conversations.length} conversation{conversations.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* List */}
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
                <div className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  En ligne
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
                    const isAdmin = Number(msg.senderId) === Number(ADMIN_ID);
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
                              <img src={msg.image} alt="Attachement"
                                className="mt-2 rounded-xl max-w-full h-auto border border-slate-100"
                                onError={(e) => (e.target.style.display = "none")} />
                            )}
                            <span className={`text-[9px] mt-1 block font-medium ${isAdmin ? "text-emerald-200 text-right" : "text-slate-400"}`}>
                              {isAdmin ? "Vous (Admin)" : selectedUser.name} · {formatTime(msg.createdAt || msg.timestamp)}
                            </span>
                          </div>

                          {/* Supprimer */}
                          {msg.id && (
                            <div className={`mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isAdmin ? "justify-end" : "justify-start"}`}>
                              {isConfirming ? (
                                <>
                                  <span className="text-[10px] text-red-500 font-black">Supprimer ?</span>
                                  <button
                                    onClick={() => deleteMessage(msg.id)}
                                    disabled={isDeleting}
                                    className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black hover:bg-red-600 disabled:opacity-50 transition-colors"
                                  >
                                    {isDeleting ? "..." : "Oui"}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-black hover:bg-slate-300 transition-colors"
                                  >
                                    Non
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setConfirmDelete(msg.id)}
                                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500 transition-colors"
                                  title="Supprimer ce message"
                                >
                                  <Trash2 size={11} />
                                  <span className="font-bold">Supprimer</span>
                                </button>
                              )}
                            </div>
                          )}
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
                  disabled={!input.trim()}
                  className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-xl flex items-center justify-center hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 active:scale-95"
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