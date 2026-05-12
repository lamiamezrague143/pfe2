"use client";
import ProtectedRoutes from "../../components/ProtectedRoutes";
import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import {
  HomeIcon,
  ChartBarIcon,
  FolderIcon,
  Cog6ToothIcon,
  BellIcon,
  CalendarIcon,
  PlusCircleIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ArchiveBoxIcon,
  ChevronRightIcon,
  PrinterIcon,
  CloudArrowUpIcon,
} from "@heroicons/react/24/outline";

const API_BASE = "http://localhost:5001/api";

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

// En-tête officiel pour l'impression de l'accusé
const PrintHeader = () => (
  <div className="hidden print:block text-center mb-8">
    <div className="border-b-4 border-emerald-800 pb-4">
      <h1 className="text-xl font-bold uppercase text-slate-800">République Algérienne Démocratique et Populaire</h1>
      <h2 className="text-lg font-bold text-slate-700">Ministère de l'Enseignement Supérieur et de la Recherche Scientifique</h2>
      <h3 className="text-lg font-bold text-slate-700">Université Mouloud Mammeri de Tizi-Ouzou</h3>
      <h4 className="text-md font-bold text-slate-600">Faculté De Génie Électrique Et Informatique</h4>
      <h5 className="text-md font-bold text-slate-600">Département D'Informatique</h5>
      <div className="mt-4">
        <p className="text-sm font-semibold text-slate-500">Service de Gestion des Œuvres Sociales (SG/COS)</p>
        <p className="text-xs text-slate-400">Accusé de Réception de Dossier</p>
      </div>
    </div>
  </div>
);

const inputStyle = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white";

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
    {children}
  </div>
);

