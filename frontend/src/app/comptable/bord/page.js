"use client";
import ProtectedRoutes from "../../../components/ProtectedRoutes";
import React, { useState, useEffect } from "react";
import { apiFetch } from "../../../lib/api";
import Link from "next/link";
import {
  HomeIcon,
  ChartBarIcon,
  FolderIcon,
  UsersIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArchiveBoxIcon,
  BellIcon,
  CalendarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Activity, Shield, TrendingUp, Eye, DollarSign, Search
} from 'lucide-react';
import { usePathname } from "next/navigation";

import LogoutButton from "../../../components/LogoutButton";

// Composant Menu Item moderne (identique à la page archives)
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

// PieChart component (garde le style mais adapté)
const PieChart = ({ title, data, colors }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-6 flex flex-col items-center flex-1 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center gap-2 mb-6 w-full">
        <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">{title}</h3>
      </div>
      <div className="relative w-48 h-48 mb-6">
        <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
          {total === 0 ? (
            <circle cx="0" cy="0" r="1" fill="#f1f5f9" />
          ) : (
            Object.entries(data).map(([label, value], idx) => {
              const percent = value / total;
              if (percent === 0) return null;
              const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
              cumulativePercent += percent;
              const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
              const largeArcFlag = percent > 0.5 ? 1 : 0;
              const pathData = [
                `M ${startX} ${startY}`,
                `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                `L 0 0`,
              ].join(' ');
              return (
                <path key={idx} d={pathData} fill={colors[idx % colors.length]}
                  className="hover:opacity-80 transition-opacity cursor-pointer">
                  <title>{label}: {value}</title>
                </path>
              );
            })
          )}
          <circle cx="0" cy="0" r="0.6" fill="white" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-800">{total}</span>
          <span className="text-[9px] uppercase text-slate-400 font-bold">Total</span>
        </div>
      </div>
      <div className="w-full grid grid-cols-1 gap-2 border-t border-slate-100 pt-4">
        {Object.entries(data).map(([label, value], idx) => (
          <div key={label} className="flex justify-between items-center text-[10px] font-bold group/item">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm shadow-sm transition-transform group-hover/item:scale-110" style={{ backgroundColor: colors[idx % colors.length] }}></div>
              <span className="uppercase text-slate-500 group-hover/item:text-slate-800 transition-colors">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">({value})</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-full text-emerald-600 font-black text-[9px]">
                {total > 0 ? ((value / total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// StatCard moderne inspirée de la page archives
const StatCard = ({ label, value, icon: Icon, trend }) => {
  const getIconColor = () => {
    if (label.includes("Prises") && !label.includes("Dent")) return "from-emerald-500 to-teal-600";
    if (label.includes("Dent")) return "from-cyan-500 to-teal-500";
    if (label.includes("Opht")) return "from-indigo-500 to-purple-600";
    if (label.includes("Annul")) return "from-red-500 to-rose-600";
    return "from-emerald-500 to-teal-600";
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl shadow-slate-100 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${getIconColor()} rounded-full blur-2xl opacity-0 group-hover:opacity-15 transition-opacity duration-500`}></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getIconColor()} flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[9px] font-black">{trend}</span>
            </div>
          )}
        </div>
        <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-800 mt-1">{value}</p>
      </div>
    </div>
  );
};

