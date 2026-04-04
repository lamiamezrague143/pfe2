"use client";
import React from "react";
import { Paperclip, User } from "lucide-react";

export default function MessageBubble({ msg, isMine }) {
  const formatTime = (ts) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      {/* avatar */}
      {!isMine && (
        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center mr-2">
          <User size={13} className="text-green-700" />
        </div>
      )}

      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow ${
          isMine
            ? "bg-green-700 text-white rounded-tr-none"
            : "bg-white border text-gray-800 rounded-tl-none"
        }`}
      >
        {/* 📝 texte */}
        {msg.content && <p>{msg.content}</p>}

        {/* 📎 fichiers */}
        {msg.files?.map((file, i) => (
          <div key={file.url || i} className="mt-2">
            {file.type?.startsWith("image") ? (
              <img
                src={file.url}
                alt=""
                className="max-w-xs rounded"
              />
            ) : (
              <a
                href={file.url}
                target="_blank"
                className="flex items-center gap-1 text-blue-500 underline"
              >
                <Paperclip size={14} />
                Fichier
              </a>
            )}
          </div>
        ))}

        {/* ⏰ heure */}
        <span
          className={`text-[9px] mt-1 block ${
            isMine ? "text-green-200 text-right" : "text-gray-400"
          }`}
        >
          {isMine ? "Vous" : "Support"} ·{" "}
          {formatTime(msg.createdAt || msg.timestamp)}
        </span>
      </div>
    </div>
  );
}