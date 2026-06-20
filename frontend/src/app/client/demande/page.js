"use client";
import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "../../../lib/api";
import {
  Send, Clock, CheckCircle, XCircle, FileText,
  Upload, X, Paperclip, Eye, RefreshCw, User, Users,
  Download, Bell, Shield
} from "lucide-react";
import ChatPanel from "../../../components/ChatPanel";

const API_BASE = "http://localhost:5001/api";

// ─── BADGE STATUT ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    "En attente": "bg-amber-100 text-amber-700 border-amber-300",
    "Validée":    "bg-emerald-100 text-emerald-700 border-emerald-300",
    "Rejetée":    "bg-red-100 text-red-700 border-red-300",
  };
  const icons = {
    "En attente": <Clock size={11} />,
    "Validée":    <CheckCircle size={11} />,
    "Rejetée":    <XCircle size={11} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {icons[status]} {status}
    </span>
  );
}

// ─── CHAMP FORMULAIRE ─────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-[160px_1fr] sm:items-start gap-1.5 sm:gap-4 py-3.5 border-b border-slate-100 last:border-0">
      <label className="text-xs sm:text-sm text-slate-500 sm:pt-2.5 leading-tight font-medium">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div>{children}</div>
    </div>
  );
}

const inputCls  = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition placeholder-slate-400 bg-white shadow-sm";
const selectCls = `${inputCls} cursor-pointer`;
const inputErrCls  = "w-full border border-red-400 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition placeholder-slate-400 bg-red-50/30 shadow-sm";
const selectErrCls = `${inputErrCls} cursor-pointer`;

// ─── VALIDATION ───────────────────────────────────────────────────────────────
const REGEX_TEL_DZ = /^0[5-7][0-9]{8}$/;                 // ex: 0551234567 (10 chiffres)
const REGEX_NOM    = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]{2,50}$/;     // lettres, accents, espaces, tirets, apostrophes
const REGEX_LIEU   = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s'-]{2,80}$/;  // idem + chiffres (ex: "Alger 16")
const MAX_FILE_MB  = 10;

function calcAge(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return <p className="text-[11px] text-red-600 font-semibold mt-1">{msg}</p>;
}

// Ne garde que les chiffres, limité à 10 caractères (saisie en temps réel)
function sanitizeTelInput(raw) {
  return raw.replace(/[^0-9]/g, "").slice(0, 10);
}

// Message d'erreur détaillé pour un numéro de téléphone algérien
function validateTelDZ(value) {
  const v = value.trim();
  if (!v) return "Le téléphone est obligatoire.";
  if (/[^0-9]/.test(v)) return "Le numéro ne doit contenir que des chiffres.";
  if (v.length < 10) return `Numéro incomplet (${v.length}/10 chiffres).`;
  if (v.length > 10) return "Le numéro ne doit pas dépasser 10 chiffres.";
  if (!/^0/.test(v)) return "Le numéro doit commencer par 0.";
  if (!/^0[5-7]/.test(v)) return "Indicatif invalide. Le numéro doit commencer par 05, 06 ou 07.";
  if (!REGEX_TEL_DZ.test(v)) return "Numéro invalide. Format attendu : 0[5-7]XXXXXXXX.";
  return "";
}

// ─── ZONE UPLOAD ──────────────────────────────────────────────────────────────
function FileUploadZone({ files, onChange }) {
  const inputRef = useRef(null);
  const handleDrop = (e) => { e.preventDefault(); onChange([...files, ...Array.from(e.dataTransfer.files)]); };
  const handleAdd  = (e) => { onChange([...files, ...Array.from(e.target.files)]); e.target.value = ""; };
  const removeFile = (i) => onChange(files.filter((_, idx) => idx !== i));
  const getIcon    = (f) => f.type.startsWith("image/") ? "🖼️" : f.type === "application/pdf" ? "📄" : "📎";
  const fmtSize    = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/40 transition-all group active:bg-emerald-50/60"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-2.5 shadow-md group-hover:shadow-emerald-500/25 transition-shadow">
          <Upload size={18} className="text-white" />
        </div>
        <p className="text-sm text-slate-500 group-hover:text-emerald-700 font-medium">
          <span className="hidden sm:inline">Glissez vos fichiers ici ou </span>
          <span className="text-emerald-600 font-bold underline">Parcourir les fichiers</span>
        </p>
        <p className="text-[11px] text-slate-400 mt-1">PDF, JPG, PNG</p>
        <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleAdd} className="hidden" />
      </div>
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <span className="text-base shrink-0">{getIcon(file)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">{file.name}</p>
                <p className="text-[10px] text-slate-400">{fmtSize(file.size)}</p>
              </div>
              <button type="button" onClick={() => removeFile(i)} className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors shrink-0">
                <X size={13} />
              </button>
            </div>
          ))}
          <p className="text-[11px] text-slate-400 text-right">{files.length} fichier{files.length > 1 ? "s" : ""} sélectionné{files.length > 1 ? "s" : ""}</p>
        </div>
      )}
    </div>
  );
}

