"use client";
import ProtectedRoutes from "../../../components/ProtectedRoutes";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import {
  HomeIcon,
  ChartBarIcon,
  FolderIcon,
  BellIcon,
  CalendarIcon,
  PrinterIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const API_BASE = "http://localhost:5001/api";

// ─── Sidebar ────────────────────────────────────────────────────────────────
const MenuItem = ({ icon: Icon, label, href, active, badge }) => (
  <Link
    href={href}
    className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
      active
        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
        : "text-slate-600 hover:bg-slate-100"
    }`}
  >
    <Icon className={`w-5 h-5 transition-all ${active ? "text-white" : "text-slate-400 group-hover:text-emerald-600"}`} />
    <span className="flex-1">{label}</span>
    {badge && (
      <span className={`text-xs px-2 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-emerald-100 text-emerald-600"}`}>
        {badge}
      </span>
    )}
    {active && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
  </Link>
);

// ─── En-tête impression ──────────────────────────────────────────────────────
const PrintHeader = ({ dateDebut, dateFin }) => (
  <div className="hidden print:block text-center mb-6">
    <div className="border-b-4 border-emerald-800 pb-4">
      <h1 className="text-xl font-bold uppercase text-slate-800">République Algérienne Démocratique et Populaire</h1>
      <h2 className="text-lg font-bold text-slate-700">Ministère de l'Enseignement Supérieur et de la Recherche Scientifique</h2>
      <h3 className="text-lg font-bold text-slate-700">Université Mouloud Mammeri de Tizi-Ouzou</h3>
      <h4 className="text-md font-bold text-slate-600">Structure de Gestion des Œuvres Sociales</h4>
      <div className="mt-3">
        <p className="text-sm font-semibold text-slate-500">Service de Gestion des Œuvres Sociales (SG/COS)</p>
        <p className="text-xs text-slate-400">
          Registre des Dossiers par Prestation
          {(dateDebut || dateFin) && <> — Période : {dateDebut || "…"} au {dateFin || "…"}</>}
        </p>
      </div>
    </div>
  </div>
);

