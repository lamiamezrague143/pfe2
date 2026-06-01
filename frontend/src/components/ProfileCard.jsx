"use client";
import React, { useState, useEffect } from "react";
import { apiFetch } from "../lib/api"; // ✅ adapte le chemin selon ta page

const ROLE_LABELS = {
  president:    { label: "Président",    color: "from-purple-600 to-indigo-600",  bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  agent:        { label: "Agent",        color: "from-emerald-600 to-teal-600",   bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  secretariat:  { label: "Secrétariat", color: "from-blue-600 to-cyan-600",      bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  beneficiaire: { label: "Bénéficiaire", color: "from-amber-500 to-orange-500",  bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },
  ingenieur: { label: "ingenieur", color: "from-amber-500 to-orange-500",  bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200" },};


export default function ProfileCard() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/users/me")
      .then((data) => { if (data) setUser(data); })
      .catch((err) => console.error("Erreur profil:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!user) return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center text-slate-400">
      <p>Impossible de charger le profil.</p>
    </div>
  );

  const role    = ROLE_LABELS[user.roleSystem] || ROLE_LABELS["beneficiaire"];
  const initiale = (user.nomComplet?.[0] || "U").toUpperCase();
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  const infos = [
    { label: "Nom",              value: user.nomComplet        || "—", icon: "👤" },
    { label: "Prénom",           value: user.prenomComplet     || "—", icon: "👤" },
    { label: "Email",            value: user.email             || "—", icon: "📧" },
    { label: "Fonction / Poste", value: user.positionAdministrative || "—", icon: "💼" },
    { label: "Date de naissance",value: formatDate(user.dateNaissance),  icon: "🎂" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

      {/* ── Bandeau header ── */}
      <div className={`bg-gradient-to-r ${role.color} px-6 sm:px-8 py-8 sm:py-10`}>
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full ring-4 ring-white/30 shadow-inner overflow-hidden bg-white/20 flex items-center justify-center">
              {user.photo ? (
                <img
                  src={user.photo}
                  alt={user.nomComplet}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ) : (
                <span className="text-white text-2xl sm:text-3xl font-black">{initiale}</span>
              )}
            </div>
            {/* Badge rôle */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white" />
          </div>

          {/* Nom + rôle */}
          <div>
            <h2 className="text-white font-black text-lg sm:text-2xl tracking-tight">
              {user.nomComplet} {user.prenomComplet}
            </h2>
            <span className={`inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${role.bg} ${role.text} border ${role.border}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              {role.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Informations ── */}
      <div className="px-6 sm:px-8 py-6">
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-5">
          Informations personnelles
        </p>

        <div className="space-y-0 divide-y divide-slate-50">
          {infos.map(({ label, value, icon }) => (
            <div key={label} className="flex items-center justify-between py-3.5 gap-4 group">
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-base">{icon}</span>
                <span className="text-sm text-slate-400 font-medium">{label}</span>
              </div>
              <span className="text-sm font-bold text-slate-700 text-right truncate max-w-[200px]">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-6 sm:px-8 pb-6 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>ID utilisateur : <strong className="text-slate-600">#{user.id}</strong></span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Connecté
          </span>
        </div>
      </div>
    </div>
  );
}