// ─── MODAL PIÈCES ─────────────────────────────────────────────────────────────
function PiecesModal({ pieces, onClose }) {
  if (!pieces?.length) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-slate-200 p-5 w-full sm:max-w-sm mx-0 sm:mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-sm">Documents ({pieces.length})</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X size={18} /></button>
        </div>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {pieces.map((p, i) => (
            <div key={i} className="border border-slate-100 rounded-xl p-2 bg-slate-50">
              {p.type?.includes("image") ? (
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 truncate">{p.nom}</p>
                  <img src={p.data} alt={p.nom} className="w-full h-auto rounded-lg shadow-sm object-cover max-h-48" />
                </div>
              ) : (
                <a href={p.data} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-emerald-600 hover:underline p-2">
                  <Paperclip size={14} /> {p.nom || "Voir le document"}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MODAL PEC ────────────────────────────────────────────────────────────────
function PECModal({ demande, onClose }) {
  if (!demande?.fichier_prise_en_charge) return null;

  const url = demande.fichier_prise_en_charge.startsWith("http")
    ? demande.fichier_prise_en_charge
    : `http://localhost:5001/${demande.fichier_prise_en_charge.replace(/^\//, "")}`;

 const isPdf =
  url.toLowerCase().includes(".pdf") ||
  demande.fichier_prise_en_charge.toLowerCase().includes("pdf");
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg mx-0 sm:mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm">Votre Prise en Charge</p>
              <p className="text-white/60 text-[11px]">{demande.type_prestation}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
          >
            <X size={15} />
          </button>
        </div>

        {/* Infos dossier */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-slate-400 font-bold uppercase text-[9px] mb-0.5">Bénéficiaire</p>
            <p className="font-bold text-slate-800">{demande.nom_beneficiaire}</p>
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase text-[9px] mb-0.5">Dossier</p>
            <p className="font-bold text-slate-800 font-mono">#{demande.id}</p>
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase text-[9px] mb-0.5">Prestation</p>
            <p className="font-semibold text-slate-700">{demande.type_prestation}</p>
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase text-[9px] mb-0.5">Statut</p>
            <StatusBadge status={demande.statut} />
          </div>
          {demande.message_admin && (
            <div className="col-span-2 bg-indigo-50 border border-indigo-100 rounded-xl p-2.5">
              <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Note de la structure</p>
              <p className="text-xs text-indigo-800 italic">"{demande.message_admin}"</p>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="p-4">
          {isPdf ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-3">
                <FileText size={22} className="text-red-500" />
              </div>
              <p className="text-sm font-bold text-slate-700 mb-0.5">Document PDF</p>
              <p className="text-[11px] text-slate-400 mb-4">Votre prise en charge officielle est prête</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-500/25"
              >
                <Eye size={15} /> Ouvrir le document
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <img
                src={url}
                alt="Prise en charge"
                className="w-full rounded-xl border border-slate-200 shadow-sm object-contain max-h-64"
              />
            </div>
          )}
        </div>

        {/* Bouton télécharger */}
        <div className="px-4 pb-4">
          <a
            href={url}
            download={`PEC_${demande.id}_${demande.nom_beneficiaire || ""}.pdf`}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-500/25"
          >
            <Download size={16} /> Télécharger la Prise en Charge
          </a>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            Conservez ce document — il est requis lors de votre consultation.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── CARTE DEMANDE (mobile) ───────────────────────────────────────────────────
function DemandeCard({ d, onViewPieces, onViewPEC }) {
  let pieces = [];
  try {
    if (d.pieces) pieces = typeof d.pieces === "string" ? JSON.parse(d.pieces) : d.pieces;
  } catch { pieces = []; }

  const isValidee = d.statut === "Validée";
  const isRejetee = d.statut === "Rejetée";
  const hasPEC    = !!d.fichier_prise_en_charge;

  return (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-sm shadow-slate-200 overflow-hidden border-l-4 ${
      hasPEC ? "border-l-indigo-500" :
      isValidee ? "border-l-emerald-500" : isRejetee ? "border-l-red-400" : "border-l-amber-400"
    }`}>
      <div className="p-4">
        {/* Header carte */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 font-mono">#{d.id}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="font-bold text-slate-800 text-sm">{d.nom_beneficiaire}</p>
              {hasPEC && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{d.type_prestation}</p>
            <p className="text-[10px] text-slate-300 mt-0.5">
              {new Date(d.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
          <StatusBadge status={d.statut} />
        </div>

        {/* Bannière PEC disponible */}
        {hasPEC && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2.5 mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-indigo-600 shrink-0" />
              <div>
                <p className="text-xs font-black text-indigo-800">Prise en charge disponible</p>
                <p className="text-[10px] text-indigo-500">Cliquez pour consulter votre document</p>
              </div>
            </div>
            <button
              onClick={() => onViewPEC(d)}
              className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
            >
              <Download size={11} /> PEC
            </button>
          </div>
        )}

        {/* Message décision */}
        {d.statut !== "En attente" && !hasPEC && (
          <div className={`text-xs rounded-xl px-3 py-2 mb-3 ${isValidee ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-red-50 text-red-800 border border-red-100"}`}>
            <p className="font-bold mb-0.5">{isValidee ? "✅ Acceptée" : "❌ Refusée"}</p>
            {d.message_admin
              ? <p className="text-[11px] leading-relaxed italic">"{d.message_admin}"</p>
              : <p className="text-[10px] opacity-60">{isValidee ? "Rapprochez-vous de la structure." : "Aucun motif précisé."}</p>}
          </div>
        )}

        {isRejetee && (d.motif_refus || d.motifRefus) && (
          <p className="text-xs text-red-700 font-medium mb-3">{d.motif_refus || d.motifRefus}</p>
        )}

        {pieces.length > 0 && (
          <button
            onClick={() => onViewPieces(pieces)}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition"
          >
            <Eye size={12} /> {pieces.length} fichier{pieces.length > 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function DemandePage() {
  const [activeTab, setActiveTab]           = useState("form");
  const [demandes, setDemandes]             = useState([]);
  const [fetchLoading, setFetchLoading]     = useState(false);
  const [submitLoading, setSubmitLoading]   = useState(false);
  const [submitMsg, setSubmitMsg]           = useState({ text: "", type: "" });
  const [errors, setErrors]                 = useState({});
  const [selectedPieces, setSelectedPieces] = useState(null);
  const [selectedPEC, setSelectedPEC]       = useState(null); // ← nouveau
  const [captchaSvg, setCaptchaSvg]         = useState("");
  const [userCaptcha, setUserCaptcha]       = useState("");
  const [prenom, setPrenom]                 = useState("");
  const [nom, setNom]                       = useState("");
  const [sexe, setSexe]                     = useState("");
  const [telephone, setTelephone]           = useState("");
  const [dateNaiss, setDateNaiss]           = useState("");
  const [lieuNaissance, setLieuNaissance]   = useState("");
  const [fonction, setFonction]             = useState("");
  const [prestation, setPrestation]         = useState("");
  const [fichiers, setFichiers]             = useState([]);
  const [typesPrestations, setTypesPrestations] = useState([]);
  const [etablissement, setEtablissement]   = useState("");
  const [listeCliniques, setListeCliniques] = useState([]);
  const [pourQui, setPourQui]               = useState("moi");
  const [ayantPrenom, setAyantPrenom]       = useState("");
  const [ayantNom, setAyantNom]             = useState("");
  const [ayantLien, setAyantLien]           = useState("");
  const [ayantDateNaiss, setAyantDateNaiss] = useState("");
  const [ayantTelephone, setAyantTelephone] = useState("");

  const refreshCaptcha = async () => {
    try {
      const res = await fetch(`${API_BASE}/captcha`);
      if (!res.ok) throw new Error();
      setCaptchaSvg(await res.text());
    } catch { console.error("Captcha indisponible"); }
  };

  useEffect(() => { refreshCaptcha(); }, []);

  const resetForm = () => {
    setPrenom(""); setNom(""); setSexe(""); setTelephone("");
    setDateNaiss(""); setLieuNaissance(""); setFonction(""); setPrestation(""); setFichiers([]);
    setEtablissement("");
    setPourQui("moi"); setAyantPrenom(""); setAyantNom(""); setAyantLien("");
    setAyantDateNaiss(""); setAyantTelephone("");
    setUserCaptcha(""); setSubmitMsg({ text: "", type: "" }); setErrors({});
  };

  const fetchDemandes = async () => {
    setFetchLoading(true);
    try {
      const data = await apiFetch("/demandes");
      const list = Array.isArray(data) ? data
        : Array.isArray(data?.demandes) ? data.demandes
        : Array.isArray(data?.data) ? data.data : [];
      setDemandes(list);
    } catch (e) { console.error("Erreur fetch demandes:", e); }
    finally { setFetchLoading(false); }
  };

// Remplace l'useEffect existant
useEffect(() => {
  if (activeTab === "list") {
    fetchDemandes();
    // ✅ Vérifie toutes les 15 secondes si une PEC est disponible
    const interval = setInterval(fetchDemandes, 15000);
    return () => clearInterval(interval);
  }
}, [activeTab]);
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const data = await apiFetch("/typesprestations");
        setTypesPrestations(Array.isArray(data) ? data : data?.data || []);
      } catch { setTypesPrestations([]); }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const data = await apiFetch("/clinics/all");
        setListeCliniques(Array.isArray(data) ? data : data?.data || []);
      } catch { setListeCliniques([]); }
    };
    fetchClinics();
  }, []);

  const validateForm = () => {
    const errs = {};

    // Bénéficiaire
    if (!prenom.trim()) errs.prenom = "Le prénom est obligatoire.";
    else if (!REGEX_NOM.test(prenom.trim())) errs.prenom = "Le prénom ne doit contenir que des lettres.";

    if (!nom.trim()) errs.nom = "Le nom est obligatoire.";
    else if (!REGEX_NOM.test(nom.trim())) errs.nom = "Le nom ne doit contenir que des lettres.";

    // Téléphone (algérien strict : 0[5-7]XXXXXXXX, 10 chiffres)
    const telErr = validateTelDZ(telephone);
    if (telErr) errs.telephone = telErr;

    // Date de naissance
    if (!dateNaiss) errs.dateNaiss = "La date de naissance est obligatoire.";
    else {
      const age = calcAge(dateNaiss);
      if (new Date(dateNaiss) > new Date()) errs.dateNaiss = "La date ne peut pas être dans le futur.";
      else if (age === null || age < 16 || age > 100) errs.dateNaiss = "Âge invalide (doit être entre 16 et 100 ans).";
    }

    // Lieu de naissance
    if (!lieuNaissance.trim()) errs.lieuNaissance = "Le lieu de naissance est obligatoire.";
    else if (!REGEX_LIEU.test(lieuNaissance.trim())) errs.lieuNaissance = "Lieu de naissance invalide.";

    // Prestation / établissement
    if (!prestation) errs.prestation = "Le type de prestation est obligatoire.";
    if (!etablissement) errs.etablissement = "L'établissement est obligatoire.";

    // Fichiers
    if (fichiers.length === 0) errs.fichiers = "Ajoutez au moins un document.";
    else {
      const tropLourd = fichiers.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
      if (tropLourd) errs.fichiers = `"${tropLourd.name}" dépasse ${MAX_FILE_MB} Mo. Réduisez la taille du fichier.`;
    }

    // Captcha
    if (!userCaptcha.trim()) errs.userCaptcha = "Veuillez saisir le code de vérification.";

    // Ayant droit
    if (pourQui === "autre") {
      if (!ayantPrenom.trim()) errs.ayantPrenom = "Le prénom est obligatoire.";
      else if (!REGEX_NOM.test(ayantPrenom.trim())) errs.ayantPrenom = "Lettres uniquement.";

      if (!ayantNom.trim()) errs.ayantNom = "Le nom est obligatoire.";
      else if (!REGEX_NOM.test(ayantNom.trim())) errs.ayantNom = "Lettres uniquement.";

      if (!ayantLien) errs.ayantLien = "Le lien de parenté est obligatoire.";

      if (!ayantDateNaiss) errs.ayantDateNaiss = "La date de naissance est obligatoire.";
      else if (new Date(ayantDateNaiss) > new Date()) errs.ayantDateNaiss = "La date ne peut pas être dans le futur.";

      if (!ayantTelephone.trim()) errs.ayantTelephone = "Le téléphone est obligatoire.";
      else {
        const ayantTelErr = validateTelDZ(ayantTelephone);
        if (ayantTelErr) errs.ayantTelephone = ayantTelErr;
      }
    }

    return errs;
  };

  const handleSubmit = async () => {
    const errs = validateForm();
    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      setSubmitMsg({ text: "⚠️ Merci de corriger les champs en rouge avant de soumettre.", type: "error" });
      return;
    }

    setSubmitLoading(true);
    setSubmitMsg({ text: "", type: "" });
    const fd = new FormData();
    fd.append("nom_beneficiaire", `${prenom.trim()} ${nom.trim()}`);
    fd.append("type_prestation", prestation);
    fd.append("fonction", fonction || "Personnel");
    fd.append("sexe", sexe);
    fd.append("telephone", telephone.trim());
    fd.append("date_naissance", dateNaiss);
    fd.append("lieu_naissance", lieuNaissance.trim());
    fd.append("etablissement", etablissement);
    fd.append("captcha", userCaptcha);
    fichiers.forEach((f) => fd.append("ordonnance", f));
    fd.append("pour_qui", pourQui);
    if (pourQui === "autre") {
      fd.append("ayant_prenom",     ayantPrenom.trim());
      fd.append("ayant_nom",        ayantNom.trim());
      fd.append("ayant_lien",       ayantLien);
      fd.append("ayant_date_naiss", ayantDateNaiss);
      fd.append("ayant_telephone",  ayantTelephone.trim());
    }
    try {
      await apiFetch("/demandes/ajouter", { method: "POST", body: fd });
      setSubmitMsg({ text: "✅ Dossier envoyé avec succès !", type: "success" });
      resetForm();
      refreshCaptcha();
    } catch {
      setSubmitMsg({ text: "❌ Erreur serveur. Vérifiez le captcha et réessayez.", type: "error" });
      refreshCaptcha();
    } finally { setSubmitLoading(false); }
  };

  const nbEnAttente  = demandes.filter((d) => d.statut === "En attente").length;
  const nbValidees   = demandes.filter((d) => d.statut === "Validée").length;
  const nbRejetees   = demandes.filter((d) => d.statut === "Rejetée").length;
  const nbPECDispo   = demandes.filter((d) => !!d.fichier_prise_en_charge).length;

  const tabs = [
    { key: "form", label: "Formulaire" },
    { key: "list", label: "Mes Demandes", badge: nbEnAttente },
    { key: "chat", label: "Messagerie" },
  ];

  return (
    <div className="min-h-screen font-sans bg-slate-50">

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-slate-100 shadow-sm shadow-slate-200 px-3 sm:px-6 py-2.5 flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {tabs.map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === key
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            {label}
            {badge > 0 && (
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                activeTab === key ? "bg-white/30 text-white" : "bg-red-500 text-white"
              }`}>{badge}</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-3 sm:p-5 lg:p-6">

        {/* ── FORMULAIRE ── */}
        {activeTab === "form" && (
          <div className="bg-white rounded-2xl shadow-sm shadow-slate-200 border border-slate-100 overflow-hidden max-w-3xl">
            {/* Pour qui ? */}
            <div className="px-4 sm:px-8 py-4 bg-slate-50/60 border-b border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">La demande est pour</p>
              <div className="flex gap-2">
                {[
                  { key: "moi",   label: "Moi-même",      icon: <User size={15}/> },
                  { key: "autre", label: "Un ayant droit", icon: <Users size={15}/> },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPourQui(key)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${
                      pourQui === key
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Infos ayant droit */}
            {pourQui === "autre" && (
              <div className="px-4 sm:px-8 py-4 border-b border-slate-100 bg-amber-50/40">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Informations de l'ayant droit</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input type="text" placeholder="Prénom *" value={ayantPrenom} onChange={e => setAyantPrenom(e.target.value)} className={errors.ayantPrenom ? inputErrCls : inputCls} />
                    <ErrorMsg msg={errors.ayantPrenom} />
                  </div>
                  <div>
                    <input type="text" placeholder="Nom *"    value={ayantNom}    onChange={e => setAyantNom(e.target.value)}    className={errors.ayantNom ? inputErrCls : inputCls} />
                    <ErrorMsg msg={errors.ayantNom} />
                  </div>
                  <div>
                    <select value={ayantLien} onChange={e => setAyantLien(e.target.value)} className={errors.ayantLien ? selectErrCls : selectCls}>
                      <option value="">Lien de parenté *</option>
                      <option>Conjoint(e)</option>
                      <option>Enfant</option>
                      <option>Père / Mère</option>
                      <option>Autre</option>
                    </select>
                    <ErrorMsg msg={errors.ayantLien} />
                  </div>
                  <div>
                    <input type="date" value={ayantDateNaiss} onChange={e => setAyantDateNaiss(e.target.value)} className={errors.ayantDateNaiss ? inputErrCls : inputCls} />
                    <ErrorMsg msg={errors.ayantDateNaiss} />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="Téléphone *"
                      value={ayantTelephone}
                      onChange={(e) => {
                        const cleaned = sanitizeTelInput(e.target.value);
                        setAyantTelephone(cleaned);
                        setErrors((prev) => ({ ...prev, ayantTelephone: validateTelDZ(cleaned) || undefined }));
                      }}
                      onKeyDown={(e) => {
                        if (["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)) return;
                        if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                      }}
                      maxLength={10}
                      className={errors.ayantTelephone ? inputErrCls : inputCls}
                    />
                    <ErrorMsg msg={errors.ayantTelephone} />
                  </div>
                </div>
              </div>
            )}

            {/* En-tête */}
            <div className="px-4 sm:px-8 pt-6 pb-4 border-b border-slate-100 flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl blur-md opacity-40" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <FileText size={18} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">Formulaire de Demande de Prise en Charge</h1>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">Un responsable examinera votre dossier dans les meilleurs délais.</p>
              </div>
            </div>

            {/* Champs */}
            <div className="px-4 sm:px-8 py-2">
              <Field label="Nom du Bénéficiaire" required>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" className={errors.prenom ? inputErrCls : inputCls} />
                    <ErrorMsg msg={errors.prenom} />
                  </div>
                  <div className="flex-1">
                    <input type="text" value={nom}    onChange={(e) => setNom(e.target.value)}    placeholder="Nom"    className={errors.nom ? inputErrCls : inputCls} />
                    <ErrorMsg msg={errors.nom} />
                  </div>
                </div>
              </Field>
              <Field label="Sexe">
                <select value={sexe} onChange={(e) => setSexe(e.target.value)} className={selectCls}>
                  <option value="">Sélectionner...</option>
                  <option>Masculin</option><option>Féminin</option>
                </select>
              </Field>
              <Field label="Téléphone" required>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={telephone}
                  onChange={(e) => {
                    const cleaned = sanitizeTelInput(e.target.value);
                    setTelephone(cleaned);
                    setErrors((prev) => ({ ...prev, telephone: validateTelDZ(cleaned) || undefined }));
                  }}
                  onKeyDown={(e) => {
                    if (["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)) return;
                    if (!/^[0-9]$/.test(e.key)) e.preventDefault();
                  }}
                  placeholder="0X XX XX XX XX"
                  maxLength={10}
                  className={errors.telephone ? inputErrCls : inputCls}
                />
                <ErrorMsg msg={errors.telephone} />
              </Field>
              <Field label="Date de Naissance" required>
                <input type="date" value={dateNaiss} onChange={(e) => setDateNaiss(e.target.value)} className={errors.dateNaiss ? inputErrCls : inputCls} />
                <ErrorMsg msg={errors.dateNaiss} />
              </Field>
              <Field label="Lieu de Naissance" required>
                <input type="text" placeholder="Lieu de naissance" value={lieuNaissance} onChange={(e) => setLieuNaissance(e.target.value)} className={errors.lieuNaissance ? inputErrCls : inputCls} />
                <ErrorMsg msg={errors.lieuNaissance} />
              </Field>
              <Field label="Fonction">
                <select value={fonction} onChange={(e) => setFonction(e.target.value)} className={selectCls}>
                  <option value="">Sélectionner...</option>
                  <option>ATS</option><option>ENSEIGNANT</option><option>RETRAITE</option>
                </select>
              </Field>
              <Field label="Type de Prestation" required>
                <select value={prestation} onChange={(e) => setPrestation(e.target.value)} className={errors.prestation ? selectErrCls : selectCls}>
                  <option value="">Sélectionner...</option>
                  {typesPrestations.map((p) => (
                    <option key={p.id} value={p.nom}>{p.nom}</option>
                  ))}
                </select>
                <ErrorMsg msg={errors.prestation} />
              </Field>
              <Field label="Établissement" required>
                <select value={etablissement} onChange={(e) => setEtablissement(e.target.value)} className={errors.etablissement ? selectErrCls : selectCls}>
                  <option value="">Choisir un établissement...</option>
                  {listeCliniques.map((c) => (
                    <option key={c.id} value={c.nom}>{c.nom}</option>
                  ))}
                </select>
                <ErrorMsg msg={errors.etablissement} />
              </Field>
              <Field label="Documents" required>
                <FileUploadZone files={fichiers} onChange={setFichiers} />
                <ErrorMsg msg={errors.fichiers} />
                <p className="text-[11px] text-slate-400 mt-2">Ordonnance, résultats d'analyses, devis, etc. (Max {MAX_FILE_MB} Mo / fichier)</p>
              </Field>
            </div>

            {/* Captcha */}
            <div className="mx-4 sm:mx-8 mb-4 p-4 border border-slate-100 bg-slate-50/60 rounded-xl">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Vérification de sécurité</label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div
                  className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm cursor-pointer select-none w-full sm:w-auto flex justify-center hover:border-emerald-300 transition"
                  dangerouslySetInnerHTML={{ __html: captchaSvg }}
                  onClick={refreshCaptcha}
                  title="Cliquer pour changer"
                />
                <div className="flex-1 w-full space-y-1">
                  <input
                    type="text"
                    placeholder="Entrez le code ci-dessus"
                    className={errors.userCaptcha ? inputErrCls : inputCls}
                    value={userCaptcha}
                    onChange={(e) => setUserCaptcha(e.target.value)}
                  />
                  <ErrorMsg msg={errors.userCaptcha} />
                  <p className="text-[10px] text-slate-400">Cliquez sur l'image pour en générer un nouveau.</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 sm:px-8 py-5 bg-slate-50/60 border-t border-slate-100">
              {submitMsg.text && (
                <div className={`mb-4 p-3 rounded-xl text-sm font-medium border ${
                  submitMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}>{submitMsg.text}</div>
              )}
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <button type="button" onClick={resetForm}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition w-full sm:w-auto">
                  Réinitialiser
                </button>
                <button type="button" onClick={handleSubmit} disabled={submitLoading}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 w-full sm:w-auto">
                  {submitLoading
                    ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Envoi...</>
                    : <><Send size={15} /> Soumettre le Dossier</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── LISTE DES DEMANDES ── */}
        {activeTab === "list" && (
          <div className="max-w-5xl">

            {/* Bannière PEC disponible */}
            {nbPECDispo > 0 && (
              <div className="mb-4 flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-black text-indigo-800">
                    {nbPECDispo} prise{nbPECDispo > 1 ? "s" : ""} en charge disponible{nbPECDispo > 1 ? "s" : ""}
                  </p>
                  <p className="text-[10px] text-indigo-500 mt-0.5">
                    Cliquez sur le bouton <strong>PEC</strong> pour consulter et télécharger votre document officiel.
                  </p>
                </div>
                <Bell size={16} className="text-indigo-400 shrink-0" />
              </div>
            )}

            {/* Stats */}
            {demandes.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                {[
                  { label: "En attente", val: nbEnAttente, cls: "text-amber-600 border-amber-200 bg-amber-50" },
                  { label: "Validées",   val: nbValidees,  cls: "text-emerald-600 border-emerald-200 bg-emerald-50" },
                  { label: "Refusées",   val: nbRejetees,  cls: "text-red-600 border-red-200 bg-red-50" },
                ].map(({ label, val, cls }) => (
                  <div key={label} className={`rounded-xl p-3 sm:p-4 text-center shadow-sm border ${cls}`}>
                    <p className={`text-xl sm:text-2xl font-black ${cls.split(" ")[0]}`}>{val}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Suivi de mes dossiers</h2>
              <button onClick={fetchDemandes} className="flex items-center gap-1 text-xs text-emerald-600 font-bold hover:underline">
                <RefreshCw size={12} /> Actualiser
              </button>
            </div>

            {fetchLoading ? (
              <div className="text-center py-16 text-slate-400">
                <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
                Chargement...
              </div>
            ) : demandes.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm shadow-slate-200 border border-slate-100 text-center py-16 text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/25">
                  <FileText size={24} className="text-white" />
                </div>
                <p className="font-bold text-sm text-slate-600">Aucune demande soumise pour le moment.</p>
                <button onClick={() => setActiveTab("form")} className="mt-3 text-emerald-600 text-sm font-bold underline">
                  Soumettre un dossier →
                </button>
              </div>
            ) : (
              <>
                {/* Mobile : cartes */}
                <div className="sm:hidden space-y-3">
                  {demandes.map((d) => (
                    <DemandeCard
                      key={d.id}
                      d={d}
                      onViewPieces={setSelectedPieces}
                      onViewPEC={setSelectedPEC}
                    />
                  ))}
                </div>

                {/* Desktop : table */}
                <div className="hidden sm:block bg-white rounded-2xl shadow-sm shadow-slate-200 border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {["#", "Bénéficiaire / Type", "Décision", "Pièces", "PEC", "État", "Motif"].map((h) => (
                            <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {demandes.map((d) => {
                          let pieces = [];
                          try {
                            if (d.pieces) pieces = typeof d.pieces === "string" ? JSON.parse(d.pieces) : d.pieces;
                          } catch { pieces = []; }
                          const isValidee = d.statut === "Validée";
                          const isRejetee = d.statut === "Rejetée";
                          const hasPEC    = !!d.fichier_prise_en_charge;
                          return (
                            <tr
                              key={d.id}
                              className={`hover:bg-slate-50 transition border-l-4 ${
                                hasPEC    ? "border-l-indigo-500" :
                                isValidee ? "border-l-emerald-500" :
                                isRejetee ? "border-l-red-400" : "border-l-amber-400"
                              }`}
                            >
                              <td className="px-4 py-3 text-[11px] text-slate-400 font-bold font-mono">#{d.id}</td>

                              {/* Nom + point animé si PEC */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <div>
                                    <p className="font-semibold text-slate-800">{d.nom_beneficiaire}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{d.type_prestation}</p>
                                    <p className="text-[10px] text-slate-300 mt-0.5">
                                      {new Date(d.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                                    </p>
                                  </div>
                                  {hasPEC && (
                                    <span className="relative flex h-2.5 w-2.5 ml-1 shrink-0">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Décision */}
                              <td className="px-4 py-3 max-w-[200px]">
                                {d.statut !== "En attente" ? (
                                  <div className={`text-xs rounded-xl px-3 py-2 ${isValidee ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-red-50 text-red-800 border border-red-100"}`}>
                                    <p className="font-bold mb-1">{isValidee ? "✅ Acceptée" : "❌ Refusée"}</p>
                                    {d.message_admin
                                      ? <p className="text-[11px] leading-relaxed italic">"{d.message_admin}"</p>
                                      : <p className="text-[10px] opacity-60">{isValidee ? "Rapprochez-vous de la structure." : "Aucun motif précisé."}</p>}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 italic flex items-center gap-1">
                                    <Clock size={12} /> Examen en cours...
                                  </span>
                                )}
                              </td>

                              {/* Pièces jointes */}
                              <td className="px-4 py-3 text-center">
                                {pieces.length > 0
                                  ? <button onClick={() => setSelectedPieces(pieces)} className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition">
                                      <Eye size={12} /> {pieces.length}
                                    </button>
                                  : <span className="text-xs text-slate-300">—</span>}
                              </td>

                              {/* ── COLONNE PEC ── */}
                              <td className="px-4 py-3 text-center">
                                {hasPEC ? (
                                  <button
                                    onClick={() => setSelectedPEC(d)}
                                    className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition"
                                  >
                                    <Download size={12} /> PEC
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-300">—</span>
                                )}
                              </td>

                              <td className="px-4 py-3 text-center"><StatusBadge status={d.statut} /></td>
                              <td className="px-4 py-3 max-w-[160px]">
                                {isRejetee && (d.motif_refus || d.motifRefus)
                                  ? <span className="text-xs text-red-700 font-medium">{d.motif_refus || d.motifRefus}</span>
                                  : <span className="text-xs text-slate-300">—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── MESSAGERIE ── */}
        {activeTab === "chat" && <ChatPanel />}

      </div>

      {/* ── MODALS ── */}
      {selectedPieces && <PiecesModal pieces={selectedPieces} onClose={() => setSelectedPieces(null)} />}
      {selectedPEC    && <PECModal    demande={selectedPEC}   onClose={() => setSelectedPEC(null)} />}
    </div>
  );
}