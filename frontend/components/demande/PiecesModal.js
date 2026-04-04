"use client";
import React from "react";
import { X, Paperclip } from "lucide-react";

export default function PiecesModal({ pieces, onClose }) {
  if (!pieces || pieces.length === 0) return null;

  const isImage = (type) => type?.startsWith("image");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-sm text-gray-800">
            Documents ({pieces.length})
          </h3>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* LIST */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {pieces.map((p, i) => (
            <div
              key={i}
              className="border rounded-lg p-2 bg-gray-50"
            >
              {/* 🖼️ IMAGE */}
              {isImage(p.type) ? (
                <div>
                  <p className="text-[10px] text-gray-400 truncate mb-1">
                    {p.nom}
                  </p>
                  <img
                    src={p.data}
                    alt={p.nom}
                    className="w-full rounded max-h-48 object-cover"
                  />
                </div>
              ) : (
                /* 📄 FILE */
                <a
                  href={p.data}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Paperclip size={14} />
                  {p.nom || "Voir fichier"}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}