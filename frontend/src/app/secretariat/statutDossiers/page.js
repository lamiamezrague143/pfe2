"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  HomeIcon,
  ChartBarIcon,
  FolderIcon,
  BellIcon,
  CalendarIcon,
  PlusCircleIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  CreditCardIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { apiFetch } from "../../../lib/api";
import { QrCodeIcon } from "@heroicons/react/24/outline";
import QRCode from 'qrcode'; // npm install qrcode

// ─────────────────────────────────────────────
// COMPOSANTS UTILITAIRES
// ─────────────────────────────────────────────

const MenuItem = ({ icon: Icon, label, href, active, badge }) => (
  <Link
    href={href}
    className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
      active
        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
        : "text-slate-600 hover:bg-slate-100"
    }`}
  >
    <Icon
      className={`w-5 h-5 transition-all ${
        active ? "text-white" : "text-slate-400 group-hover:text-emerald-600"
      }`}
    />
    <span className="flex-1">{label}</span>
    {badge && (
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          active ? "bg-white/20" : "bg-emerald-100 text-emerald-600"
        }`}
      >
        {badge}
      </span>
    )}
    {active && (
      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
    )}
  </Link>
);

const Toast = ({ message, onClose, type = "success" }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 shadow-2xl flex items-center gap-2 px-5 py-3 rounded-xl text-sm ${
        type === "error"
          ? "bg-gradient-to-r from-red-600 to-rose-600 text-white"
          : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
      }`}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      {message}
    </div>
  );
};

const STATUT_CONFIG = {
  en_attente: {
    label: "En attente",
    classes: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  en_cours: {
    label: "En cours",
    classes: "bg-blue-100 text-blue-800",
    dot: "bg-blue-500",
  },
  valide: {
    label: "Validé",
    classes: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
  },
  refuse: {
    label: "Refusé",
    classes: "bg-red-100 text-red-800",
    dot: "bg-red-500",
  },
};

const StatutBadge = ({ statut }) => {
  const cfg = STATUT_CONFIG[statut] || STATUT_CONFIG.en_attente;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const inputStyle =
  "w-full px-4 py-2.5 border-2 border-transparent bg-slate-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all";

const Field = ({ label, children, accent = "emerald" }) => (
  <div className="flex flex-col gap-1.5">
    <label
      className={`text-[9px] font-black text-${accent}-700 uppercase tracking-widest`}
    >
      {label}
    </label>
    {children}
  </div>
);

// ─────────────────────────────────────────────
// MODAL — CRÉER UN DOSSIER
// ─────────────────────────────────────────────

function ModalCreer({ utilisateurs, prestations = [], onClose, onSave }) {
  const [userId, setUserId] = useState("");
  const [modalDetail, setModalDetail] = useState(null);
  const [typePret, setTypePret] = useState("");
  const [dossierRef, setDossierRef] = useState("");
  const [statut, setStatut] = useState("en_attente");
  const [motifRefus, setMotifRefus] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [dateDepot, setDateDepot] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [nomRecherche, setNomRecherche] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUserSearch = (val) => {
    setNomRecherche(val);
    setUserId("");
    if (val.length > 1) {
      setSuggestions(
        utilisateurs.filter((u) =>
          (u.nomComplet || "").toLowerCase().includes(val.toLowerCase())
        )
      );
    } else {
      setSuggestions([]);
    }
  };

  const handleSubmit = async () => {
    if (!userId || !typePret) return;
    if (statut === "refuse" && !motifRefus.trim()) return;
    setIsSubmitting(true);
    await onSave({
      userId: parseInt(userId),
      typePret,
      dossierRef: dossierRef || undefined,
      statut,
      motifRefus: statut === "refuse" ? motifRefus : undefined,
      commentaire: commentaire || undefined,
      dateDepot,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">
              Nouveau Dossier
            </h3>
            <p className="text-emerald-200 text-xs font-bold mt-0.5">
              Créer un statut de dossier de prêt
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-4">
          {/* Bénéficiaire */}
          <Field label="Bénéficiaire *">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white transition-all"
                placeholder="Rechercher le bénéficiaire..."
                value={nomRecherche}
                onChange={(e) => handleUserSearch(e.target.value)}
              />
              {suggestions.length > 0 && (
                <div className="absolute z-30 mt-1 w-full bg-white shadow-xl rounded-xl border border-slate-100 overflow-hidden">
                  {suggestions.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setUserId(u.id);
                        setNomRecherche(
                          `${u.nomComplet} ${u.prenomComplet}`
                        );
                        setSuggestions([]);
                      }}
                      className="p-3 hover:bg-emerald-50 cursor-pointer text-sm font-medium border-b last:border-0"
                    >
                      {u.nomComplet} {u.prenomComplet}{" "}
                      <span className="text-slate-400 text-xs">
                        — {u.departement}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            {/* Type prêt */}
{/* Remplace le select Type de prêt par ceci */}
<Field label="Type de prestations *">
  <select
    value={typePret}
    onChange={(e) => setTypePret(e.target.value)}
    className={inputStyle}
  >
    <option value="">-- Sélectionner --</option>
    {prestations.map((p) => (
      <option key={p.id} value={p.titre}>
        {p.titre}
      </option>
    ))}
  </select>
</Field>

            {/* Statut */}
            <Field label="Statut">
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
                className={inputStyle}
              >
                <option value="en_attente">En attente</option>
                <option value="en_cours">En cours</option>
                <option value="valide">Validé</option>
                <option value="refuse">Refusé</option>
              </select>
            </Field>

            {/* Réf dossier */}
            <Field label="Réf. dossier">
              <input
                value={dossierRef}
                onChange={(e) => setDossierRef(e.target.value)}
                placeholder="ex: PRET-2026-001"
                className={inputStyle}
              />
            </Field>

            {/* Date dépôt */}
            <Field label="Date de dépôt">
              <input
                type="date"
                value={dateDepot}
                onChange={(e) => setDateDepot(e.target.value)}
                className={inputStyle}
              />
            </Field>
          </div>

          {/* Motif refus (conditionnel) */}
          {statut === "refuse" && (
            <Field label="Motif de refus *" accent="red">
              <textarea
                rows={3}
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                placeholder="Motif obligatoire en cas de refus..."
                className="w-full px-4 py-2.5 border-2 border-red-200 bg-red-50 rounded-xl text-sm font-medium outline-none focus:border-red-400 transition-all resize-none"
              />
            </Field>
          )}

          {/* Commentaire */}
          <Field label="Commentaire interne">
            <textarea
              rows={2}
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Note interne du secrétariat..."
              className={inputStyle + " resize-none"}
            />
          </Field>
        </div>

        {/* Pied */}
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-black text-sm hover:bg-slate-50 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              !userId ||
              !typePret ||
              (statut === "refuse" && !motifRefus.trim()) ||
              isSubmitting
            }
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-lg disabled:opacity-30 hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <PlusCircleIcon className="w-4 h-4" />
            {isSubmitting ? "Création..." : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MODAL — MODIFIER LE STATUT
// ─────────────────────────────────────────────

function ModalModifier({ dossier, onClose, onSave }) {
  const [statut, setStatut] = useState(dossier.statut);
  const [motifRefus, setMotifRefus] = useState(dossier.motifRefus || "");
  const [commentaire, setCommentaire] = useState(dossier.commentaire || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (statut === "refuse" && !motifRefus.trim()) return;
    setIsSubmitting(true);
    await onSave(dossier.id, { statut, motifRefus, commentaire });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">
              Modifier le Statut
            </h3>
            <p className="text-blue-200 text-xs font-bold mt-0.5">
              Dossier #{dossier.id} — {dossier.typePret}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Field label="Nouveau statut" accent="blue">
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className={inputStyle}
            >
              <option value="en_attente">En attente</option>
              <option value="en_cours">En cours</option>
              <option value="valide">Validé</option>
              <option value="refuse">Refusé</option>
            </select>
          </Field>

          {statut === "refuse" && (
            <Field label="Motif de refus *" accent="red">
              <textarea
                rows={3}
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                placeholder="Motif obligatoire..."
                className="w-full px-4 py-2.5 border-2 border-red-200 bg-red-50 rounded-xl text-sm font-medium outline-none focus:border-red-400 transition-all resize-none"
              />
            </Field>
          )}

          <Field label="Commentaire" accent="blue">
            <textarea
              rows={2}
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Note interne..."
              className={inputStyle + " resize-none"}
            />
          </Field>
        </div>

        <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-black text-sm hover:bg-slate-50 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              (statut === "refuse" && !motifRefus.trim()) || isSubmitting
            }
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm shadow-lg disabled:opacity-30 hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <CheckIcon className="w-4 h-4" />
            {isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MODAL — DÉTAIL DOSSIER
// ─────────────────────────────────────────────

function ModalDetail({ dossier, user, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">
              Détail du Dossier
            </h3>
            <p className="text-slate-300 text-xs font-bold mt-0.5">
              Réf : {dossier.dossierRef || `#${dossier.id}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Bénéficiaire */}
          {user && (
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-3">
                Bénéficiaire
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                    Nom
                  </p>
                  <p className="font-bold text-slate-800 text-sm">
                    {user.nomComplet}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                    Prénom
                  </p>
                  <p className="font-bold text-slate-800 text-sm">
                    {user.prenomComplet}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                    Département
                  </p>
                  <span className="font-bold text-emerald-700 text-sm bg-emerald-100 inline-block px-3 py-1 rounded-full">
                    {user.departement || "Non spécifié"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Infos dossier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                Type de prestations
              </p>
              <p className="font-bold text-slate-800 text-sm">
                {dossier.typePret}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                Statut
              </p>
              <StatutBadge statut={dossier.statut} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                Date de dépôt
              </p>
              <p className="font-bold text-slate-800 text-sm">
                {dossier.dateDepot
                  ? new Date(dossier.dateDepot).toLocaleDateString("fr-FR")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                Mis à jour par
              </p>
              <p className="font-bold text-slate-800 text-sm">
                {dossier.updatedBy || "—"}
              </p>
            </div>
          </div>

          {/* Motif refus */}
          {dossier.motifRefus && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
              <p className="text-[9px] font-black text-red-700 uppercase tracking-widest mb-1">
                Motif de refus
              </p>
              <p className="text-sm font-medium text-red-800">
                {dossier.motifRefus}
              </p>
            </div>
          )}

          {/* Commentaire */}
          {dossier.commentaire && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Commentaire
              </p>
              <p className="text-sm font-medium text-slate-700">
                {dossier.commentaire}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-black text-sm hover:bg-slate-50 transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────

const FILTRES = [
  { key: "tous", label: "Tous" },
  { key: "en_attente", label: "En attente" },
  { key: "en_cours", label: "En cours" },
  { key: "valide", label: "Validés" },
  { key: "refuse", label: "Refusés" },
];

export default function StatutDossiersPage() {
  const [dossiers, setDossiers] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [filtre, setFiltre] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [toast, setToast] = useState(null);
  const [modalCreer, setModalCreer] = useState(false);
  const [modalModifier, setModalModifier] = useState(null); // dossier courant
  const [modalDetail, setModalDetail] = useState(null); // dossier courant
    const [prestations, setPrestations] = useState([]);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

// Dans le composant, après les autres states :
const [qrModal, setQrModal] = useState(null);

const openQrModal = async (dossier, user) => {
  const url = `https://sgcos.ummto.dz/dossier/${dossier.id}`;
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 200,
    color: { dark: '#1e293b', light: '#ffffff' },
    errorCorrectionLevel: 'H'
  });
  setQrModal({ dossier, user, qrDataUrl });
};
const chargerDonnees = useCallback(async () => {
  try {
    const [usersData, dossiersData, prestationsData] = await Promise.all([
      apiFetch("/users/all"),
      apiFetch("/statut-dossiers"),
      apiFetch("/prestations/all"), // ← AJOUTE
    ]);
    setUtilisateurs(Array.isArray(usersData) ? usersData : usersData?.data ?? usersData?.users ?? []);
    setDossiers(Array.isArray(dossiersData) ? dossiersData : dossiersData?.data ?? dossiersData?.dossiers ?? []);
    setPrestations(Array.isArray(prestationsData) ? prestationsData : prestationsData?.data ?? []); // ← AJOUTE
  } catch (err) {
    console.error(err);
    showToast("Erreur de chargement des données", "error");
  }
}, []);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  // ── Helpers ──────────────────────────────
  const getUser = (userId) => utilisateurs.find((u) => u.id === userId);

  const dossiersFiltres = dossiers
    .filter((d) => filtre === "tous" || d.statut === filtre)
    .filter((d) => {
      if (!recherche) return true;
      const u = getUser(d.userId);
      const nom = u ? `${u.nomComplet} ${u.prenomComplet}`.toLowerCase() : "";
      return (
        nom.includes(recherche.toLowerCase()) ||
        (d.dossierRef || "").toLowerCase().includes(recherche.toLowerCase())
      );
    });

  // ── Stats ─────────────────────────────────
  const stats = [
    { num: dossiers.length, label: "Total dossiers", color: "emerald", icon: "📋" },
    { num: dossiers.filter((d) => d.statut === "en_attente").length, label: "En attente", color: "amber", icon: "⏳" },
    { num: dossiers.filter((d) => d.statut === "en_cours").length, label: "En cours", color: "blue", icon: "🔄" },
    { num: dossiers.filter((d) => d.statut === "valide").length, label: "Validés", color: "emerald", icon: "✅" },
  ];

  const statBg = { emerald: "bg-emerald-50", amber: "bg-amber-50", blue: "bg-blue-50" };

  // ── CRUD handlers ─────────────────────────
const handleCreer = async (payload) => {
  try {
    const res = await apiFetch("/statut-dossiers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    console.log("Réponse POST:", res); // ← et ici
    await chargerDonnees();
    setModalCreer(false);
    showToast("Dossier créé avec succès");
  } catch (err) {
    console.error("Erreur création:", err);
    showToast("Erreur lors de la création", "error");
  }
};

  const handleModifier = async (id, payload) => {
    try {
      await apiFetch(`/statut-dossiers/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      await chargerDonnees();
      setModalModifier(null);
      showToast("Statut mis à jour");
    } catch {
      showToast("Erreur lors de la modification", "error");
    }
  };

  const handleSupprimer = async (id) => {
    if (!confirm("Supprimer ce dossier ?")) return;
    try {
      await apiFetch(`/statut-dossiers/${id}`, { method: "DELETE" });
      await chargerDonnees();
      showToast("Dossier supprimé");
    } catch {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  // ── Menu ──────────────────────────────────


  return (
    <div >
      <style jsx global>{`
        body {
          background: linear-gradient(135deg, #f5f7fa 0%, #f8f9fc 100%);
        }
      `}</style>



      {/* ═══════════════ MAIN ═══════════════ */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR */}
        <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
                  Secrétariat / COS
                </span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>
                  {new Date().toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
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

        {/* HERO */}
        <header className="relative px-8 pt-12 pb-8 overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-transparent" />
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500 rounded-full blur-[100px] opacity-10" />
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-[0.2em] mb-6 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Statut des Dossiers
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Suivi des{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                Prêts
              </span>
            </h2>
            <p className="text-slate-500 text-base max-w-2xl leading-relaxed">
              Gérez et suivez les statuts des dossiers de prêts des bénéficiaires : prêt ...et autres.
            </p>
          </div>
        </header>

        {/* CONTENT */}
        <section className="px-8 pb-16">
          <div className="max-w-6xl mx-auto">

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="group relative overflow-hidden rounded-2xl p-6 bg-white shadow-xl shadow-slate-100 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <div
                        className={`w-12 h-12 rounded-xl ${statBg[s.color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                      >
                        <span className="text-2xl">{s.icon}</span>
                      </div>
                      <div className="text-3xl font-black text-slate-800">{s.num}</div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">
                        {s.label}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* TABLE CARD */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
              {/* En-tête table */}
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-black text-slate-700 text-sm uppercase tracking-wider">
                    Dossiers de Prêts
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={recherche}
                      onChange={(e) => setRecherche(e.target.value)}
                      placeholder="Rechercher..."
                      className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-52"
                    />
                  </div>
                  <button
                    onClick={() => setModalCreer(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all"
                  >
                    <PlusCircleIcon className="w-4 h-4" /> Nouveau dossier
                  </button>
                </div>
              </div>

              {/* Filtres */}
              <div className="flex gap-2 px-6 py-3 bg-slate-50/60 border-b border-slate-100 overflow-x-auto">
                {FILTRES.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFiltre(f.key)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      filtre === f.key
                        ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {f.label}
                    <span
                      className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${
                        filtre === f.key
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {f.key === "tous"
                        ? dossiers.length
                        : dossiers.filter((d) => d.statut === f.key).length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Tableau */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Bénéficiaire", "Type de prêt", "Réf. dossier", "Date dépôt", "Statut", "Mis à jour par", "Actions", "QR"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-5 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {dossiersFiltres.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-14 text-slate-400">
                          <div className="text-4xl mb-3">📂</div>
                          <p className="font-semibold text-sm">Aucun dossier trouvé</p>
                        </td>
                      </tr>
                    ) : (
                      dossiersFiltres.map((d) => {
                        const u = getUser(d.userId);
                        return (
                          <tr
                            key={d.id}
                            className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                          >
                            {/* Bénéficiaire */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                  {u
                                    ? `${u.nomComplet?.[0] || ""}${u.prenomComplet?.[0] || ""}`
                                    : "?"}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 text-xs">
                                    {u
                                      ? `${u.nomComplet} ${u.prenomComplet}`
                                      : `Utilisateur #${d.userId}`}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {u?.departement || ""}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Type */}
                            <td className="px-5 py-3.5">
                              <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                {d.typePret}
                              </span>
                            </td>

                            {/* Réf */}
                            <td className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                              {d.dossierRef || "—"}
                            </td>

                            {/* Date */}
                            <td className="px-5 py-3.5 text-xs text-slate-500">
                              {d.dateDepot
                                ? new Date(d.dateDepot).toLocaleDateString("fr-FR")
                                : "—"}
                            </td>

                            {/* Statut */}
                            <td className="px-5 py-3.5">
                              <StatutBadge statut={d.statut} />
                              {d.motifRefus && (
                                <p
                                  className="text-[10px] text-slate-400 mt-1 max-w-[140px] truncate"
                                  title={d.motifRefus}
                                >
                                  {d.motifRefus}
                                </p>
                              )}
                            </td>

                            {/* Mis à jour */}
                            <td className="px-5 py-3.5 text-xs text-slate-500">
                              {d.updatedBy || "—"}
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setModalDetail(d)}
                                  className="w-7 h-7 bg-white border border-slate-200 text-slate-400 rounded-lg flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition"
                                  title="Voir détails"
                                >
                                  <EyeIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setModalModifier(d)}
                                  className="w-7 h-7 bg-white border border-slate-200 text-slate-400 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition"
                                  title="Modifier statut"
                                >
                                  <PencilIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleSupprimer(d.id)}
                                  className="w-7 h-7 bg-white border border-slate-200 text-slate-400 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                                  title="Supprimer"
                                >
                                  <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
  onClick={() => openQrModal(d, u)}
  className="w-7 h-7 bg-white border border-slate-200 text-slate-400 rounded-lg flex items-center justify-center hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition"
  title="QR Code dossier"
>
  <QrCodeIcon className="w-3.5 h-3.5" />
</button>
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
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-auto border-t border-slate-100 py-6 bg-white">
          <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-[10px] tracking-widest uppercase font-medium">
              © 2026 SG/COS-UMMTO • Université Mouloud Mammeri Tizi-Ouzou
            </p>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <div className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
          </div>
        </footer>
      </main>
{qrModal && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    onClick={() => setQrModal(null)}
  >
    <div
      className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">QR Dossier</h3>
          <p className="text-violet-200 text-xs font-bold mt-0.5">
            Réf : {qrModal.dossier.dossierRef || `#${qrModal.dossier.id}`}
          </p>
        </div>
        <button onClick={() => setQrModal(null)} className="p-2 hover:bg-white/10 rounded-full text-white">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Corps */}
      <div className="p-6 flex flex-col items-center gap-4">
        {/* QR Code */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-inner">
          <img src={qrModal.qrDataUrl} alt="QR Code" className="w-44 h-44" />
        </div>

        {/* Infos bénéficiaire */}
        <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 text-center">
          <p className="font-black text-slate-800 text-sm">
            {qrModal.user ? `${qrModal.user.prenomComplet} ${qrModal.user.nomComplet}` : `#${qrModal.dossier.userId}`}
          </p>
          <p className="text-xs text-slate-500 mt-1">{qrModal.user?.departement || ''}</p>
          <div className="flex justify-center gap-2 mt-2">
            <span className="px-2 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 uppercase">
              {qrModal.dossier.typePret}
            </span>
            <StatutBadge statut={qrModal.dossier.statut} />
          </div>
        </div>

        <p className="text-[10px] text-slate-400 text-center">
          Scanner pour accéder au dossier en ligne
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-2 border-t border-slate-100">
        <button
          onClick={() => setQrModal(null)}
          className="w-full py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-black text-sm hover:bg-slate-50 transition-all"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
)}
      {/* ═══════════════ MODALES ═══════════════ */}
{modalCreer && (
  <ModalCreer
    utilisateurs={utilisateurs}
    prestations={prestations} // ← AJOUTE
    onClose={() => setModalCreer(false)}
    onSave={handleCreer}
  />
)}

      {modalModifier && (
        <ModalModifier
          dossier={modalModifier}
          onClose={() => setModalModifier(null)}
          onSave={handleModifier}
        />
      )}

      {modalDetail && (
        <ModalDetail
          dossier={modalDetail}
          user={getUser(modalDetail.userId)}
          onClose={() => setModalDetail(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}