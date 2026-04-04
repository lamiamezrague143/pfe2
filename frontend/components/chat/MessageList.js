"use client";
import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function MessageList({ messages = [], currentUserId }) {
  const scrollRef = useRef(null);

  // 🔽 scroll auto (corrigé)
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
      
      {/* 📭 vide */}
      {(!messages || messages.length === 0) && (
        <div className="text-gray-400 text-center text-sm">
          Aucun message pour le moment
        </div>
      )}

      {/* 💬 messages */}
      {Array.isArray(messages) &&
        messages.map((msg, index) => (
          <MessageBubble
            key={
              msg.id
                ? `msg-${msg.id}`
                : `msg-${msg.senderId}-${msg.receiverId}-${index}`
            }
            msg={msg}
            isMine={Number(msg.senderId) === Number(currentUserId)}
          />
        ))}

      {/* 👇 scroll anchor */}
      <div ref={scrollRef} />
    </div>
  );
}