"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import {
  HomeIcon, ChartBarIcon, FolderIcon, BellIcon,
  CalendarIcon, PrinterIcon, ChevronDownIcon,
  ChevronUpIcon, XMarkIcon,
} from "@heroicons/react/24/outline";

const API_BASE = "http://localhost:5001/api";

// ─── MenuItem ────────────────────────────────────────────────────────────────
const MenuItem = ({ icon: Icon, label, href, active, badge }) => (
  <Link href={href}
    className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
      active
        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
        : "text-slate-600 hover:bg-slate-100"
    }`}
  >
    <Icon className={`w-5 h-5 transition-all ${active ? "text-white" : "text-slate-400 group-hover:text-emerald-600"}`} />
    <span className="flex-1">{label}</span>
    {badge && <span className={`text-xs px-2 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-emerald-100 text-emerald-600"}`}>{badge}</span>}
    {active && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
  </Link>
);

// ─── Config prestations ───────────────────────────────────────────────────────
const PRESTATIONS_CONFIG = [
  {
    key: "avenants_medicaux", titre: "Avenants Médicaux", color: "from-blue-600 to-indigo-600",
    colonnes: [
      { label: "N°", field: "index" }, { label: "Nom", field: "nom" }, { label: "Prénom", field: "prenom" },
      { label: "Fonction", field: "fonction" }, { label: "Date de dépôt", field: "date_depot" },
      { label: "Faculté", field: "faculte" }, { label: "Bénéficiaire", field: "beneficiaire_specifique" },
      { label: "Avis de la COS", field: "avis_cos_vide" },
    ],
    match: (d) => (d.type_prestation || "").toLowerCase().includes("avenant"),
  },
  {
    key: "retraites", titre: "Retraites", color: "from-violet-600 to-purple-600",
    colonnes: [
      { label: "N°", field: "index" }, { label: "Nom", field: "nom" }, { label: "Prénom", field: "prenom" },
      { label: "Fonction", field: "fonction" }, { label: "Date de dépôt", field: "date_depot" },
      { label: "Date de départ en retraite", field: "date_depart_retraite" },
      { label: "Faculté", field: "faculte" }, { label: "Avis de la COS", field: "avis_cos_vide" },
      { label: "Date de la COS", field: "date_cos" },
    ],
    match: (d) => (d.type_prestation || "").toLowerCase().includes("retraite"),
  },
  {
    key: "frais_funeraires", titre: "Frais Funéraires", color: "from-slate-700 to-slate-900",
    colonnes: [
      { label: "N°", field: "index" }, { label: "Nom", field: "nom" }, { label: "Prénom", field: "prenom" },
      { label: "Fonction", field: "fonction" }, { label: "Date de dépôt", field: "date_depot" },
      { label: "Faculté", field: "faculte" }, { label: "Le défunt", field: "nom_defunt" },
      { label: "Avis de la COS", field: "avis_cos_vide" },
    ],
    match: (d) => { const t = (d.type_prestation || "").toLowerCase(); return t.includes("funéraire") || t.includes("funeraire") || (t.includes("décès") && !t.includes("capitale")); },
  },
  {
    key: "naissances", titre: "Naissances", color: "from-pink-500 to-rose-500",
    colonnes: [
      { label: "N°", field: "index" }, { label: "Nom", field: "nom" }, { label: "Prénom", field: "prenom" },
      { label: "Fonction", field: "fonction" }, { label: "Date de dépôt", field: "date_depot" },
      { label: "Faculté", field: "faculte" }, { label: "Nom de l'enfant", field: "nom_enfant" },
      { label: "Avis de la COS", field: "avis_cos_vide" },
    ],
    match: (d) => (d.type_prestation || "").toLowerCase().includes("naissance"),
  },
  {
    key: "circoncisions", titre: "Circoncisions", color: "from-cyan-500 to-teal-500",
    colonnes: [
      { label: "N°", field: "index" }, { label: "Nom", field: "nom" }, { label: "Prénom", field: "prenom" },
      { label: "Fonction", field: "fonction" }, { label: "Date de dépôt", field: "date_depot" },
      { label: "Faculté", field: "faculte" }, { label: "Nom de l'enfant", field: "nom_enfant" },
      { label: "Avis de la COS", field: "avis_cos_vide" },
    ],
    match: (d) => (d.type_prestation || "").toLowerCase().includes("circoncision"),
  },
  {
    key: "soins_dentaires", titre: "Soins Dentaires", color: "from-emerald-500 to-green-600",
    colonnes: [
      { label: "N°", field: "index" }, { label: "Nom", field: "nom" }, { label: "Prénom", field: "prenom" },
      { label: "Fonction", field: "fonction" }, { label: "Date de dépôt", field: "date_depot" },
      { label: "Faculté", field: "faculte" }, { label: "Le bénéficiaire", field: "beneficiaire_specifique" },
      { label: "Avis de la COS", field: "avis_cos_vide" },
    ],
    match: (d) => (d.type_prestation || "").toLowerCase().includes("dentaire"),
  },
  {
    key: "mariages", titre: "Mariage", color: "from-amber-500 to-orange-500",
    colonnes: [
      { label: "N°", field: "index" }, { label: "Nom", field: "nom" }, { label: "Prénom", field: "prenom" },
      { label: "Fonction", field: "fonction" }, { label: "Date de dépôt", field: "date_depot" },
      { label: "Faculté", field: "faculte" }, { label: "Date de MARIAGE", field: "date_mariage" },
      { label: "Avis de la COS", field: "avis_cos_vide" },
    ],
    match: (d) => (d.type_prestation || "").toLowerCase().includes("mariage"),
  },
  {
    key: "lunetteries", titre: "Lunetteries", color: "from-sky-500 to-blue-500",
    colonnes: [
      { label: "N°", field: "index" }, { label: "Nom", field: "nom" }, { label: "Prénom", field: "prenom" },
      { label: "Fonction", field: "fonction" }, { label: "Date de dépôt", field: "date_depot" },
      { label: "Faculté", field: "faculte" }, { label: "L'intéressé", field: "beneficiaire_specifique" },
      { label: "Avis de la COS", field: "avis_cos_vide" },
    ],
    match: (d) => { const t = (d.type_prestation || "").toLowerCase(); return t.includes("lunetterie") || t.includes("ophtalmologie"); },
  },
  {
    key: "capitales_deces", titre: "Capitales de Décès", color: "from-gray-600 to-zinc-700",
    colonnes: [
      { label: "N°", field: "index" }, { label: "Nom", field: "nom" }, { label: "Prénom", field: "prenom" },
      { label: "Fonction", field: "fonction" }, { label: "Date de dépôt", field: "date_depot" },
      { label: "Faculté", field: "faculte" }, { label: "Le défunt", field: "nom_defunt" },
      { label: "Avis de la COS", field: "avis_cos_vide" },
    ],
    match: (d) => { const t = (d.type_prestation || "").toLowerCase(); return t.includes("capitale") && (t.includes("décès") || t.includes("deces")); },
  },
  {
    key: "aide_cancereux", titre: "Aide aux Cancéreux", color: "from-red-600 to-rose-600",
    colonnes: [
      { label: "N°", field: "index" }, { label: "Nom", field: "nom" }, { label: "Prénom", field: "prenom" },
      { label: "Fonction", field: "fonction" }, { label: "Date de dépôt", field: "date_depot" },
      { label: "Faculté", field: "faculte" }, { label: "Le malade", field: "beneficiaire_specifique" },
      { label: "Avis de la COS", field: "avis_cos_vide" },
    ],
    match: (d) => { const t = (d.type_prestation || "").toLowerCase(); return t.includes("cancer") || t.includes("malade"); },
  },
  {
    key: "prets", titre: "Prêts", color: "from-fuchsia-500 to-pink-600",
    colonnes: [
      { label: "N°", field: "index" }, { label: "Nom", field: "nom" }, { label: "Prénom", field: "prenom" },
      { label: "Fonction", field: "fonction" }, { label: "Date de dépôt", field: "date_depot" },
      { label: "Faculté", field: "faculte" }, { label: "Avis de la COS", field: "avis_cos_vide" },
    ],
    match: (d) => { const t = (d.type_prestation || "").toLowerCase(); return t.includes("pret") || t.includes("prêt") || t.includes("retrab"); },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isATS = (d) => { const f = (d.fonction || "").toLowerCase(); return f === "ats" || f === "retraité" || f === "retraite"; };
const isENS = (d) => { const f = (d.fonction || "").toLowerCase(); return f === "enseignant" || f === "ens" || f === "enseignant(e)"; };

function getFieldValue(dossier, field, index) {
  if (field === "index") return index;
  if (field === "nom") return (dossier.nom_beneficiaire || "").split(" ")[0] || "—";
  if (field === "prenom") { const p = (dossier.nom_beneficiaire || "").split(" "); return p.slice(1).join(" ") || "—"; }
  if (field === "date_depot") return dossier.createdAt ? new Date(dossier.createdAt).toLocaleDateString("fr-FR") : "—";
  if (field === "beneficiaire_specifique") return dossier.nom_beneficiaire || "Bénéficiaire principal";
  if (field === "date_cos") return dossier.date_cos ? new Date(dossier.date_cos).toLocaleDateString("fr-FR") : "—";
  if (field === "avis_cos_vide") return "__VIDE__";
  return dossier[field] || "—";
}

function applyDateFilter(dossiers, dateDebut, dateFin) {
  return dossiers.filter((d) => {
    if (!d.createdAt) return true;
    const s = new Date(d.createdAt).toISOString().split("T")[0];
    if (dateDebut && s < dateDebut) return false;
    if (dateFin && s > dateFin) return false;
    return true;
  });
}

// ─── Impression ciblée dans une fenêtre popup ─────────────────────────────────
function printTable({ titre, colonnes, lignes, categorie, dateDebut, dateFin }) {
  const date = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const periode = dateDebut || dateFin ? `Période : ${dateDebut || "…"} au ${dateFin || "…"}` : "";

  const thead = colonnes.map(c => `<th>${c.label}</th>`).join("");
  const tbody = lignes.map((d, i) => {
    const cells = colonnes.map(col => {
      const v = getFieldValue(d, col.field, i + 1);
      if (col.field === "avis_cos_vide") return `<td><span class="blank"></span></td>`;
      if (col.field === "fonction") {
        const fl = (d.fonction || "").toLowerCase();
        const cls = fl === "ats" || fl === "retraité" || fl === "retraite" ? "badge-ats"
          : fl === "enseignant" || fl === "ens" ? "badge-ens" : "badge-other";
        return `<td><span class="badge ${cls}">${d.fonction || "—"}</span></td>`;
      }
      if (col.field === "faculte") return `<td><span class="fac">${v}</span></td>`;
      return `<td>${v}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
  <title>${titre} – ${categorie}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',sans-serif;background:#fff;padding:24px;color:#1e293b}
    .header{border-bottom:3px solid #059669;padding-bottom:16px;margin-bottom:20px;text-align:center}
    .header h1{font-size:13px;font-weight:900;text-transform:uppercase;color:#1e293b}
    .header h2{font-size:12px;font-weight:700;color:#334155;margin-top:2px}
    .header h3{font-size:11px;font-weight:700;color:#475569;margin-top:2px}
    .meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px}
    .meta-title{font-size:15px;font-weight:900;color:#059669;text-transform:uppercase;letter-spacing:0.05em}
    .meta-cat{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;border:1px solid}
    .cat-ats{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}
    .cat-ens{background:#fff7ed;color:#c2410c;border-color:#fed7aa}
    .meta-right{font-size:10px;color:#94a3b8}
    table{width:100%;border-collapse:collapse;font-size:11px}
    thead tr{background:#f1f5f9}
    th{padding:7px 10px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;border-bottom:2px solid #e2e8f0;white-space:nowrap}
    td{padding:6px 10px;border-bottom:1px solid #f1f5f9;color:#334155;vertical-align:middle}
    tr:hover{background:#f8fafc}
    .blank{display:inline-block;width:80px;height:16px;border:1px solid #cbd5e1;border-radius:3px}
    .badge{font-size:8px;font-weight:900;text-transform:uppercase;padding:2px 7px;border-radius:20px;border:1px solid}
    .badge-ats{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}
    .badge-ens{background:#fff7ed;color:#c2410c;border-color:#fed7aa}
    .badge-other{background:#f8fafc;color:#64748b;border-color:#e2e8f0}
    .fac{font-size:9px;font-weight:700;color:#059669}
    .count{font-size:10px;color:#64748b;margin-bottom:14px;font-weight:600}
    .footer{margin-top:24px;border-top:1px solid #e2e8f0;padding-top:10px;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
    @media print{body{padding:12px}.header{margin-bottom:14px}}
  </style></head><body>
  <div class="header">
    <h1>République Algérienne Démocratique et Populaire</h1>
    <h2>Ministère de l'Enseignement Supérieur et de la Recherche Scientifique</h2>
    <h2>Université Mouloud Mammeri de Tizi-Ouzou</h2>
    <h3>Structure de Gestion des Œuvres Sociales – SG/COS</h3>
  </div>
  <div class="meta">
    <div>
      <div class="meta-title">${titre}</div>
      ${periode ? `<div class="meta-right" style="margin-top:4px">${periode}</div>` : ""}
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <span class="meta-cat ${categorie === "ATS" ? "cat-ats" : "cat-ens"}">${categorie}</span>
      <span class="meta-right">${date}</span>
    </div>
  </div>
  <div class="count">${lignes.length} dossier${lignes.length !== 1 ? "s" : ""}</div>
  <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
  <div class="footer">
    <span>SG/COS – UMMTO © 2026</span>
    <span>Document officiel</span>
  </div>
  <script>window.onload=()=>{window.print()}</script>
  </body></html>`;

  const w = window.open("", "_blank", "width=900,height=700");
  w.document.write(html);
  w.document.close();
}

// ─── CelluleRendu ─────────────────────────────────────────────────────────────
const CelluleRendu = ({ col, dossier, idx }) => {
  if (col.field === "avis_cos_vide") return <td className="px-4 py-3"><span className="inline-block w-24 h-5 border border-slate-200 rounded bg-white" /></td>;
  if (col.field === "index") return <td className="px-4 py-3"><span className="text-[11px] font-black text-slate-300">{idx}</span></td>;
  if (col.field === "nom") return <td className="px-4 py-3"><span className="font-bold text-slate-800">{getFieldValue(dossier, "nom")}</span></td>;
  if (col.field === "fonction") {
    const fn = dossier.fonction || "—"; const fl = fn.toLowerCase();
    const style = fl === "ats" || fl === "retraité" || fl === "retraite" ? "bg-blue-50 text-blue-600 border-blue-100"
      : fl === "enseignant" || fl === "ens" || fl === "enseignant(e)" ? "bg-orange-50 text-orange-600 border-orange-100"
      : "bg-slate-50 text-slate-500 border-slate-100";
    return <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${style}`}>{fn}</span></td>;
  }
  if (col.field === "faculte") return <td className="px-4 py-3"><span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-lg text-[10px] font-bold max-w-[130px] truncate">{getFieldValue(dossier, "faculte")}</span></td>;
  return <td className="px-4 py-3"><span className="text-slate-600 text-xs font-medium">{getFieldValue(dossier, col.field)}</span></td>;
};

// ─── MiniTableau (ATS ou ENS) avec bouton imprimer ───────────────────────────
const MiniTableau = ({ config, lignes, label, categorie, accentColor, borderColor, headerBg, dateDebut, dateFin }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`border-t-2 ${borderColor}`}>
      {/* Barre catégorie */}
      <div className={`px-6 py-2.5 ${headerBg} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-black uppercase tracking-widest ${accentColor}`}>{label}</span>
          <span className="text-[10px] text-slate-400 font-semibold">— {lignes.length} dossier{lignes.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Bouton imprimer cette catégorie */}
          {lignes.length > 0 && (
            <button
              onClick={() => printTable({ titre: config.titre, colonnes: config.colonnes, lignes, categorie, dateDebut, dateFin })}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold border transition-all
                ${categorie === "ATS"
                  ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white"
                  : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-500 hover:text-white"
                }`}
            >
              <PrinterIcon className="w-3 h-3" />
              Imprimer {categorie}
            </button>
          )}
          <button onClick={() => setCollapsed(v => !v)} className="p-1 text-slate-400 hover:text-slate-600">
            {collapsed ? <ChevronDownIcon className="w-3.5 h-3.5" /> : <ChevronUpIcon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        lignes.length === 0 ? (
          <p className="px-6 py-4 text-slate-300 text-xs italic">Aucun dossier dans cette catégorie</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100">
                <tr>
                  {config.colonnes.map(col => (
                    <th key={col.field} className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap bg-white">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lignes.map((d, idx) => (
                  <tr key={d.id || idx} className="hover:bg-slate-50/40 transition-colors">
                    {config.colonnes.map(col => (
                      <CelluleRendu key={col.field} col={col} dossier={d} idx={idx + 1} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

// ─── BlocPrestation ───────────────────────────────────────────────────────────
const BlocPrestation = ({ config, dossiers, dateDebut, dateFin, visible }) => {
  const [collapsed, setCollapsed] = useState(false);

  const filtered = applyDateFilter(dossiers.filter(config.match), dateDebut, dateFin);
  const ats    = filtered.filter(isATS);
  const ens    = filtered.filter(isENS);
  const autres = filtered.filter(d => !isATS(d) && !isENS(d));
  const total  = filtered.length;

  if (!visible) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
      {/* En-tête prestation */}
      <div className={`bg-gradient-to-r ${config.color} px-6 py-4 flex items-center justify-between`}>
        <button className="flex items-center gap-3 flex-1 text-left" onClick={() => setCollapsed(v => !v)}>
          <h2 className="text-white font-black text-base tracking-tight">{config.titre}</h2>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/30">
              {total} dossier{total !== 1 ? "s" : ""}
            </span>
            {ats.length > 0 && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">ATS {ats.length}</span>}
            {ens.length > 0 && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">ENS {ens.length}</span>}
          </div>
        </button>

        {/* Boutons impression depuis l'en-tête */}
        <div className="flex items-center gap-2 ml-4">
          {ats.length > 0 && (
            <button
              onClick={() => printTable({ titre: config.titre, colonnes: config.colonnes, lignes: ats, categorie: "ATS", dateDebut, dateFin })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl text-[10px] font-bold transition-all"
            >
              <PrinterIcon className="w-3.5 h-3.5" /> ATS
            </button>
          )}
          {ens.length > 0 && (
            <button
              onClick={() => printTable({ titre: config.titre, colonnes: config.colonnes, lignes: ens, categorie: "ENS", dateDebut, dateFin })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl text-[10px] font-bold transition-all"
            >
              <PrinterIcon className="w-3.5 h-3.5" /> ENS
            </button>
          )}
          {autres.length > 0 && (
            <button
              onClick={() => printTable({ titre: config.titre, colonnes: config.colonnes, lignes: autres, categorie: "Autres", dateDebut, dateFin })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl text-[10px] font-bold transition-all"
            >
              <PrinterIcon className="w-3.5 h-3.5" /> Autres
            </button>
          )}
          <button onClick={() => setCollapsed(v => !v)} className="text-white p-1">
            {collapsed ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        total === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">Aucun dossier{(dateDebut || dateFin) && <span className="block text-xs mt-1 text-slate-300">sur la période sélectionnée</span>}</div>
        ) : (
          <>
            <MiniTableau config={config} lignes={ats}    label="ATS"                  categorie="ATS"    accentColor="text-blue-600"   borderColor="border-blue-200"   headerBg="bg-blue-50/60"   dateDebut={dateDebut} dateFin={dateFin} />
            <MiniTableau config={config} lignes={ens}    label="Enseignants"           categorie="ENS"    accentColor="text-orange-600" borderColor="border-orange-200" headerBg="bg-orange-50/60" dateDebut={dateDebut} dateFin={dateFin} />
            {autres.length > 0 && (
              <MiniTableau config={config} lignes={autres} label="Autres / Non précisé" categorie="Autres" accentColor="text-slate-500"  borderColor="border-slate-200"  headerBg="bg-slate-50"     dateDebut={dateDebut} dateFin={dateFin} />
            )}
          </>
        )
      )}
    </div>
  );
};

// ─── Modal choix impression ───────────────────────────────────────────────────
const ModalImpression = ({ dossiers, dateDebut, dateFin, onClose }) => {
  // prestationsSelections : { [key]: { ats: bool, ens: bool, autres: bool } }
  const [sel, setSel] = useState(() => {
    const init = {};
    PRESTATIONS_CONFIG.forEach(c => { init[c.key] = { ats: false, ens: false, autres: false }; });
    return init;
  });

  const toggle = (key, cat) => setSel(prev => ({ ...prev, [key]: { ...prev[key], [cat]: !prev[key][cat] } }));

  const toggleAll = (cat, val) => {
    setSel(prev => {
      const next = { ...prev };
      PRESTATIONS_CONFIG.forEach(c => { next[c.key] = { ...next[c.key], [cat]: val }; });
      return next;
    });
  };

  const handlePrint = () => {
    PRESTATIONS_CONFIG.forEach(config => {
      const filtered = applyDateFilter(dossiers.filter(config.match), dateDebut, dateFin);
      const ats    = filtered.filter(isATS);
      const ens    = filtered.filter(isENS);
      const autres = filtered.filter(d => !isATS(d) && !isENS(d));
      if (sel[config.key].ats    && ats.length    > 0) printTable({ titre: config.titre, colonnes: config.colonnes, lignes: ats,    categorie: "ATS",    dateDebut, dateFin });
      if (sel[config.key].ens    && ens.length    > 0) printTable({ titre: config.titre, colonnes: config.colonnes, lignes: ens,    categorie: "ENS",    dateDebut, dateFin });
      if (sel[config.key].autres && autres.length > 0) printTable({ titre: config.titre, colonnes: config.colonnes, lignes: autres, categorie: "Autres", dateDebut, dateFin });
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-100">

        {/* Header modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <PrinterIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-black text-white text-sm">Choisir quoi imprimer</h3>
              <p className="text-[10px] text-slate-400">Sélectionnez les prestations et catégories</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Raccourcis globaux */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider self-center mr-1">Tout sélectionner :</span>
          <button onClick={() => toggleAll("ats", true)}    className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all">✓ Tous ATS</button>
          <button onClick={() => toggleAll("ens", true)}    className="px-3 py-1 bg-orange-50 text-orange-600 border border-orange-200 rounded-full text-[10px] font-bold hover:bg-orange-500 hover:text-white transition-all">✓ Tous ENS</button>
          <button onClick={() => toggleAll("autres", true)} className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold hover:bg-slate-600 hover:text-white transition-all">✓ Tous Autres</button>
          <button onClick={() => { toggleAll("ats", false); toggleAll("ens", false); toggleAll("autres", false); }}
            className="px-3 py-1 bg-red-50 text-red-500 border border-red-200 rounded-full text-[10px] font-bold hover:bg-red-500 hover:text-white transition-all ml-auto">
            ✕ Tout effacer
          </button>
        </div>

        {/* Liste prestations */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {PRESTATIONS_CONFIG.map(config => {
            const filtered = applyDateFilter(dossiers.filter(config.match), dateDebut, dateFin);
            const counts = { ats: filtered.filter(isATS).length, ens: filtered.filter(isENS).length, autres: filtered.filter(d => !isATS(d) && !isENS(d)).length };

            return (
              <div key={config.key} className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-xs font-black uppercase tracking-tight bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
                    {config.titre}
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium">{filtered.length} dossiers</span>
                </div>
                <div className="flex gap-3">
                  {(["ats", "ens", "autres"] ).map(cat => {
                    const count = counts[cat];
                    const labels = { ats: "ATS", ens: "ENS", autres: "Autres" };
                    const styles = {
                      ats:    { on: "bg-blue-600 text-white border-blue-600",    off: "bg-white text-blue-600 border-blue-200 hover:bg-blue-50" },
                      ens:    { on: "bg-orange-500 text-white border-orange-500", off: "bg-white text-orange-600 border-orange-200 hover:bg-orange-50" },
                      autres: { on: "bg-slate-600 text-white border-slate-600",   off: "bg-white text-slate-500 border-slate-200 hover:bg-slate-50" },
                    };
                    return (
                      <button
                        key={cat}
                        disabled={count === 0}
                        onClick={() => toggle(config.key, cat)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all disabled:opacity-30 disabled:cursor-not-allowed
                          ${sel[config.key][cat] ? styles[cat].on : styles[cat].off}`}
                      >
                        {sel[config.key][cat] ? "✓" : "○"} {labels[cat]}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${sel[config.key][cat] ? "bg-white/25" : "bg-slate-100"}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer modal */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <p className="text-[10px] text-slate-400">
            {Object.values(sel).reduce((acc, v) => acc + (v.ats ? 1 : 0) + (v.ens ? 1 : 0) + (v.autres ? 1 : 0), 0)} liste(s) sélectionnée(s)
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">Annuler</button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl text-xs font-bold hover:from-slate-800 hover:to-slate-900 transition-all shadow-lg">
              <PrinterIcon className="w-4 h-4" /> Imprimer la sélection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────
export default function RegistreParPrestation() {
  const [dossiers,       setDossiers]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [dateDebut,      setDateDebut]      = useState("");
  const [dateFin,        setDateFin]        = useState("");
  const [showModal,      setShowModal]      = useState(false);
  // Filtres visibilité prestations
  const [visibleKeys,    setVisibleKeys]    = useState(() => new Set(PRESTATIONS_CONFIG.map(c => c.key)));

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/dossiers/liste-generale`, { headers: { Authorization: `Bearer ${token}` } });
      setDossiers(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const totalFiltre = applyDateFilter(dossiers, dateDebut, dateFin).length;
  const hasDateFilter = dateDebut || dateFin;

  const toggleVisible = (key) => setVisibleKeys(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  return (
    <div style={{ background: "linear-gradient(135deg,#f5f7fa 0%,#f8f9fc 100%)" }}>

      {showModal && <ModalImpression dossiers={dossiers} dateDebut={dateDebut} dateFin={dateFin} onClose={() => setShowModal(false)} />}


      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">
    

        <div className="flex-1 px-8 py-8">
          {/* HEADER */}
          <header className="relative mb-6 overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-100">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-transparent" />
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500 rounded-full blur-[100px] opacity-10" />
            <div className="relative z-10 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-[0.2em] mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Registre par Prestation
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Listes par <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Prestation</span>
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  Séparé ATS / Enseignants — {dossiers.length} dossiers total
                  {hasDateFilter && <span className="text-emerald-600 font-bold ml-1">({totalFiltre} dans la période)</span>}
                </p>
              </div>
              {/* Bouton impression globale avec modal */}
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl text-sm font-bold hover:from-slate-800 hover:to-slate-900 transition-all shadow-lg"
              >
                <PrinterIcon className="w-4 h-4" /> Choisir & Imprimer
              </button>
            </div>
          </header>

          {/* FILTRE DATE */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CalendarIcon className="w-3.5 h-3.5" /> Filtrer par période de dépôt
            </p>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Du</label>
                <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Au</label>
                <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition" />
              </div>
              {hasDateFilter && (
                <>
                  <button onClick={() => { setDateDebut(""); setDateFin(""); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all">
                    <XMarkIcon className="w-3.5 h-3.5" /> Réinitialiser
                  </button>
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-emerald-700">{totalFiltre} dossier{totalFiltre !== 1 ? "s" : ""} dans cette période</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* BLOCS */}
          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-400">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                <span className="text-sm font-medium">Chargement des dossiers...</span>
              </div>
            </div>
          ) : (
            PRESTATIONS_CONFIG.map(config => (
              <BlocPrestation
                key={config.key}
                config={config}
                dossiers={dossiers}
                dateDebut={dateDebut}
                dateFin={dateFin}
                visible={visibleKeys.has(config.key)}
              />
            ))
          )}
        </div>

        <footer className="mt-auto border-t border-slate-100 py-6 bg-white">
          <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-[10px] tracking-widest uppercase font-medium">© 2026 SG/COS-UMMTO • Université Mouloud Mammeri Tizi-Ouzou</p>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <div className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}