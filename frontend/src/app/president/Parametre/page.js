"use client";

import React, { useState, useEffect, useRef } from "react";
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
  PlusCircleIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  UserGroupIcon,
  AcademicCapIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const API_URL = "http://localhost:5001/api";

// Composant Menu Item moderne (identique aux autres pages)
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

const Toast = ({ message, onClose, type = "success" }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 shadow-2xl animate-in slide-in-from-bottom-2 duration-200 flex items-center gap-2 px-5 py-3 rounded-xl text-sm ${
      type === "error" 
        ? "bg-gradient-to-r from-red-600 to-rose-600 text-white" 
        : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
    }`}>
      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
      {message}
    </div>
  );
};

export default function ParametresPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tab, setTab] = useState("prestations");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ======================
  // TYPES PRESTATIONS
  // ======================
  const [types, setTypes] = useState([]);
  const [formType, setFormType] = useState({ nom: "", id: null });
  const [showTypeModal, setShowTypeModal] = useState(false);

  // ======================
  // AGENTS
  // ======================
  const [agents, setAgents] = useState([]);
  const [formAgent, setFormAgent] = useState({ nom: "", id: null });
  const [showAgentModal, setShowAgentModal] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchTypes = async () => {
    try {
      const res = await fetch(`${API_URL}/typesprestations`);
      const data = await res.json();
      setTypes(Array.isArray(data) ? data : data.types || data.data || []);
    } catch (error) {
      showToast("Erreur lors du chargement des prestations", "error");
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_URL}/agents`);
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : data.agents || []);
    } catch (error) {
      showToast("Erreur lors du chargement des agents", "error");
    }
  };

  useEffect(() => {
    if (tab === "prestations") fetchTypes();
    if (tab === "agents") fetchAgents();
  }, [tab]);

  const saveType = async (e) => {
    e.preventDefault();
    if (!formType.nom.trim()) {
      showToast("Le nom de la prestation est requis", "error");
      return;
    }
    setLoading(true);

    const isEdit = !!formType.id;

    try {
      await fetch(
        isEdit
          ? `${API_URL}/typesprestations/${formType.id}`
          : `${API_URL}/typesprestations`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom: formType.nom })
        }
      );

      setFormType({ nom: "", id: null });
      setShowTypeModal(false);
      await fetchTypes();
      showToast(isEdit ? "Prestation modifiée avec succès" : "Prestation ajoutée avec succès");
    } catch (error) {
      showToast("Erreur lors de l'enregistrement", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteType = async (id, nom) => {
    if (!confirm(`Supprimer la prestation "${nom}" ?`)) return;
    setLoading(true);

    try {
      await fetch(`${API_URL}/typesprestations/${id}`, {
        method: "DELETE"
      });
      await fetchTypes();
      showToast("Prestation supprimée avec succès");
    } catch (error) {
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveAgent = async (e) => {
    e.preventDefault();
    if (!formAgent.nom.trim()) {
      showToast("Le nom de l'agent est requis", "error");
      return;
    }
    setLoading(true);

    const isEdit = !!formAgent.id;

    try {
      await fetch(
        isEdit
          ? `${API_URL}/agents/${formAgent.id}`
          : `${API_URL}/agents`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom: formAgent.nom })
        }
      );

      setFormAgent({ nom: "", id: null });
      setShowAgentModal(false);
      await fetchAgents();
      showToast(isEdit ? "Agent modifié avec succès" : "Agent ajouté avec succès");
    } catch (error) {
      showToast("Erreur lors de l'enregistrement", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteAgent = async (id, nom) => {
    if (!confirm(`Supprimer l'agent "${nom}" ?`)) return;
    setLoading(true);

    try {
      await fetch(`${API_URL}/agents/${id}`, {
        method: "DELETE"
      });
      await fetchAgents();
      showToast("Agent supprimé avec succès");
    } catch (error) {
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredTypes = (types || []).filter(t =>
    t.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAgents = agents.filter(a => 
    a.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const menuItems = [
    { icon: HomeIcon, label: "Accueil", href: "/" },
    { icon: ChartBarIcon, label: "Tableau de bord", href: "/president/tableauDeBord", badge: "12" },
    { icon: FolderIcon, label: "Archives PV", href: "/president/tableauDeBord" },
    { icon: Cog6ToothIcon, label: "Paramètres", href: "/president/tableauDeBord", active: true },
  ];

  const Modal = ({ title, onClose, children }) => (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-[500px] max-w-[95vw] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cog6ToothIcon className="w-5 h-5 text-white" />
            <h3 className="text-white font-semibold text-base">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center text-white"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <style jsx global>{`
        body {
          background: linear-gradient(135deg, #f5f7fa 0%, #f8f9fc 100%);
        }
      `}</style>

      {/* SIDEBAR MODERNE */}
      <aside 
        className={`relative bg-white shadow-2xl shadow-slate-200 transition-all duration-300 flex flex-col ${
          isCollapsed ? "w-20" : "w-64"
        }`}
        style={{ borderRight: "1px solid rgba(0,0,0,0.05)" }}
      >
        <div className={`p-5 border-b border-slate-100 flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl blur-md opacity-60"></div>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">S</span>
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <h2 className="font-black text-slate-800 text-sm tracking-tight">SG/COS</h2>
              <p className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">Gestion Intégrée</p>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <div className="mx-4 mt-6 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">AD</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-700">Admin User</p>
                <p className="text-[9px] text-slate-500">Super Administrateur</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-6 space-y-1.5">
          {menuItems.map((item, idx) => (
            <MenuItem
              key={idx}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={item.active}
              badge={item.badge}
            />
          ))}
        </nav>

        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-16 h-24 bg-gradient-to-t from-emerald-500/5 to-transparent rounded-full blur-xl pointer-events-none"></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* NAVBAR MODERNE */}
        <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Mode Admin</span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>{new Date().toLocaleDateString("fr-FR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></div>
                <BellIcon className="w-5 h-5 text-slate-500" />
              </button>
              
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-700">Admin User</p>
                  <p className="text-[9px] text-slate-400">admin@sgcos.com</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">AU</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* HERO SECTION */}
        <header className="relative px-8 pt-12 pb-8 overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-transparent"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500 rounded-full blur-[100px] opacity-10"></div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-[0.2em] mb-6 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              Configuration Système
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Paramètres <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">généraux</span>
            </h2>
            <p className="text-slate-500 text-base max-w-2xl leading-relaxed">
              Gérez les prestations médicales et les agents administratifs.
            </p>
          </div>
        </header>

        {/* CONTENT */}
        <section className="px-8 pb-16">
          <div className="max-w-6xl mx-auto">
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {[
                { num: types.length, label: "Prestations enregistrées", icon: "📋", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
                { num: agents.length, label: "Agents enregistrés", icon: "👥", color: "from-blue-500 to-indigo-600", bg: "bg-blue-50" },
              ].map((s) => (
                <div key={s.label} className="group relative overflow-hidden rounded-2xl p-6 bg-white shadow-xl shadow-slate-100 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${s.color} rounded-full blur-2xl opacity-0 group-hover:opacity-15 transition-opacity duration-500`}></div>
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <span className="text-2xl">{s.icon}</span>
                      </div>
                      <div className="text-3xl font-black text-slate-800">{s.num}</div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">{s.label}</div>
                    </div>
                    <div className={`w-8 h-8 rounded-full ${s.bg} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <Cog6ToothIcon className="w-3 h-3 text-slate-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* TABS NAVIGATION */}
            <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl shadow-sm border border-slate-100 w-fit">
              <button
                onClick={() => {
                  setTab("prestations");
                  setSearchTerm("");
                }}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  tab === "prestations" 
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                📋 Prestations
              </button>
              <button
                onClick={() => {
                  setTab("agents");
                  setSearchTerm("");
                }}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  tab === "agents" 
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                👥 Agents
              </button>
            </div>

            {/* SEARCH & ADD BUTTON */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => {
                  if (tab === "prestations") {
                    setFormType({ nom: "", id: null });
                    setShowTypeModal(true);
                  } else {
                    setFormAgent({ nom: "", id: null });
                    setShowAgentModal(true);
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                <PlusCircleIcon className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            {/* TABLE / LISTE */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {tab === "prestations" ? "Nom de la prestation" : "Nom de l'agent"}
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && tab === "prestations" && types.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="text-center py-16 text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm">Chargement...</span>
                          </div>
                        </td>
                      </tr>
                    ) : tab === "prestations" && filteredTypes.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="text-center py-16 text-slate-400">
                          <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <span>{searchTerm ? "Aucune prestation trouvée" : "Aucune prestation enregistrée"}</span>
                        </td>
                      </tr>
                    ) : tab === "agents" && filteredAgents.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="text-center py-16 text-slate-400">
                          <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <span>{searchTerm ? "Aucun agent trouvé" : "Aucun agent enregistré"}</span>
                        </td>
                      </tr>
                    ) : tab === "prestations" ? (
                      filteredTypes.map((t) => (
                        <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-all duration-150 group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                              <span className="font-medium text-slate-800 group-hover:text-emerald-600 transition-colors">{t.nom}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-1 justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setFormType(t);
                                  setShowTypeModal(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteType(t.id, t.nom)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      filteredAgents.map((a) => (
                        <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-all duration-150 group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                <span className="text-emerald-600 text-xs font-bold">
                                  {a.nom.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-slate-800 group-hover:text-emerald-600 transition-colors">{a.nom}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-1 justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setFormAgent(a);
                                  setShowAgentModal(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteAgent(a.id, a.nom)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-auto border-t border-slate-100 py-6 bg-white">
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

        {/* MODALS */}
        {showTypeModal && (
          <Modal title={formType.id ? "Modifier la prestation" : "Ajouter une prestation"} onClose={() => setShowTypeModal(false)}>
            <form onSubmit={saveType}>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Nom de la prestation
                </label>
                <input
                  type="text"
                  value={formType.nom}
                  onChange={(e) => setFormType({ ...formType, nom: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                  placeholder="Ex: Consultation, Chirurgie, ..."
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="px-5 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? "Traitement..." : (formType.id ? "Modifier" : "Ajouter")}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {showAgentModal && (
          <Modal title={formAgent.id ? "Modifier l'agent" : "Ajouter un agent"} onClose={() => setShowAgentModal(false)}>
            <form onSubmit={saveAgent}>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Nom de l'agent
                </label>
                <input
                  type="text"
                  value={formAgent.nom}
                  onChange={(e) => setFormAgent({ ...formAgent, nom: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                  placeholder="Ex: Dupont, Martin, ..."
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAgentModal(false)}
                  className="px-5 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? "Traitement..." : (formAgent.id ? "Modifier" : "Ajouter")}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </main>
    </div>
  );
}