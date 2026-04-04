"use client";
import React from "react";
import { Clock, CheckCircle, XCircle } from "lucide-react";

export default function StatusBadge({ status }) {
  const styles = {
    "En attente": "bg-amber-100 text-amber-700 border-amber-300",
    "Validée": "bg-emerald-100 text-emerald-700 border-emerald-300",
    "Rejetée": "bg-red-100 text-red-700 border-red-300",
  };

  const icons = {
    "En attente": <Clock size={12} />,
    "Validée": <CheckCircle size={12} />,
    "Rejetée": <XCircle size={12} />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
        styles[status] || "bg-gray-100 text-gray-600 border-gray-200"
      }`}
    >
      {icons[status] || null}
      {status || "Inconnu"}
    </span>
  );
}