// ─── Config prestations ───────────────────────────────────────────────────────
// Toutes ont : N°, Nom, Prénom, Fonction, Date de dépôt, Faculté, [spécifique], Avis de la COS (vide)
const PRESTATIONS_CONFIG = [
  {
    key: "avenants_medicaux",
    titre: "Avenants Médicaux",
    color: "from-blue-600 to-indigo-600",
    colonnes: [
      { label: "N°",             field: "index" },
      { label: "Nom",            field: "nom" },
      { label: "Prénom",         field: "prenom" },
      { label: "Fonction",       field: "fonction" },
      { label: "Date de dépôt",  field: "date_depot" },
      { label: "Faculté",        field: "faculte" },
      { label: "Bénéficiaire",   field: "beneficiaire_specifique" },
      { label: "Avis de la COS", field: "avis_cos_vide" },
    ],
    match: (d) => (d.type_prestation || "").toLowerCase().includes("avenant"),
  },
  {
    key: "retraites",
    titre: "Retraites",
    color: "from-violet-600 to-purple-600",
    colonnes: [
      { label: "N°",                        field: "index" },
      { label: "Nom",                        field: "nom" },
      { label: "Prénom",                     field: "prenom" },
      { label: "Fonction",                   field: "fonction" },
      { label: "Date de dépôt",              field: "date_depot" },
      { label: "Date de départ en retraite", field: "date_depart_retraite" },
      { label: "Faculté",                    field: "faculte" },
      { label: "Avis de la COS",             field: "avis_cos_vide" },
      { label: "Date de la COS",             field: "date_cos" },
    ],
    match: (d) => (d.type_prestation || "").toLowerCase().includes("retraite"),
  },
  {
    key: "frais_funeraires",
    titre: "Frais Funéraires",
    color: "from-slate-700 to-slate-900",
    colonnes: [
      { label: "N°",             field: "index" },
      { label: "Nom",            field: "nom" },
      { label: "Prénom",         field: "prenom" },
      { label: "Fonction",       field: "fonction" },
      { label: "Date de dépôt",  field: "date_depot" },
      { label: "Faculté",        field: "faculte" },
      { label: "Le défunt",      field: "nom_defunt" },
      { label: "Avis de la COS", field: "avis_cos_vide" },
    ],
    match: (d) => {
      const t = (d.type_prestation || "").toLowerCase();
      return t.includes("funéraire") || t.includes("funeraire") || (t.includes("décès") && !t.includes("capitale"));
    },
  },
  {
    key: "naissances",
    titre: "Naissances",
    color: "from-pink-500 to-rose-500",
    colonnes: [
      { label: "N°",              field: "index" },
      { label: "Nom",             field: "nom" },
      { label: "Prénom",          field: "prenom" },
      { label: "Fonction",        field: "fonction" },
      { label: "Date de dépôt",   field: "date_depot" },
      { label: "Faculté",         field: "faculte" },
      { label: "Nom de l'enfant", field: "nom_enfant" },
      { label: "Avis de la COS",  field: "avis_cos_vide" },
    ],
    match: (d) => (d.type_prestation || "").toLowerCase().includes("naissance"),
  },
  {
    key: "circoncisions",
    titre: "Circoncisions",
    color: "from-cyan-500 to-teal-500",
    colonnes: [
      { label: "N°",              field: "index" },
      { label: "Nom",             field: "nom" },
      { label: "Prénom",          field: "prenom" },
      { label: "Fonction",        field: "fonction" },
      { label: "Date de dépôt",   field: "date_depot" },
      { label: "Faculté",         field: "faculte" },
      { label: "Nom de l'enfant", field: "nom_enfant" },
      { label: "Avis de la COS",  field: "avis_cos_vide" },
    ],
    match: (d) => (d.type_prestation || "").toLowerCase().includes("circoncision"),
  },
  {
    key: "soins_dentaires",
    titre: "Soins Dentaires",
    color: "from-emerald-500 to-green-600",
    colonnes: [
      { label: "N°",              field: "index" },
      { label: "Nom",             field: "nom" },
      { label: "Prénom",          field: "prenom" },
      { label: "Fonction",        field: "fonction" },
      { label: "Date de dépôt",   field: "date_depot" },
      { label: "Faculté",         field: "faculte" },
      { label: "Le bénéficiaire", field: "beneficiaire_specifique" },
      { label: "Avis de la COS",  field: "avis_cos_vide" },
    ],
    match: (d) => (d.type_prestation || "").toLowerCase().includes("dentaire"),
  },
  {
    key: "mariages",
    titre: "Mariage",
    color: "from-amber-500 to-orange-500",
    colonnes: [
      { label: "N°",              field: "index" },
      { label: "Nom",             field: "nom" },
      { label: "Prénom",          field: "prenom" },
      { label: "Fonction",        field: "fonction" },
      { label: "Date de dépôt",   field: "date_depot" },
      { label: "Faculté",         field: "faculte" },
      { label: "Date de MARIAGE", field: "date_mariage" },
      { label: "Avis de la COS",  field: "avis_cos_vide" },
    ],
    match: (d) => (d.type_prestation || "").toLowerCase().includes("mariage"),
  },
  {
    key: "lunetteries",
    titre: "Lunetteries",
    color: "from-sky-500 to-blue-500",
    colonnes: [
      { label: "N°",             field: "index" },
      { label: "Nom",            field: "nom" },
      { label: "Prénom",         field: "prenom" },
      { label: "Fonction",       field: "fonction" },
      { label: "Date de dépôt",  field: "date_depot" },
      { label: "Faculté",        field: "faculte" },
      { label: "L'intéressé",    field: "beneficiaire_specifique" },
      { label: "Avis de la COS", field: "avis_cos_vide" },
    ],
    match: (d) => {
      const t = (d.type_prestation || "").toLowerCase();
      return t.includes("lunetterie") || t.includes("ophtalmologie");
    },
  },
  {
    key: "capitales_deces",
    titre: "Capitales de Décès",
    color: "from-gray-600 to-zinc-700",
    colonnes: [
      { label: "N°",             field: "index" },
      { label: "Nom",            field: "nom" },
      { label: "Prénom",         field: "prenom" },
      { label: "Fonction",       field: "fonction" },
      { label: "Date de dépôt",  field: "date_depot" },
      { label: "Faculté",        field: "faculte" },
      { label: "Le défunt",      field: "nom_defunt" },
      { label: "Avis de la COS", field: "avis_cos_vide" },
    ],
    match: (d) => {
      const t = (d.type_prestation || "").toLowerCase();
      return t.includes("capitale") && (t.includes("décès") || t.includes("deces"));
    },
  },
  {
    key: "aide_cancereux",
    titre: "Aide aux Cancéreux",
    color: "from-red-600 to-rose-600",
    colonnes: [
      { label: "N°",             field: "index" },
      { label: "Nom",            field: "nom" },
      { label: "Prénom",         field: "prenom" },
      { label: "Fonction",       field: "fonction" },
      { label: "Date de dépôt",  field: "date_depot" },
      { label: "Faculté",        field: "faculte" },
      { label: "Le malade",      field: "beneficiaire_specifique" },
      { label: "Avis de la COS", field: "avis_cos_vide" },
    ],
    match: (d) => {
      const t = (d.type_prestation || "").toLowerCase();
      return t.includes("cancer") || t.includes("malade");
    },
  },
  {
    key: "prets",
    titre: "Prêts",
    color: "from-fuchsia-500 to-pink-600",
    colonnes: [
      { label: "N°",             field: "index" },
      { label: "Nom",            field: "nom" },
      { label: "Prénom",         field: "prenom" },
      { label: "Fonction",       field: "fonction" },
      { label: "Date de dépôt",  field: "date_depot" },
      { label: "Faculté",        field: "faculte" },
      { label: "Avis de la COS", field: "avis_cos_vide" },
    ],
    match: (d) => {
      const t = (d.type_prestation || "").toLowerCase();
      return t.includes("pret") || t.includes("prêt") || t.includes("retrab");
    },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isATS(d) {
  const f = (d.fonction || "").toLowerCase();
  return f === "ats" || f === "retraité" || f === "retraite";
}
function isENS(d) {
  const f = (d.fonction || "").toLowerCase();
  return f === "enseignant" || f === "ens" || f === "enseignant(e)";
}

function getFieldValue(dossier, field, index) {
  if (field === "index") return index;
  if (field === "nom") return (dossier.nom_beneficiaire || "").split(" ")[0] || "—";
  if (field === "prenom") {
    const parts = (dossier.nom_beneficiaire || "").split(" ");
    return parts.slice(1).join(" ") || "—";
  }
  if (field === "date_depot") return dossier.createdAt ? new Date(dossier.createdAt).toLocaleDateString("fr-FR") : "—";
  if (field === "beneficiaire_specifique") return dossier.nom_beneficiaire || "Bénéficiaire principal";
  if (field === "date_cos") return dossier.date_cos ? new Date(dossier.date_cos).toLocaleDateString("fr-FR") : "—";
  if (field === "avis_cos_vide") return "__VIDE__";
  return dossier[field] || "—";
}

function applyDateFilter(dossiers, dateDebut, dateFin) {
  return dossiers.filter((d) => {
    if (!d.createdAt) return true;
    const dateStr = new Date(d.createdAt).toISOString().split("T")[0];
    if (dateDebut && dateStr < dateDebut) return false;
    if (dateFin && dateStr > dateFin) return false;
    return true;
  });
}

// ─── Cellule rendu ────────────────────────────────────────────────────────────
const CelluleRendu = ({ col, dossier, idx }) => {
  const val = getFieldValue(dossier, col.field, idx);

  if (col.field === "avis_cos_vide") {
    return (
      <td className="px-4 py-3">
        <span className="inline-block w-28 h-5 border border-slate-200 rounded bg-white"></span>
      </td>
    );
  }
  if (col.field === "index") {
    return <td className="px-4 py-3"><span className="text-[11px] font-black text-slate-300">{val}</span></td>;
  }
  if (col.field === "nom") {
    return <td className="px-4 py-3"><span className="font-bold text-slate-800">{val}</span></td>;
  }
  if (col.field === "fonction") {
    const fn = dossier.fonction || "—";
    const fl = fn.toLowerCase();
    const style = fl === "ats" || fl === "retraité" || fl === "retraite"
      ? "bg-blue-50 text-blue-600 border-blue-100"
      : fl === "enseignant" || fl === "ens" || fl === "enseignant(e)"
      ? "bg-orange-50 text-orange-600 border-orange-100"
      : "bg-slate-50 text-slate-500 border-slate-100";
    return (
      <td className="px-4 py-3">
        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${style}`}>{fn}</span>
      </td>
    );
  }
  if (col.field === "faculte") {
    return (
      <td className="px-4 py-3">
        <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-lg text-[10px] font-bold max-w-[130px] truncate" title={val}>
          {val}
        </span>
      </td>
    );
  }
  return <td className="px-4 py-3"><span className="text-slate-600 text-xs font-medium">{val}</span></td>;
};

// ─── Sous-tableau (ATS ou ENS) ───────────────────────────────────────────────
const SousTableau = ({ config, lignes, label, accentColor, borderColor }) => (
  <div className={`border-t-2 ${borderColor}`}>
    <div className="px-6 py-2.5 bg-slate-50 flex items-center gap-3">
      <span className={`text-[10px] font-black uppercase tracking-widest ${accentColor}`}>{label}</span>
      <span className="text-[10px] text-slate-400 font-semibold">
        — {lignes.length} dossier{lignes.length !== 1 ? "s" : ""}
      </span>
    </div>
    {lignes.length === 0 ? (
      <p className="px-6 py-4 text-slate-300 text-xs italic">Aucun dossier dans cette catégorie</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100">
            <tr>
              {config.colonnes.map((col) => (
                <th key={col.field} className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap bg-white">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {lignes.map((d, idx) => (
              <tr key={d.id || idx} className="hover:bg-slate-50/40 transition-colors">
                {config.colonnes.map((col) => (
                  <CelluleRendu key={col.field} col={col} dossier={d} idx={idx + 1} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// ─── Bloc prestation complet ──────────────────────────────────────────────────
const BlocPrestation = ({ config, dossiers, dateDebut, dateFin }) => {
  const [collapsed, setCollapsed] = useState(false);

  const filtered = applyDateFilter(dossiers.filter(config.match), dateDebut, dateFin);
  const ats    = filtered.filter(isATS);
  const ens    = filtered.filter(isENS);
  const autres = filtered.filter((d) => !isATS(d) && !isENS(d));
  const total  = filtered.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6 print:mb-10 print:break-inside-avoid">
      {/* En-tête */}
      <div
        className={`bg-gradient-to-r ${config.color} px-6 py-4 flex items-center justify-between cursor-pointer print:cursor-default`}
        onClick={() => setCollapsed((v) => !v)}
      >
        <h2 className="text-white font-black text-base tracking-tight">{config.titre}</h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/30">
            {total} dossier{total !== 1 ? "s" : ""}
          </span>
          {ats.length > 0 && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              ATS {ats.length}
            </span>
          )}
          {ens.length > 0 && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              ENS {ens.length}
            </span>
          )}
          <span className="text-white print:hidden">
            {collapsed ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronUpIcon className="w-4 h-4" />}
          </span>
        </div>
      </div>

      {!collapsed && (
        total === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">
            Aucun dossier
            {(dateDebut || dateFin) && <span className="block text-xs mt-1 text-slate-300">sur la période sélectionnée</span>}
          </div>
        ) : (
          <>
            <SousTableau config={config} lignes={ats}    label="ATS"                  accentColor="text-blue-600"   borderColor="border-blue-200" />
            <SousTableau config={config} lignes={ens}    label="Enseignants"           accentColor="text-orange-600" borderColor="border-orange-200" />
            {autres.length > 0 && (
              <SousTableau config={config} lignes={autres} label="Autres / Non précisé" accentColor="text-slate-500"  borderColor="border-slate-200" />
            )}
          </>
        )
      )}
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────
export default function RegistreParPrestation() {
  const [dossiers, setDossiers]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin]     = useState("");

  const menuItems = [
    { icon: HomeIcon,     label: "Accueil",          href: "/" },
    { icon: ChartBarIcon, label: "Registre General",  href: "/secretariat/registreGeneral", badge: "12" },
    { icon: FolderIcon,   label: "Prestations",       href: "/secretariat" },
  ];

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/dossiers/liste-generale`);
      setDossiers(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const totalFiltre  = applyDateFilter(dossiers, dateDebut, dateFin).length;
  const hasDateFilter = dateDebut || dateFin;

  return (
    <div className="flex min-h-screen">
      <style jsx global>{`
        body { background: linear-gradient(135deg,#f5f7fa 0%,#f8f9fc 100%); }
        @media print {
          .print\\:hidden { display:none !important; }
          .print\\:block  { display:block !important; }
          body { background: white; }
        }
      `}</style>

      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-2xl shadow-slate-200 flex flex-col print:hidden" style={{ borderRight: "1px solid rgba(0,0,0,0.05)" }}>
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl blur-md opacity-60"></div>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">S</span>
            </div>
          </div>
          <div>
            <h2 className="font-black text-slate-800 text-sm tracking-tight">SG/COS</h2>
            <p className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">Gestion Intégrée</p>
          </div>
        </div>

        <div className="mx-4 mt-6 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-bold">SC</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">Secrétariat</p>
              <p className="text-[9px] text-slate-500">Gestionnaire COS</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5">
          {menuItems.map((item, idx) => (
            <MenuItem key={idx} icon={item.icon} label={item.label} href={item.href} active={item.active} badge={item.badge} />
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* NAVBAR */}
        <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-3 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Secrétariat</span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>{new Date().toLocaleDateString("fr-FR", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></div>
                <BellIcon className="w-5 h-5 text-slate-500" />
              </button>
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-700">Secrétariat COS</p>
                  <p className="text-[9px] text-slate-400">secretariat@sgcos.com</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">SC</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <PrintHeader
          dateDebut={dateDebut ? new Date(dateDebut).toLocaleDateString("fr-FR") : ""}
          dateFin={dateFin   ? new Date(dateFin).toLocaleDateString("fr-FR")   : ""}
        />

        {/* CONTENT */}
        <div className="flex-1 px-8 py-8">

          {/* HEADER */}
          <header className="relative mb-6 overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-100 print:hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-transparent"></div>
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500 rounded-full blur-[100px] opacity-10"></div>
            <div className="relative z-10 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-[0.2em] mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
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
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl text-sm font-bold hover:from-slate-800 hover:to-slate-900 transition-all"
              >
                <PrinterIcon className="w-4 h-4" /> Imprimer tout
              </button>
            </div>
          </header>

          {/* ── FILTRE DATE ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6 print:hidden">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CalendarIcon className="w-3.5 h-3.5" />
              Filtrer par période de dépôt
            </p>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Du</label>
                <input
                  type="date" value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Au</label>
                <input
                  type="date" value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>
              {hasDateFilter && (
                <>
                  <button
                    onClick={() => { setDateDebut(""); setDateFin(""); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" /> Réinitialiser
                  </button>
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-bold text-emerald-700">
                      {totalFiltre} dossier{totalFiltre !== 1 ? "s" : ""} dans cette période
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* BLOCS PAR PRESTATION */}
          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-400">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Chargement des dossiers...</span>
              </div>
            </div>
          ) : (
            PRESTATIONS_CONFIG.map((config) => (
              <BlocPrestation
                key={config.key}
                config={config}
                dossiers={dossiers}
                dateDebut={dateDebut}
                dateFin={dateFin}
              />
            ))
          )}
        </div>

        {/* FOOTER */}
        <footer className="mt-auto border-t border-slate-100 py-6 bg-white print:hidden">
          <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-[10px] tracking-widest uppercase font-medium">
              © 2026 SG/COS-UMMTO • Université Mouloud Mammeri Tizi-Ouzou
            </p>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}