"use client";
import ProtectedRoutes from "../../components/ProtectedRoutes";
import React, { useState, useEffect, useRef } from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowRightIcon, 
  DocumentTextIcon, 
  FolderIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArchiveBoxIcon,
  DocumentDuplicateIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CalendarIcon,
  BellIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { apiFetch } from "../../lib/api";
const API_URL = "/archives"; 
const STATUS_LABELS = {
  open: { label: "Ouvert", color: "#166534", bg: "rgba(21,128,61,0.1)" },
  pending: { label: "En attente", color: "#92400e", bg: "rgba(234,179,8,0.12)" },
  closed: { label: "Clôturé", color: "#6b7280", bg: "#f3f4f6" },
};

const DOC_ICON = (name = "") => {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "pdf") return "📕";
  if (["doc", "docx"].includes(ext)) return "📘";
  if (["jpg", "jpeg", "png", "gif"].includes(ext)) return "🖼️";
  return "📄";
};

const StatusBadge = ({ status }) => {
  const s = STATUS_LABELS[status] || STATUS_LABELS.open;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ color: s.color, background: s.bg }}
    >
      <span className={`w-1.5 h-1.5 rounded-full`} style={{ background: s.color }}></span>
      {s.label}
    </span>
  );
};

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3 rounded-xl text-sm z-50 shadow-2xl animate-in slide-in-from-bottom-2 duration-200 flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
      {message}
    </div>
  );
};

const Modal = ({ title, onClose, footer, children }) => (
  <div
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div className="bg-white rounded-2xl w-[520px] max-w-[95vw] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArchiveBoxIcon className="w-5 h-5 text-white" />
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
      {footer && (
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          {footer}
        </div>
      )}
    </div>
  </div>
);

const inputStyle = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white";

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

// Composant Menu Item moderne
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

export default function ArchivePVPage() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [nomDossier, setNomDossier] = useState("");
  const [datePV, setDatePV] = useState("");
  const [nbPages, setNbPages] = useState("");
  const [status, setStatus] = useState("open");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

  const [viewPV, setViewPV] = useState(null);
  const [editPV, setEditPV] = useState(null);
  const [editNom, setEditNom] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPages, setEditPages] = useState("");
  const [editStatus, setEditStatus] = useState("open");
  const [editDesc, setEditDesc] = useState("");

  const [toast, setToast] = useState(null);
  const showToast = (msg) => setToast(msg);

const loadArchives = async () => {
  setLoading(true);
  try {
    const query = new URLSearchParams();
    if (searchTerm) query.append("search", searchTerm);
    if (filterStatus) query.append("status", filterStatus);

    const data = await apiFetch(`/archives?${query.toString()}`);
    if (!data) return; // 401 → redirect géré dans apiFetch
    setArchives(Array.isArray(data) ? data : data.archives || []);
  } catch (err) {
    console.error(err);
    showToast("❌ Erreur de chargement");
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    const delay = setTimeout(() => loadArchives(), 300);
    return () => clearTimeout(delay);
  }, [searchTerm, filterStatus]);

