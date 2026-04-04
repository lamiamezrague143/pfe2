"use client";
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

const SOCKET_URL = "http://localhost:5001";

export default function ChatPanel({ user, selectedUser }) {
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  const currentUserId = user?.id;
  const receiverId = selectedUser?.id; // 🔥 IMPORTANT

  // 🔌 connexion socket
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
    });

    // 📩 recevoir message
    socketRef.current.on("receive_message", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // 📜 historique
    if (currentUserId && receiverId) {
      fetch(`${SOCKET_URL}/api/messages/${currentUserId}/${receiverId}`)
        .then((res) => res.json())
        .then((data) => setMessages(Array.isArray(data) ? data : []));
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [currentUserId, receiverId]);

  // 📤 envoyer message
const sendMessage = (content) => {
  if (!socketRef.current) return;

  // 🔥 sécurité
  if (typeof content !== "string") return;

  if (!content.trim()) return;

  const messageData = {
    senderId: currentUserId,
    receiverId: receiverId,
    content: content,
  };

  socketRef.current.emit("send_message", messageData);

 
};

  return (
    <div className="bg-white border rounded-lg shadow flex flex-col h-[600px]">
      {/* HEADER */}
      <div className="bg-green-700 text-white p-3 font-bold text-sm">
        Messagerie
      </div>

      {/* MESSAGES */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
      />

      {/* INPUT */}
      <MessageInput
        onSend={sendMessage}
        currentUserId={currentUserId}
      />
    </div>
  );
}