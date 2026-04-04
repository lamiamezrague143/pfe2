"use client";
import React, { useState } from "react";
import { Send, Paperclip } from "lucide-react";

export default function MessageInput({ onSend, currentUserId }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);

  // 📎 ajouter fichiers
  const handleFiles = (e) => {
    setFiles(Array.from(e.target.files));
  };

  // 🚀 envoyer message
  const handleSend = () => {
    const message = String(text ?? "").trim();
    if (!message) return;
    onSend(message);
    setText("");
    setFiles([]);
  };

  // ⏎ entrer = envoyer
  const handleKey = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="border-t p-3 bg-white flex flex-col gap-2">
      {/* fichiers */}
      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap text-xs text-gray-500">
          {files.map((f, i) => (
            <span key={i} className="bg-gray-100 px-2 py-1 rounded">
              {f.name}
            </span>
          ))}
        </div>
      )}
      {/* input */}
      <div className="flex items-center gap-2">
        {/* upload */}
        <label className="cursor-pointer text-gray-500">
          <Paperclip size={18} />
          <input
            type="file"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
        </label>
        {/* texte */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value ?? "")}
          onKeyDown={handleKey}
          placeholder="Écrire un message..."
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        {/* envoyer */}
        <button
          onClick={handleSend}
          className="bg-green-700 text-white p-2 rounded-full hover:bg-green-800"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}