const handleUpload = async (e) => {
  e.preventDefault();
  if (!nomDossier.trim()) { showToast("❌ Le nom du dossier est requis"); return; }

  const formData = new FormData();
  formData.append("nomDossier", nomDossier);
  formData.append("date", datePV);
  formData.append("pages", nbPages);
  formData.append("status", status);
  formData.append("description", description);
  files.forEach((f) => formData.append("files", f));

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`http://localhost:5001/api/archives/upload`, {
      method: "POST",
      headers: {
        // PAS de Content-Type ici → multipart/form-data auto
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "/";
      return;
    }

    resetForm();
    loadArchives();
    showToast("✅ PV enregistré avec succès");
  } catch (err) {
    console.error(err);
    showToast("❌ Erreur lors de l'enregistrement");
  }
};
  const resetForm = () => {
    setNomDossier("");
    setDatePV("");
    setNbPages("");
    setStatus("open");
    setDescription("");
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

const deleteArchive = async (id) => {
  if (!confirm("Supprimer ce PV définitivement ?")) return;
  try {
    await apiFetch(`/archives/${id}`, { method: "DELETE" });
    loadArchives();
    showToast("🗑️ PV supprimé");
    setViewPV(null);
    setEditPV(null);
  } catch {
    showToast("❌ Erreur suppression");
  }
};

const handleUpdate = async () => {
  if (!editNom.trim()) { showToast("❌ Le nom est requis"); return; }
  try {
    await apiFetch(`/archives/${editPV.id}`, {
      method: "PUT",
      body: JSON.stringify({
        nomDossier: editNom,
        date: editDate,
        pages: editPages,
        status: editStatus,
        description: editDesc,
      }),
    });
    setEditPV(null);
    loadArchives();
    showToast("✅ PV mis à jour");
  } catch {
    showToast("❌ Erreur modification");
  }
};
  const openEdit = (arc) => {
    setEditPV(arc);
    setEditNom(arc.nomDossier || "");
    setEditDate(arc.date || "");
    setEditPages(arc.pages || "");
    setEditStatus(arc.status || "open");
    setEditDesc(arc.description || "");
  };

  const addFiles = (newFiles) => setFiles((prev) => [...prev, ...newFiles]);
  const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const totalPages = archives.reduce((a, p) => a + (parseInt(p.pages) || 0), 0);
  const totalFichiers = archives.reduce(
    (a, p) => a + (Array.isArray(p.fichiers) ? p.fichiers.length : 0),
    0
  );

  const menuItems = [
    { icon: HomeIcon, label: "Accueil", href: "/" },
    { icon: ChartBarIcon, label: "Tableau de bord", href: "/president/tableauDeBord", badge: "12" },
    { icon: FolderIcon, label: "Archives PV", href: "/archives", active: true },
    { icon: Cog6ToothIcon, label: "Paramètres", href: "/president/Parametre" },
  ];

  return (
    <div className={`flex min-h-screen ${isDarkMode ? "dark" : ""}`}>
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
        {/* Logo Section avec animation */}
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

        {/* Profil Utilisateur */}
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

        {/* Navigation */}
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
        {/* Décoration */}
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
              Module Archives
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Gestion des <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Procès-Verbaux</span>
            </h2>
            <p className="text-slate-500 text-base max-w-2xl leading-relaxed">
              Centralisez, gérez et archivez l'ensemble des procès-verbaux et documents administratifs.
            </p>
          </div>
        </header>

        {/* CONTENT - Same as before but with enhanced styling */}
        <section className="px-8 pb-16">
          <div className="max-w-6xl mx-auto">
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {[
                { num: archives.length, label: "PV total", icon: "📄", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
                { num: totalPages, label: "Pages enregistrées", icon: "📖", color: "from-blue-500 to-indigo-600", bg: "bg-blue-50" },
                { num: totalFichiers, label: "Fichiers archivés", icon: "💾", color: "from-amber-500 to-orange-600", bg: "bg-amber-50" },
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
                      <ArrowRightIcon className="w-3 h-3 text-slate-600" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* FORM CARD - Keep existing form but with enhanced styling */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-transparent to-transparent">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <PlusCircleIcon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-slate-800">Nouveau procès-verbal</h3>
                </div>
              </div>
              {/* Rest of the form remains the same */}
              <form onSubmit={handleUpload} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Nom du dossier *">
                    <input className={inputStyle} type="text" value={nomDossier} onChange={(e) => setNomDossier(e.target.value)} placeholder="ex: PV Conseil du 03/05/2025" />
                  </Field>
                  <Field label="Date du PV">
                    <input className={inputStyle} type="date" value={datePV} onChange={(e) => setDatePV(e.target.value)} />
                  </Field>
                  <Field label="Nombre de pages">
                    <input className={inputStyle} type="text" value={nbPages} onChange={(e) => setNbPages(e.target.value)} placeholder="ex: 12" />
                  </Field>
                  <Field label="Statut">
                    <select className={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="open">Ouvert</option>
                      <option value="pending">En attente</option>
                      <option value="closed">Clôturé</option>
                    </select>
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Description / Objet du PV">
                      <textarea
                        className={`${inputStyle} resize-none`}
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Résumé, ordre du jour, remarques..."
                      />
                    </Field>
                  </div>

                  <div className="md:col-span-2">
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                        dragging ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200 bg-slate-50/50 hover:border-emerald-400 hover:bg-emerald-50/30"
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.png,.jpeg"
                        onChange={(e) => addFiles(Array.from(e.target.files))}
                      />
                      <CloudArrowUpIcon className={`w-12 h-12 mx-auto mb-3 transition-all ${dragging ? "text-emerald-500 scale-110" : "text-slate-400"}`} />
                      <p className="text-sm text-slate-600">
                        Déposez vos fichiers ici ou{" "}
                        <span className="text-emerald-600 font-semibold hover:underline">cliquez pour parcourir</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">PDF, Word, Images — plusieurs fichiers acceptés</p>

                      {files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 justify-center">
                          {files.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm shadow-sm">
                              <span>{DOC_ICON(f.name)}</span>
                              <span className="max-w-[150px] truncate">{f.name}</span>
                              <button type="button" onClick={() => removeFile(i)} className="hover:text-red-600 ml-1 font-bold">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                  <button type="button" onClick={resetForm} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors">
                    Annuler
                  </button>
                  <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:scale-105 transition-all duration-200">
                    Enregistrer le PV
                  </button>
                </div>
              </form>
            </div>

            {/* SEARCH & FILTER */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                  type="text"
                  placeholder="Rechercher un PV par nom, date, statut..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white min-w-[180px] cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">📊 Tous les statuts</option>
                <option value="open">🟢 Ouvert</option>
                <option value="pending">🟡 En attente</option>
                <option value="closed">⚪ Clôturé</option>
              </select>
            </div>

            {/* TABLE - Keep existing table structure */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <tr>
                      {["Dossier PV", "Date", "Pages", "Fichiers", "Statut", ""].map((h) => (
                        <th key={h} className={`px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider ${h === "" ? "text-right" : ""}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center py-16 text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm">Chargement des archives...</span>
                        </div>
                      </td></tr>
                    ) : archives.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-16 text-slate-400">
                        <FolderIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <span>Aucun PV trouvé</span>
                      </td></tr>
                    ) : (
                      archives.map((arc) => (
                        <tr key={arc.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-all duration-150 cursor-pointer group" onClick={() => setViewPV(arc)}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <DocumentTextIcon className="w-4 h-4 text-emerald-500" />
                              <span className="font-medium text-slate-800 group-hover:text-emerald-600 transition-colors">{arc.nomDossier}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {arc.date ? new Date(arc.date).toLocaleDateString("fr-FR") : "—"}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs">{arc.pages ? `📄 ${arc.pages} page(s)` : "—"}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {Array.isArray(arc.fichiers) && arc.fichiers.length ? `📎 ${arc.fichiers.length} fichier(s)` : "—"}
                          </td>
                          <td className="px-6 py-4"><StatusBadge status={arc.status || "open"} /></td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1 justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setViewPV(arc)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><EyeIcon className="w-4 h-4" /></button>
                              <button onClick={() => openEdit(arc)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"><PencilIcon className="w-4 h-4" /></button>
                              <button onClick={() => deleteArchive(arc.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><TrashIcon className="w-4 h-4" /></button>
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

        {/* MODALS - Keep existing modal structure */}
        {viewPV && (
          <Modal title={viewPV.nomDossier} onClose={() => setViewPV(null)} footer={
            <>
              <button onClick={() => setViewPV(null)} className="px-5 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors">Fermer</button>
              <button onClick={() => { setViewPV(null); openEdit(viewPV); }} className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">Modifier</button>
            </>
          }>
            <div className="space-y-3">
              {[
                ["Date", viewPV.date ? new Date(viewPV.date).toLocaleDateString("fr-FR") : "—"],
                ["Pages", viewPV.pages || "—"],
                ["Statut", null],
              ].map(([lbl, val]) => (
                <div key={lbl} className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">{lbl}</span>
                  <span className="font-medium text-slate-800">{lbl === "Statut" ? <StatusBadge status={viewPV.status || "open"} /> : val}</span>
                </div>
              ))}
              {viewPV.description && (
                <div className="pt-2">
                  <p className="text-slate-500 text-sm mb-2">Description</p>
                  <p className="text-slate-700 text-sm leading-relaxed">{viewPV.description}</p>
                </div>
              )}
              <div className="pt-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">📎 Fichiers joints</p>
                {Array.isArray(viewPV.fichiers) && viewPV.fichiers.length > 0 ? (
                  <div className="space-y-2">
                    {viewPV.fichiers.map((f, i) => (
                      <a key={i} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg text-sm text-emerald-600 hover:bg-emerald-50 transition-colors group">
                        <span className="text-lg">{DOC_ICON(f.nom)}</span>
                        <span className="flex-1 truncate">{f.nom}</span>
                        <span className="text-xs text-slate-400 group-hover:text-emerald-500">Ouvrir →</span>
                      </a>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-400">Aucun fichier joint</p>}
              </div>
            </div>
          </Modal>
        )}

        {editPV && (
          <Modal title="Modifier le PV" onClose={() => setEditPV(null)} footer={
            <>
              <button onClick={() => deleteArchive(editPV.id)} className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">Supprimer</button>
              <button onClick={() => setEditPV(null)} className="px-5 py-2 text-sm text-slate-600 hover:text-slate-800">Annuler</button>
              <button onClick={handleUpdate} className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-medium hover:shadow-lg">Enregistrer</button>
            </>
          }>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nom du dossier *">
                <input className={inputStyle} type="text" value={editNom} onChange={(e) => setEditNom(e.target.value)} />
              </Field>
              <Field label="Date du PV">
                <input className={inputStyle} type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </Field>
              <Field label="Nombre de pages">
                <input className={inputStyle} type="text" value={editPages} onChange={(e) => setEditPages(e.target.value)} />
              </Field>
              <Field label="Statut">
                <select className={inputStyle} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="open">Ouvert</option>
                  <option value="pending">En attente</option>
                  <option value="closed">Clôturé</option>
                </select>
              </Field>
              <div className="col-span-2">
                <Field label="Description">
                  <textarea className={`${inputStyle} resize-none`} rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                </Field>
              </div>
            </div>
          </Modal>
        )}

        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </main>
    </div>
  );
}