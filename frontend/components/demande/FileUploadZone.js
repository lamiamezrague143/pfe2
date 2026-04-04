"use client";
import React, { useRef } from "react";
import { Upload, X } from "lucide-react";

export default function FileUploadZone({ files, onChange }) {
  const inputRef = useRef(null);

  // 📥 ajout fichiers
  const handleFiles = (newFiles) => {
    const merged = [...files, ...Array.from(newFiles)];
    onChange(merged);
  };

  // 🖱️ click
  const handleClick = () => {
    inputRef.current?.click();
  };

  // 📂 input
  const handleInput = (e) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  // 🖐️ drag & drop
  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => e.preventDefault();

  // ❌ supprimer fichier
  const removeFile = (index) => {
    onChange(files.filter((_, i) => i !== index));
  };

  // 🎨 helpers
  const getIcon = (file) => {
    if (file.type.startsWith("image")) return "🖼️";
    if (file.type === "application/pdf") return "📄";
    return "📎";
  };

  const formatSize = (size) => {
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
    return (size / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-3">
      {/* ZONE */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-600 hover:bg-green-50 transition"
      >
        <Upload className="mx-auto text-gray-400 mb-2" size={24} />
        <p className="text-sm text-gray-500">
          Glissez vos fichiers ici ou{" "}
          <span className="text-green-700 font-semibold underline">
            cliquez pour ajouter
          </span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          PDF, JPG, PNG, DOC
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleInput}
          className="hidden"
        />
      </div>

      {/* LISTE */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 border rounded-lg p-2 bg-gray-50"
            >
              <span>{getIcon(file)}</span>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">
                  {file.name}
                </p>
                <p className="text-[10px] text-gray-400">
                  {formatSize(file.size)}
                </p>
              </div>

              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-600"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          <p className="text-[11px] text-gray-400 text-right">
            {files.length} fichier{files.length > 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}