export default function TableauDeBord() {
  const [isCollapsed, setIsCollapsed] = useState(false);
const [history, setHistory] = useState([]);
const [dossiers, setDossiers] = useState([]);
  const [cliniques, setCliniques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [plafondGeneral, setPlafondGeneral] = useState(130000);
  const [plafondDentaire, setPlafondDentaire] = useState(50000);
  const [plafondOphta, setPlafondOphta] = useState(50000);
  const [filterDate, setFilterDate] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [profile, setProfile] = useState(null);
  const [clientsRegroupes, setClientsRegroupes] = useState({
    general: {},
    dentaire: {},
    ophtalmique: {}
  });
const pathname = usePathname();
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };
useEffect(() => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      console.log("Token payload:", payload); // ← regarde ce que ça affiche
      setProfile(payload);
    }
  } catch (e) {
    console.warn("Token invalide:", e);
  }
}, []);
 const fetchData = async () => {
  try {
    const settings = await apiFetch("/settings");
    if (settings) {
      if (settings.plafond_general) setPlafondGeneral(Number(settings.plafond_general));
      if (settings.plafond_dentaire) setPlafondDentaire(Number(settings.plafond_dentaire));
      if (settings.plafond_ophta) setPlafondOphta(Number(settings.plafond_ophta));
    }

    const allCliniques = await apiFetch("/clinics/all");
    if (allCliniques) setCliniques(allCliniques);

    const allData = await apiFetch("/prise-en-charge/all");
if (allData) setHistory(Array.isArray(allData) ? allData : []);

const allDos = await apiFetch("/dossiers/liste-generale");
if (allDos) {
  const safeAllDos = Array.isArray(allDos) ? allDos : [];
  const currentYear = new Date().getFullYear();
  setDossiers(
    safeAllDos.filter(d =>
      new Date(d.createdAt).getFullYear() === currentYear &&
      parseFloat(d.montant_avenant || 0) > 0
    )
  );
}
  } catch (err) {
    console.error("Erreur:", err);
    showToast("❌ Erreur de chargement des données");
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchData();
  }, []);

  // Traitement des données pour les regroupements
  useEffect(() => {
    if (history.length === 0) return;

    // Stats par prestations
    const statsPrestations = (Array.isArray(history) ? history : []).reduce((acc, curr) => {
      const status = (curr.status || "").toLowerCase().trim();
      if (status.includes("annul") || status.includes("cancel") || status.includes("refus")) return acc;
      const p = (curr.type_prestation || curr.prestation || "").toUpperCase().trim();
      if (!p) return acc;
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {});

    // Stats grades
    const statsGrades = (Array.isArray(history) ? history : []).reduce((acc, curr) => {
      const fonctionRaw = curr.pieces?.fonction || curr.fFonction || curr.fonction || "";
      const f = String(fonctionRaw).toUpperCase().trim();
      if (f.includes("ATS") || f.includes("ADMINISTRATIF") || f.includes("TECHNIQUE")) {
        acc["ATS"]++;
      } else if (f.includes("ENS") || f.includes("PROF") || f.includes("DOCTEUR") || f.includes("MAITRE") || f.includes("MCTA") || f.includes("MCA")) {
        acc["ENSEIGNANT"]++;
      } else if (f.includes("RETRAITE") || f.includes("RETR")) {
        acc["RETRAITE"]++;
      } 
      return acc;
    }, { "ATS": 0, "ENSEIGNANT": 0, "RETRAITE": 0 });

    // Avenants
    const avenantsByClient = dossiers.reduce((acc, d) => {
      const key = (d.nom_beneficiaire || "").toUpperCase().trim();
      if (!acc[key]) acc[key] = { parts: d.nom_beneficiaire || "", avenants: [] };
      acc[key].avenants.push({
        montant: parseFloat(d.montant_avenant || 0),
        prestation: d.type_prestation || "",
        category: (() => {
          const p = (d.type_prestation || "").toUpperCase();
          if (p.includes("DENT")) return "dentaire";
          if (p.includes("OPHTA") || p.includes("OEIL") || p.includes("LUNET") || p.includes("OPHTALMO")) return "ophtalmique";
          return "general";
        })(),
      });
      return acc;
    }, {});

    // Regroupement des clients
    const regroupes = { general: {}, dentaire: {}, ophtalmique: {} };
    
    history.forEach(curr => {
      const clientKey = `${curr.pNom || curr.fNom || ''} ${curr.pPrenom || curr.fPrenom || ''}`.toUpperCase().trim() || "INCONNU";
      const montant = parseFloat(curr.montantTotal || 0);
      const titrePrest = curr.type_prestation || curr.prestation || "Sans titre";
      const prestUpper = titrePrest.toUpperCase();

      let category = "general";
      if (prestUpper.includes("DENT")) {
        category = "dentaire";
      } else if (
        prestUpper.includes("OPHTA") || prestUpper.includes("OEIL") ||
        prestUpper.includes("LUNET") || prestUpper.includes("OPHTALMO")
      ) {
        category = "ophtalmique";
      }

      const target = regroupes[category];
      if (!target[clientKey]) {
        target[clientKey] = { nom: clientKey, prises: [], prisesAnnulees: [], avenants: [], totalConsomme: 0 };
      }

      const estAnnulee = curr.annule === true || curr.statut === 'Annulée';
      if (estAnnulee) {
        target[clientKey].prisesAnnulees.push({ montant, prestation: titrePrest, status: 'Annulée' });
      } else {
        target[clientKey].prises.push({ montant, prestation: titrePrest, status: 'Active' });
        target[clientKey].totalConsomme += montant;
      }
    });

    Object.entries(avenantsByClient).forEach(([clientKey, data]) => {
      data.avenants.forEach(av => {
        const cat = av.category;
        const target = regroupes[cat];
        if (!target[clientKey]) {
          target[clientKey] = { nom: clientKey, prises: [], prisesAnnulees: [], avenants: [], totalConsomme: 0 };
        }
        target[clientKey].avenants.push(av);
        target[clientKey].totalConsomme += av.montant;
      });
    });

    setClientsRegroupes(regroupes);
  }, [history, dossiers]);

  // Stats pour les graphiques
  const statsPrestations = history.reduce((acc, curr) => {
    const status = (curr.status || "").toLowerCase().trim();
    if (status.includes("annul")) return acc;
    const p = (curr.type_prestation || curr.prestation || "").toUpperCase().trim();
    if (!p) return acc;
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  const statsGrades = history.reduce((acc, curr) => {
    const fonctionRaw = curr.pieces?.fonction || curr.fFonction || curr.fonction || "";
    const f = String(fonctionRaw).toUpperCase().trim();
    if (f.includes("ATS") || f.includes("ADMINISTRATIF") || f.includes("TECHNIQUE")) {
      acc["ATS"]++;
    } else if (f.includes("ENS") || f.includes("PROF") || f.includes("DOCTEUR") || f.includes("MAITRE") || f.includes("MCTA") || f.includes("MCA")) {
      acc["ENSEIGNANT"]++;
    } else if (f.includes("RETRAITE") || f.includes("RETR")) {
      acc["RETRAITE"]++;
    } 
    return acc;
  }, { "ATS": 0, "ENSEIGNANT": 0, "RETRAITE": 0 });

  const statsClinique = (Array.isArray(history) ? history : []).reduce((acc, curr) => {
    const cliniqueId = curr.sfEtablissement;
    const cliniqueObj = cliniques.find(c => String(c.id) === String(cliniqueId));
    const clinique = cliniqueObj
      ? (cliniqueObj.nom || cliniqueObj.nom_clinique || "INCONNU").toUpperCase().trim()
      : "INCONNU";
    if (!acc[clinique]) acc[clinique] = 0;
    acc[clinique]++;
    return acc;
  }, {});

  const dataClinique = Object.keys(statsClinique)
    .map(name => ({ name, total: statsClinique[name] }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const dataStatsBar = Object.keys(statsPrestations)
    .map(name => ({
      name: name.length > 12 ? name.substring(0, 12) + ".." : name,
      total: statsPrestations[name]
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const COLORS_BAR = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

const updatePlafondDB = async (key, value) => {
  const val = Number(value);
  if (key === 'plafond_general') setPlafondGeneral(val);
  if (key === 'plafond_dentaire') setPlafondDentaire(val);
  if (key === 'plafond_ophta') setPlafondOphta(val);
  try {
    await apiFetch("/settings/update", {
      method: "POST",
      body: JSON.stringify({ key, value: String(val) }),
    });
    showToast("✅ Plafond mis à jour");
    await fetchData();
  } catch (err) {
    console.error("❌ Erreur:", err);
    showToast("❌ Erreur lors de la sauvegarde");
  }
};
  const getStatus = (consomme, max) => {
    const ratio = (consomme / max) * 100;
    if (ratio >= 100) return { color: "bg-red-500", text: "PLAFOND ATTEINT", zone: "text-red-600", row: "bg-red-50/30", badge: "🔴" };
    if (ratio >= 70) return { color: "bg-orange-500", text: "ATTENTION", zone: "text-orange-600", row: "bg-orange-50/30", badge: "🟠" };
    return { color: "bg-emerald-500", text: "DISPONIBLE", zone: "text-emerald-600", row: "bg-white", badge: "🟢" };
  };

  const renderTable = (data, title, plafondMax, colorBorder, category) => {
    const clients = Object.values(data);
    const filtered = clients.filter(client =>
      (client.nom || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    const maxPrises = clients.reduce((max, c) => Math.max(max, c.prises.length), 0) || 1;
    const maxAvenants = clients.reduce((max, c) => Math.max(max, c.avenants.length), 0);
    const maxAnnulees = clients.reduce((max, c) => Math.max(max, (c.prisesAnnulees || []).length), 0);
    const priseColumns = Array.from({ length: maxPrises }, (_, i) => i + 1);
    const avenantColumns = Array.from({ length: maxAvenants }, (_, i) => i + 1);
    const annuleeColumns = Array.from({ length: maxAnnulees }, (_, i) => i + 1);
    const hasAnyAvenant = maxAvenants > 0;
    const hasAnyAnnulee = maxAnnulees > 0;

    if (activeTab !== category) return null;

    return (
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-white border border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-1 h-10 bg-gradient-to-b ${colorBorder} rounded-full`}></div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Suivi des consommations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Plafond {new Date().getFullYear()}</span>
              <p className="text-sm font-black text-slate-800">{plafondMax.toLocaleString()} DA</p>
            </div>
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 rounded-xl shadow-lg">
              <span className="text-[9px] font-bold text-white/80 uppercase">Total consommé</span>
              <p className="text-sm font-black text-white">{filtered.reduce((sum, c) => sum + c.totalConsomme, 0).toLocaleString()} DA</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-x-auto border border-slate-100">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white text-[10px] uppercase tracking-wider">
                <th className="p-4 sticky left-0 bg-slate-800 z-10 shadow-md rounded-l-xl">Bénéficiaire</th>
                <th className="p-4 text-center border-l border-slate-600">Nb Prises</th>
                {priseColumns.map(num => (
                  <th key={`ph-${num}`} className="p-4 border-l border-slate-600 text-center min-w-[100px]">Prise {num}</th>
                ))}
                {hasAnyAvenant && avenantColumns.map(num => (
                  <th key={`ah-${num}`} className="p-4 border-l border-amber-500 text-center bg-amber-800/30 text-amber-200">Avenant {num}</th>
                ))}
                {hasAnyAnnulee && annuleeColumns.map(num => (
                  <th key={`xh-${num}`} className="p-4 border-l border-red-400 text-center bg-red-900/30 text-red-200">Annulée {num}</th>
                ))}
                <th className="p-4 text-center border-l border-slate-600">Consommé</th>
                <th className="p-4 text-center border-l border-slate-600">Reste</th>
                <th className="p-4 text-center border-l border-slate-600 rounded-r-xl">Statut</th>
               </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={1 + priseColumns.length + (hasAnyAvenant ? avenantColumns.length : 0) + (hasAnyAnnulee ? annuleeColumns.length : 0) + 3}
                    className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-slate-300" />
                      <span className="text-sm">Aucune donnée trouvée pour "{searchTerm}"</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((client, idx) => {
                  const status = getStatus(client.totalConsomme, plafondMax);
                  const reste = Math.max(0, plafondMax - client.totalConsomme);
                  return (
                    <tr key={idx} className={`border-b border-slate-100 ${status.row} transition-all duration-200 hover:bg-slate-50 group`}>
                      <td className="p-4 sticky left-0 bg-inherit z-10 font-black text-slate-800 text-xs border-r border-slate-100">
                        {client.nom}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-600 border-l border-slate-100">
                        <span className="bg-slate-100 px-2 py-1 rounded-full text-[10px]">{client.prises.length}</span>
                      </td>
                      {priseColumns.map((_, i) => {
                        const prise = client.prises[i];
                        return (
                          <td key={`pc-${i}`} className="p-3 text-center border-l border-slate-50">
                            {prise ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[8px] font-bold text-slate-400 uppercase truncate max-w-[80px]">{prise.prestation}</span>
                                <span className={`text-[11px] font-black ${prise.status.toLowerCase().includes("annul") ? "text-red-500 line-through" : "text-emerald-600"}`}>
                                  {prise.montant.toLocaleString()} DA
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-[10px]">—</span>
                            )}
                          </td>
                        );
                      })}
                      {hasAnyAvenant && avenantColumns.map((_, i) => {
                        const av = client.avenants[i];
                        return (
                          <td key={`ac-${i}`} className={`p-3 text-center border-l border-amber-50 ${av ? 'bg-amber-50/30' : ''}`}>
                            {av ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[8px] font-bold text-amber-500 uppercase truncate max-w-[80px]">{av.prestation}</span>
                                <span className="text-[11px] font-black text-amber-600">+{av.montant.toLocaleString()} DA</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-[10px]">—</span>
                            )}
                          </td>
                        );
                      })}
                      {hasAnyAnnulee && annuleeColumns.map((_, i) => {
                        const ann = (client.prisesAnnulees || [])[i];
                        return (
                          <td key={`xc-${i}`} className={`p-3 text-center border-l border-red-50 ${ann ? 'bg-red-50/30' : ''}`}>
                            {ann ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[8px] font-bold text-red-400 uppercase truncate max-w-[80px]">{ann.prestation}</span>
                                <span className="text-[11px] font-black text-red-500 line-through">{ann.montant.toLocaleString()} DA</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-[10px]">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className={`p-4 text-center font-black border-l border-slate-100 ${status.zone}`}>
                        {client.totalConsomme.toLocaleString()} DA
                      </td>
                      <td className="p-4 text-center font-bold text-slate-500">
                        {reste.toLocaleString()} DA
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm">{status.badge}</span>
                          <span className={`${status.color} text-white text-[8px] px-2 py-0.5 rounded-full font-black`}>
                            {status.text}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };


  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-medium">Chargement des données...</p>
      </div>
    </div>
  );

  const filteredHistory = filterDate
    ? history.filter(item => new Date(item.createdAt).toISOString().split("T")[0] === filterDate)
    : history;

  return (
    <div className="flex min-h-screen">
      <style jsx global>{`
        body {
          background: linear-gradient(135deg, #f5f7fa 0%, #f8f9fc 100%);
        }
      `}</style>


      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">


        {/* CONTENT */}
        <div className="flex-1 px-8 py-8">
          {/* HEADER SECTION */}
          <header className="relative mb-8 overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-100">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-transparent"></div>
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500 rounded-full blur-[100px] opacity-10"></div>
            
            <div className="relative z-10 p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-[0.2em] mb-6 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                Dashboard Analytics
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                    Vue d'<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">ensemble</span>
                  </h1>
                  <p className="text-slate-500 text-base mt-2">
                    Exercice Annuel {new Date().getFullYear()} • Suivi en temps réel
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl px-6 py-3 text-center shadow-lg">
                    <p className="text-[9px] uppercase font-black text-emerald-300 tracking-wider">Total Prises en Charge</p>
                    <p className="text-4xl font-black text-white mt-1">
                      {filterDate ? filteredHistory.length : history.length}
                    </p>
                    {filterDate && (
                      <p className="text-[9px] text-emerald-300 mt-0.5">
                        {new Date(filterDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {filterDate && (
                      <button 
                        onClick={() => setFilterDate("")} 
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors"
                      >
                        ✕ Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* STATS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            <StatCard 
              label="Prises Actives" 
              value={filteredHistory.filter(h => !h.annule).length} 
              icon={Activity}
              trend="+12%"
            />
            <StatCard 
              label="Annulées" 
              value={filteredHistory.filter(h => h.annule).length} 
              icon={Shield}
            />
            <StatCard 
              label="Soins Dentaires" 
              value={filteredHistory.filter(h => (h.prestation || h.type_prestation || "").toUpperCase().includes("DENT")).length} 
              icon={TrendingUp}
            />
            <StatCard 
              label="Ophtalmologie" 
              value={filteredHistory.filter(h => (h.prestation || h.type_prestation || "").toUpperCase().includes("OPHTA")).length} 
              icon={Eye}
            />
          </div>

          {/* PIE CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <PieChart title="Répartition par Prestations" data={statsPrestations} colors={["#059669", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"]} />
            <PieChart title="Répartition par Grades" data={statsGrades} colors={["#1e293b", "#3b82f6", "#94a3b8", "#64748b"]} />
          </div>

          {/* TOP 5 PRESTATIONS */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-6 mb-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Top 5 des Prestations</h2>
              </div>
              <div className="flex gap-1">
                {COLORS_BAR.map((color, i) => (
                  <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                ))}
              </div>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataStatsBar}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '10px'}} />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={45}>
                    {dataStatsBar.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_BAR[index % COLORS_BAR.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PRISES PAR CLINIQUE */}
          {dataClinique.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-6 mb-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BuildingOfficeIcon className="w-5 h-5 text-slate-500" />
                  <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Prises en Charge par Clinique</h2>
                </div>
                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                  Top {dataClinique.length} établissements
                </span>
              </div>
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataClinique} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#1e3a8a', fontSize: 9, fontWeight: 800}} width={160} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}} />
                    <Bar dataKey="total" radius={[0, 8, 8, 0]} barSize={28}>
                      {dataClinique.map((entry, index) => (
                        <Cell key={`cell-clinic-${index}`} fill={['#059669','#10b981','#34d399','#6ee7b7','#a7f3d0','#064e3b'][index % 6]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* PLAFONDS + RECHERCHE */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Configuration des Plafonds</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-wider">Plafond Général (DA)</label>
                <input 
                  type="number" 
                  value={plafondGeneral} 
                  onChange={(e) => updatePlafondDB('plafond_general', e.target.value)}
                  className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-300 transition-all" 
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-wider">Plafond Dentaire (DA)</label>
                <input 
                  type="number" 
                  value={plafondDentaire} 
                  onChange={(e) => updatePlafondDB('plafond_dentaire', e.target.value)}
                  className="w-full p-3 bg-teal-50 border border-teal-200 rounded-xl font-bold text-teal-700 outline-none focus:ring-2 focus:ring-teal-300 transition-all" 
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-wider">Plafond Ophtalmique (DA)</label>
                <input 
                  type="number" 
                  value={plafondOphta} 
                  onChange={(e) => updatePlafondDB('plafond_ophta', e.target.value)}
                  className="w-full p-3 bg-purple-50 border border-purple-200 rounded-xl font-bold text-purple-700 outline-none focus:ring-2 focus:ring-purple-300 transition-all" 
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase mb-2 tracking-wider">Rechercher un bénéficiaire</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Nom du bénéficiaire..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl shadow-sm outline-none font-medium focus:ring-2 focus:ring-emerald-300 transition-all" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* TABS NAVIGATION */}
          <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl shadow-sm border border-slate-100 w-fit">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "general" 
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              📊 Général
            </button>
            <button
              onClick={() => setActiveTab("dentaire")}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "dentaire" 
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              🦷 Dentaire
            </button>
            <button
              onClick={() => setActiveTab("ophtalmique")}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "ophtalmique" 
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              👁️ Ophtalmique
            </button>
          </div>

          {/* TABLEAUX */}
          {renderTable(clientsRegroupes.general, "Consommation Médicale Générale", plafondGeneral, "from-emerald-600 to-teal-600", "general")}
          {renderTable(clientsRegroupes.dentaire, "Consommation Soins Dentaires", plafondDentaire, "from-emerald-600 to-teal-600", "dentaire")}
          {renderTable(clientsRegroupes.ophtalmique, "Consommation Soins Ophtalmologiques", plafondOphta, "from-emerald-600 to-teal-600", "ophtalmique")}
        </div>

        {/* FOOTER */}
        <footer className="mt-auto border-t border-slate-100 py-6 bg-white">
          <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
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

        {/* TOAST */}
        {toast && (
          <div className="fixed bottom-6 right-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3 rounded-xl text-sm z-50 shadow-2xl animate-in slide-in-from-bottom-2 duration-200 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}