function PiecesManager({ pieces, onAdd, onDelete, onStartEdit, onSaveEdit, onCancelEdit, onChangeTempNom, inputValue, onInputChange, placeholder = "Nom du document..." }) {
  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {pieces.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-sm font-medium bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            Aucun document requis pour l'instant
          </div>
        )}
        {pieces.map((p, i) => (
          <div key={p.id} className={`flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border-2 transition-all ${p.editing ? 'border-emerald-400 bg-emerald-50' : 'border-transparent'}`}>
            <DocumentTextIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            {p.editing ? (
              <>
                <input
                  autoFocus
                  value={p.tempNom ?? p.nom}
                  onChange={e => onChangeTempNom(p.id, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') onSaveEdit(p.id); if (e.key === 'Escape') onCancelEdit(p.id); }}
                  className="flex-1 bg-white border border-emerald-300 rounded-lg px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button onClick={() => onSaveEdit(p.id)} className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center hover:bg-emerald-700 transition shrink-0">
                  <CheckIcon className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onCancelEdit(p.id)} className="w-7 h-7 bg-slate-200 text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-300 transition shrink-0">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-bold text-slate-700 truncate">{p.nom}</span>
                <span className="text-[10px] font-black text-slate-300 mr-1">#{i + 1}</span>
                <button onClick={() => onStartEdit(p.id)} className="w-7 h-7 bg-white border border-slate-200 text-slate-400 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition shrink-0">
                  <PencilIcon className="w-3 h-3" />
                </button>
                <button onClick={() => onDelete(p.id)} className="w-7 h-7 bg-white border border-slate-200 text-slate-400 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition shrink-0">
                  <TrashIcon className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <input
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onAdd(); }}
          placeholder={placeholder}
          className="flex-1 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-emerald-400 focus:bg-emerald-50 transition-all placeholder:text-slate-300"
        />
        <button
          onClick={onAdd}
          disabled={!inputValue.trim()}
          className="px-4 py-2.5 bg-emerald-700 text-white rounded-xl font-black text-sm hover:bg-emerald-800 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
        >
          <PlusCircleIcon className="w-4 h-4" /> Ajouter
        </button>
      </div>
    </div>
  );
}

export default function GestionDossiersSecretariat() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dossiers, setDossiers] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [blocs, setBlocs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [prestationSelectionnee, setPrestationSelectionnee] = useState(null);
  
  const [recherchePrestation, setRecherchePrestation] = useState('');
  const [prestationTitre, setPrestationTitre] = useState('');
  const [nomRecherche, setNomRecherche] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [beneficiaireSelectionne, setBeneficiaireSelectionne] = useState(null);
  const [fonctionChoisie, setFonctionChoisie] = useState('');
  const [listePieces, setListePieces] = useState([]);
  const [montantAvenant, setMontantAvenant] = useState('');
  const [accusereception, setAccuseReception] = useState(null);

  // Champs spécifiques selon prestation
  const [dateDepartRetraite, setDateDepartRetraite] = useState('');
  const [nomDefunt, setNomDefunt] = useState('');
  const [nomEnfant, setNomEnfant] = useState('');
  const [dateMariage, setDateMariage] = useState('');
  const [avisCommission, setAvisCommission] = useState('En attente');

  const [showModalPrestation, setShowModalPrestation] = useState(false);
  const [newPrestationTitre, setNewPrestationTitre] = useState('');
  const [newPrestationPieces, setNewPrestationPieces] = useState([]);
  const [newPieceInput, setNewPieceInput] = useState('');

  const [showModalEdit, setShowModalEdit] = useState(false);
  const [editPrestation, setEditPrestation] = useState(null);
  const [editTitre, setEditTitre] = useState('');
  const [editPieces, setEditPieces] = useState([]);
  const [editPieceInput, setEditPieceInput] = useState('');

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const toutesLesPiecesCochees = listePieces.length > 0 && listePieces.every(p => p.cochee);

  const chargerDonnees = useCallback(async () => {
    try {
      const [resUsers, resDossiers, resPrestations] = await Promise.all([
        axios.get(`${API_BASE}/users/all`),
        axios.get(`${API_BASE}/dossiers/liste-generale`),
        axios.get(`${API_BASE}/prestations/all`)
      ]);
      setUtilisateurs(resUsers.data || []);
      setDossiers(resDossiers.data || []);
      const blocsData = (resPrestations.data || []).map(b => ({
        ...b,
        pieces: typeof b.pieces === 'string' ? (() => { try { return JSON.parse(b.pieces); } catch { return []; } })() : (Array.isArray(b.pieces) ? b.pieces : [])
      }));
      setBlocs(blocsData);
    } catch (err) { 
      console.error("Erreur chargement données:", err);
      showToast("Erreur de chargement des données", "error");
    }
  }, []);

  useEffect(() => { chargerDonnees(); }, [chargerDonnees]);

  // Déterminer les champs spécifiques selon le type de prestation
  const getSpecificField = () => {
    const typeLower = prestationTitre?.toLowerCase() || "";
    
    if (typeLower.includes("retraite")) {
      return { label: "Date de départ à la retraite", value: dateDepartRetraite, setValue: setDateDepartRetraite, type: "date" };
    }
    if (typeLower.includes("frais funéraire") || typeLower.includes("décès") || typeLower.includes("dece")) {
      return { label: "Nom du défunt", value: nomDefunt, setValue: setNomDefunt, type: "text", placeholder: "Nom complet du défunt" };
    }
    if (typeLower.includes("naissance")) {
      return { label: "Nom de l'enfant", value: nomEnfant, setValue: setNomEnfant, type: "text", placeholder: "Nom complet de l'enfant" };
    }
    if (typeLower.includes("circoncision")) {
      return { label: "Nom de l'enfant", value: nomEnfant, setValue: setNomEnfant, type: "text", placeholder: "Nom complet de l'enfant" };
    }
    if (typeLower.includes("mariage")) {
      return { label: "Date de mariage", value: dateMariage, setValue: setDateMariage, type: "date" };
    }
    return null;
  };

  const specificField = getSpecificField();

  const ajouterPrestation = async () => {
    if (!newPrestationTitre.trim()) return;
    try {
      const piecesArray = newPrestationPieces.map(p => p.nom).filter(Boolean);
      await axios.post(`${API_BASE}/prestations/ajouter`, {
        titre: newPrestationTitre.trim(),
        pieces: piecesArray 
      });
      await chargerDonnees();
      setShowModalPrestation(false);
      setNewPrestationTitre('');
      setNewPrestationPieces([]);
      setNewPieceInput('');
      showToast("Prestation ajoutée avec succès");
    } catch (err) {
      showToast(err.response?.data?.details || "Erreur serveur", "error");
    }
  };

  const sauvegarderModification = async () => {
    if (!editTitre.trim()) return;
    try {
      await axios.put(`${API_BASE}/prestations/modifier/${editPrestation.id}`, {
        titre: editTitre.trim(),
        pieces: editPieces.map(p => p.nom).filter(Boolean)
      });
      chargerDonnees();
      setShowModalEdit(false);
      setEditPrestation(null);
      showToast("Prestation modifiée avec succès");
    } catch (err) {
      showToast("Erreur lors de la modification", "error");
    }
  };

const supprimerPrestation = async (id, titre) => {
  if (!confirm(`Supprimer la prestation "${titre}" ?`)) return;

  try {
    await axios.delete(`${API_BASE}/prestations/${id}`);

    chargerDonnees();
    showToast("Prestation supprimée avec succès");
  } catch (err) {
    console.error(err);
    showToast("Erreur lors de la suppression", "error");
  }
};

  const ouvrirFormulaire = (bloc) => {
    setPrestationSelectionnee(bloc);
    setPrestationTitre(bloc.titre);
    setListePieces((bloc.pieces || []).map(p => ({ nom: p, cochee: false })));
    setMontantAvenant('');
    setAccuseReception(null);
    setNomRecherche('');
    setBeneficiaireSelectionne(null);
    setFonctionChoisie('');
    setDateDepartRetraite('');
    setNomDefunt('');
    setNomEnfant('');
    setDateMariage('');
    setAvisCommission('En attente');
  };

  const fermerFormulaire = () => {
    setPrestationSelectionnee(null);
    setListePieces([]);
    setBeneficiaireSelectionne(null);
    setNomRecherche('');
    setFonctionChoisie('');
    setAccuseReception(null);
  };

  const type = prestationTitre?.toLowerCase() || "";
  const isMontantRequired = type.includes("avenant") || type.includes("ophtalmologie") || type.includes("lunetterie") || type.includes("dentaire");

  const handleSubmit = async () => {
    if (!beneficiaireSelectionne || !fonctionChoisie || !toutesLesPiecesCochees) return;
    setIsSubmitting(true);
    
    const piecesSelectionnees = listePieces.filter(p => p.cochee).map(p => p.nom);
    const faculteValue = beneficiaireSelectionne.departement || beneficiaireSelectionne.faculte || "Non spécifié";
    
    const payload = {
      nom_beneficiaire: `${beneficiaireSelectionne.nomComplet} ${beneficiaireSelectionne.prenomComplet}`,
      type_prestation: prestationTitre,
      fonction: fonctionChoisie,
      pieces_deposees: piecesSelectionnees,
      montant_avenant: isMontantRequired ? parseFloat(montantAvenant) || 0 : 0,
      faculte: faculteValue,
      numero_dossier: `COS/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}`,
      avis_commission: avisCommission,
      date_depart_retraite: dateDepartRetraite,
      nom_defunt: nomDefunt,
      nom_enfant: nomEnfant,
      date_mariage: dateMariage
    };
    
    try {
      const res = await axios.post(`${API_BASE}/dossiers/ajouter`, payload);
      setAccuseReception({
        ...res.data, 
        nom: beneficiaireSelectionne.nomComplet,
        prenom: beneficiaireSelectionne.prenomComplet,
        dateN: beneficiaireSelectionne.dateNaissance,
        lieuN: beneficiaireSelectionne.lieuNaissance,
        categorie: fonctionChoisie,
        piecesAffichees: piecesSelectionnees,
        montantAffichage: isMontantRequired ? (parseFloat(montantAvenant) || 0) : null,
        dateSysteme: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        faculte: faculteValue,
        numeroDossier: payload.numero_dossier,
        avisCommission: avisCommission,
        dateDepartRetraite: dateDepartRetraite,
        nomDefunt: nomDefunt,
        nomEnfant: nomEnfant,
        dateMariage: dateMariage,
        prestationTitre: prestationTitre
      });
      chargerDonnees();
      showToast("Dossier enregistré avec succès");
    } catch (err) { 
      console.error(err);
      showToast("Erreur lors de l'enregistrement", "error");
    } finally { 
      setIsSubmitting(false); 
    }
  };

   const menuItems = [
     { icon: HomeIcon, label: "Accueil", href: "/" },
     { icon: ChartBarIcon, label: "Registre General", href: "/secretariat/registreGeneral", badge: "12" },
     { icon: FolderIcon, label: "Prestations", href: "/secretariat" },
   ];
 
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
                  <span className="text-white text-sm font-bold">SC</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-700">Secrétariat COS</p>
                <p className="text-[9px] text-slate-500">Gestionnaire</p>
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
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Secrétariat / COS</span>
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

        {/* En-tête pour l'impression de l'accusé */}
        <PrintHeader />

        {/* HERO SECTION */}
        <header className="relative px-8 pt-12 pb-8 overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-transparent"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500 rounded-full blur-[100px] opacity-10"></div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-[0.2em] mb-6 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              Gestion des Dossiers
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Prise en charge <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">COS</span>
            </h2>
            <p className="text-slate-500 text-base max-w-2xl leading-relaxed">
              Gérez les dossiers de prise en charge des bénéficiaires.
            </p>
          </div>
        </header>

        {/* CONTENT */}
        <section className="px-8 pb-16">
          <div className="max-w-6xl mx-auto">
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {[
                { num: blocs.length, label: "Prestations", icon: "📋", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50" },
                { num: dossiers.filter(d => new Date(d.createdAt).getMonth() === new Date().getMonth()).length, label: "Dossiers (mois)", icon: "📁", color: "from-blue-500 to-indigo-600", bg: "bg-blue-50" },
                { num: utilisateurs.length, label: "Bénéficiaires", icon: "👥", color: "from-amber-500 to-orange-600", bg: "bg-amber-50" },
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
                  </div>
                </div>
              ))}
            </div>

            {/* Liste des prestations et formulaire */}
            {!prestationSelectionnee ? (
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-black text-slate-700 text-sm uppercase tracking-wider">Types de Prestations</h3>
                    </div>
                    <button
                      onClick={() => setShowModalPrestation(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all"
                    >
                      <PlusCircleIcon className="w-4 h-4" /> Nouvelle prestation
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="relative mb-6 max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={recherchePrestation}
                      onChange={(e) => setRecherchePrestation(e.target.value)}
                      placeholder="Rechercher une prestation..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {blocs
                      .filter(b => (b.titre || "").toLowerCase().includes(recherchePrestation.toLowerCase()))
                      .map(b => (
                        <div key={b.id} className="group relative">
                          <button
                            onClick={() => ouvrirFormulaire(b)}
                            className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left"
                          >
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                              <DocumentTextIcon className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-slate-800 text-sm">{b.titre}</p>
                              <p className="text-[10px] text-slate-400">{b.pieces?.length || 0} document(s) requis</p>
                            </div>
                            <ChevronRightIcon className="w-4 h-4 text-slate-300" />
                          </button>
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditPrestation(b); setEditTitre(b.titre); setEditPieces((b.pieces || []).map((nom, i) => ({ id: i + '_' + nom, nom, editing: false }))); setShowModalEdit(true); }}
                              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-200"
                            >
                              <PencilIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); supprimerPrestation(b.id, b.titre); }}
                              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 hover:border-red-200"
                            >
                              <TrashIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              /* FORMULAIRE DE DOSSIER */
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-slate-800 text-lg">{prestationTitre}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Formulaire de dépôt de dossier</p>
                  </div>
                  <button onClick={fermerFormulaire} className="text-slate-400 hover:text-slate-600">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      {/* Recherche bénéficiaire */}
                      <div>
                        <label className="block text-xs font-black text-emerald-700 uppercase tracking-wider mb-2">Rechercher le bénéficiaire</label>
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            placeholder="Nom du bénéficiaire..."
                            value={nomRecherche}
                            onChange={(e) => { 
                              setNomRecherche(e.target.value); 
                              if(e.target.value.length > 1) { 
                                setSuggestions(utilisateurs.filter(u => (u.nomComplet || "").toLowerCase().includes(e.target.value.toLowerCase()))); 
                              } else setSuggestions([]); 
                            }} 
                          />
                          {suggestions.length > 0 && (
                            <div className="absolute z-30 mt-1 w-full bg-white shadow-xl rounded-xl border border-slate-100 overflow-hidden">
                              {suggestions.map(u => (
                                <div 
                                  key={u.id} 
                                  onClick={() => { 
                                    setBeneficiaireSelectionne(u); 
                                    setNomRecherche(`${u.nomComplet} ${u.prenomComplet}`); 
                                    setSuggestions([]); 
                                  }} 
                                  className="p-3 hover:bg-emerald-50 cursor-pointer font-medium text-sm border-b last:border-0"
                                >
                                  {u.nomComplet} {u.prenomComplet} - {u.departement || ""}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Fiche bénéficiaire */}
                      {beneficiaireSelectionne && (
                        <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="bg-emerald-600 text-white p-2 rounded-lg"><UserGroupIcon className="w-4 h-4" /></div>
                            <h4 className="font-black text-emerald-700 uppercase text-xs">Fiche Bénéficiaire</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Nom</p><p className="font-bold text-slate-800 text-sm">{beneficiaireSelectionne.nomComplet}</p></div>
                            <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Prénom</p><p className="font-bold text-slate-800 text-sm">{beneficiaireSelectionne.prenomComplet}</p></div>
                            <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Date Naissance</p><p className="font-bold text-slate-800 text-sm">{beneficiaireSelectionne.dateNaissance}</p></div>
                            <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Lieu Naissance</p><p className="font-bold text-slate-800 text-sm">{beneficiaireSelectionne.lieuNaissance}</p></div>
                            <div className="col-span-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Faculté / Département</p>
                              <p className="font-bold text-emerald-700 text-sm bg-emerald-100 inline-block px-3 py-1 rounded-full">
                                {beneficiaireSelectionne.departement || beneficiaireSelectionne.faculte || "Non spécifié"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Champ spécifique selon prestation */}
                      {specificField && specificField.type === "text" && (
                        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                          <label className="block text-xs font-black text-blue-700 uppercase tracking-wider mb-2">{specificField.label}</label>
                          <input 
                            type="text"
                            placeholder={specificField.placeholder}
                            className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            value={specificField.value}
                            onChange={(e) => specificField.setValue(e.target.value)}
                          />
                        </div>
                      )}

                      {specificField && specificField.type === "date" && (
                        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                          <label className="block text-xs font-black text-blue-700 uppercase tracking-wider mb-2">{specificField.label}</label>
                          <input 
                            type="date"
                            className="w-full p-3 bg-white border border-blue-200 rounded-xl outline-none font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            value={specificField.value}
                            onChange={(e) => specificField.setValue(e.target.value)}
                          />
                        </div>
                      )}

                      
              

                      {/* Montant avenant */}
                      {isMontantRequired && (
                        <div className="bg-amber-50 p-5 rounded-xl border-2 border-amber-100">
                          <label className="block text-xs font-black text-amber-700 uppercase tracking-wider mb-2">Montant de l'Avenant (DA)</label>
                          <input 
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full p-3 bg-white border-2 border-amber-200 rounded-xl outline-none font-black text-lg text-amber-700 focus:border-amber-500 transition-all"
                            value={montantAvenant}
                            onChange={(e) => setMontantAvenant(e.target.value)}
                          />
                        </div>
                      )}

                      {/* Catégorie */}
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Confirmer la Catégorie</label>
                        <div className="flex gap-2">
                          {['ATS', 'Enseignant', 'Retraité'].map(f => (
                            <button 
                              key={f} 
                              onClick={() => setFonctionChoisie(f)} 
                              className={`flex-1 py-3 rounded-xl text-xs font-black border-2 transition-all ${
                                fonctionChoisie === f 
                                  ? "bg-emerald-600 border-emerald-600 text-white" 
                                  : "bg-white border-slate-200 text-slate-400 hover:border-emerald-300"
                              }`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                      <label className="block text-xs font-black text-emerald-700 uppercase tracking-wider mb-4">Documents fournis</label>
                      <div className="space-y-3 mb-6">
                        {listePieces.map((p, i) => (
                          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl bg-white border-2 transition-all ${p.cochee ? 'border-emerald-500 shadow-sm' : 'border-transparent'}`}>
                            <div 
                              onClick={() => { const copy = [...listePieces]; copy[i].cochee = !copy[i].cochee; setListePieces(copy); }} 
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer ${p.cochee ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}
                            >
                              {p.cochee && <CheckIcon className="w-3 h-3 stroke-white stroke-2" />}
                            </div>
                            <span className={`flex-1 font-bold text-sm ${p.cochee ? 'text-emerald-700' : 'text-slate-500'}`}>{p.nom}</span>
                          </div>
                        ))}
                        {listePieces.length === 0 && (
                          <div className="text-center py-8 text-slate-400 text-sm">Aucun document requis pour cette prestation</div>
                        )}
                      </div>
                      <button 
                        onClick={handleSubmit} 
                        disabled={!beneficiaireSelectionne || !fonctionChoisie || !toutesLesPiecesCochees || isSubmitting} 
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black text-sm shadow-lg disabled:opacity-30 transition-all hover:shadow-xl"
                      >
                        {isSubmitting ? "Enregistrement..." : "Enregistrer le dossier"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

        {/* MODALES */}
        {/* Modale Ajout Prestation */}
        {showModalPrestation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Nouvelle Prestation</h3>
                  <p className="text-emerald-200 text-xs font-bold mt-0.5">Définissez le titre et les documents requis</p>
                </div>
                <button onClick={() => { setShowModalPrestation(false); setNewPrestationTitre(''); setNewPrestationPieces([]); }} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Titre de la prestation <span className="text-red-500">*</span></label>
                  <input className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold text-slate-800 border-2 border-transparent focus:border-emerald-300 transition-all mt-1" placeholder="ex: Aide médicale spécialisée" value={newPrestationTitre} onChange={e => setNewPrestationTitre(e.target.value)} autoFocus />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Documents requis</label>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{newPrestationPieces.length} document(s)</span>
                  </div>
                  <PiecesManager
                    pieces={newPrestationPieces}
                    onAdd={ajouterPieceNouveauForm}
                    onDelete={supprimerPieceNouveauForm}
                    onStartEdit={startEditPieceNouveauForm}
                    onSaveEdit={saveEditPieceNouveauForm}
                    onCancelEdit={cancelEditPieceNouveauForm}
                    onChangeTempNom={changeTempNomNouveauForm}
                    inputValue={newPieceInput}
                    onInputChange={setNewPieceInput}
                    placeholder="ex: Demande manuscrite, Ordonnance..."
                  />
                </div>
              </div>
              <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex gap-3">
                <button onClick={() => { setShowModalPrestation(false); setNewPrestationTitre(''); setNewPrestationPieces([]); }} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-black text-sm hover:bg-slate-50 transition-all">Annuler</button>
                <button onClick={ajouterPrestation} disabled={!newPrestationTitre.trim()} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-lg disabled:opacity-30 hover:shadow-xl transition-all flex items-center justify-center gap-2">
                  <PlusCircleIcon className="w-4 h-4" /> Créer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modale Modification Prestation */}
        {showModalEdit && editPrestation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Modifier la Prestation</h3>
                  <p className="text-blue-200 text-xs font-bold mt-0.5">Modifiez le titre ou les documents requis</p>
                </div>
                <button onClick={() => { setShowModalEdit(false); setEditPrestation(null); }} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Titre de la prestation <span className="text-red-500">*</span></label>
                  <input className="w-full p-3 bg-slate-50 rounded-xl outline-none font-bold text-slate-800 border-2 border-transparent focus:border-blue-300 transition-all mt-1" value={editTitre} onChange={e => setEditTitre(e.target.value)} autoFocus />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Documents requis</label>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{editPieces.length} document(s)</span>
                  </div>
                  <PiecesManager
                    pieces={editPieces}
                    onAdd={ajouterPieceEdit}
                    onDelete={supprimerPieceEdit}
                    onStartEdit={startEditPieceEdit}
                    onSaveEdit={saveEditPieceEdit}
                    onCancelEdit={cancelEditPieceEdit}
                    onChangeTempNom={changeTempNomEdit}
                    inputValue={editPieceInput}
                    onInputChange={setEditPieceInput}
                    placeholder="Ajouter un document..."
                  />
                </div>
              </div>
              <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex gap-3">
                <button onClick={() => { setShowModalEdit(false); setEditPrestation(null); }} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-black text-sm hover:bg-slate-50 transition-all">Annuler</button>
                <button onClick={sauvegarderModification} disabled={!editTitre.trim()} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm shadow-lg disabled:opacity-30 hover:shadow-xl transition-all flex items-center justify-center gap-2">
                  <CheckIcon className="w-4 h-4" /> Sauvegarder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Accusé de réception */}
        {accusereception && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Accusé de Réception</h3>
                    <p className="text-emerald-200 text-sm font-bold">Dossier N° {accusereception.numeroDossier || '2026-X'}</p>
                  </div>
                  <button onClick={() => setAccuseReception(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Type de Prestation</p>
                  <p className="text-xl font-black text-emerald-700">{accusereception.prestationTitre}</p>
                  <p className="text-right text-xs text-slate-500 mt-2">Date: {accusereception.dateSysteme}</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Bénéficiaire</p>
                    <p className="font-black text-slate-800">{accusereception.nom} {accusereception.prenom}</p>
                    <div className="mt-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Né(e) le</p>
                      <p className="font-bold text-slate-800">{accusereception.dateN} à {accusereception.lieuN}</p>
                    </div>
                    <div className="mt-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Faculté</p>
                      <p className="font-bold text-emerald-700">{accusereception.faculte}</p>
                    </div>
                    {accusereception.montantAffichage > 0 && (
                      <div className="mt-4 bg-amber-50 p-3 rounded-xl">
                        <p className="text-[9px] font-black text-amber-600 uppercase">Montant Avenant</p>
                        <p className="font-black text-amber-800">{accusereception.montantAffichage.toLocaleString('fr-FR')} DA</p>
                      </div>
                    )}
                    {accusereception.dateDepartRetraite && (
                      <div className="mt-4 bg-blue-50 p-3 rounded-xl">
                        <p className="text-[9px] font-black text-blue-600 uppercase">Date départ retraite</p>
                        <p className="font-black text-blue-800">{accusereception.dateDepartRetraite}</p>
                      </div>
                    )}
                    {accusereception.nomDefunt && (
                      <div className="mt-4 bg-gray-50 p-3 rounded-xl">
                        <p className="text-[9px] font-black text-gray-600 uppercase">Défunt</p>
                        <p className="font-black text-gray-800">{accusereception.nomDefunt}</p>
                      </div>
                    )}
                    {accusereception.nomEnfant && (
                      <div className="mt-4 bg-pink-50 p-3 rounded-xl">
                        <p className="text-[9px] font-black text-pink-600 uppercase">Enfant</p>
                        <p className="font-black text-pink-800">{accusereception.nomEnfant}</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-[10px] font-black text-emerald-700 uppercase mb-3">Documents fournis</p>
                    <ul className="space-y-2">
                      {accusereception.piecesAffichees.map((p, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <CheckIcon className="w-4 h-4 text-emerald-600" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 pt-4 border-t border-slate-100">
                <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-black text-sm shadow-lg hover:shadow-xl transition-all">
                  <PrinterIcon className="w-4 h-4" /> Imprimer l'accusé
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );

  // Helpers pour PiecesManager
  function ajouterPieceNouveauForm() {
    const val = newPieceInput.trim();
    if (!val) return;
    setNewPrestationPieces(prev => [...prev, { id: Date.now(), nom: val, editing: false }]);
    setNewPieceInput('');
  }
  function supprimerPieceNouveauForm(id) { setNewPrestationPieces(prev => prev.filter(p => p.id !== id)); }
  function startEditPieceNouveauForm(id) { setNewPrestationPieces(prev => prev.map(p => p.id === id ? { ...p, editing: true, tempNom: p.nom } : p)); }
  function saveEditPieceNouveauForm(id) { setNewPrestationPieces(prev => prev.map(p => p.id === id ? { ...p, nom: (p.tempNom || p.nom).trim() || p.nom, editing: false, tempNom: undefined } : p)); }
  function cancelEditPieceNouveauForm(id) { setNewPrestationPieces(prev => prev.map(p => p.id === id ? { ...p, editing: false, tempNom: undefined } : p)); }
  function changeTempNomNouveauForm(id, val) { setNewPrestationPieces(prev => prev.map(p => p.id === id ? { ...p, tempNom: val } : p)); }

  function ajouterPieceEdit() {
    const val = editPieceInput.trim();
    if (!val) return;
    setEditPieces(prev => [...prev, { id: Date.now(), nom: val, editing: false }]);
    setEditPieceInput('');
  }
  function supprimerPieceEdit(id) { setEditPieces(prev => prev.filter(p => p.id !== id)); }
  function startEditPieceEdit(id) { setEditPieces(prev => prev.map(p => p.id === id ? { ...p, editing: true, tempNom: p.nom } : p)); }
  function saveEditPieceEdit(id) { setEditPieces(prev => prev.map(p => p.id === id ? { ...p, nom: (p.tempNom || p.nom).trim() || p.nom, editing: false, tempNom: undefined } : p)); }
  function cancelEditPieceEdit(id) { setEditPieces(prev => prev.map(p => p.id === id ? { ...p, editing: false, tempNom: undefined } : p)); }
  function changeTempNomEdit(id, val) { setEditPieces(prev => prev.map(p => p.id === id ? { ...p, tempNom: val } : p)); }
}