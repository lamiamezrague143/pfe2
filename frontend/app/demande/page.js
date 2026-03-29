"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Send, Clock, CheckCircle, XCircle, MessageSquare,
  FileText, AlertCircle, Upload, X, Paperclip, Eye
} from "lucide-react";

const API_BASE = "http://localhost:5001/api";

// ─── BADGE STATUT ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    "En attente": "bg-amber-100 text-amber-700 border-amber-300",
    "Validée":    "bg-emerald-100 text-emerald-700 border-emerald-300",
    "Rejetée":    "bg-red-100 text-red-700 border-red-300",
  };
  const icons = {
    "En attente": <Clock size={12} />,
    "Validée":    <CheckCircle size={12} />,
    "Rejetée":    <XCircle size={12} />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {icons[status]} {status}
    </span>
  );
}

// ─── CARTE DÉCISION ───────────────────────────────────────────────────────────
function DecisionCard({ demande }) {
  const isValidee = demande.statut === "Validée";
  const isRejetee = demande.statut === "Rejetée";
  if (!isValidee && !isRejetee) return null;

  const messageAdmin = demande.message_client || demande.messageClient || null;
  const motif        = demande.motif_refus    || demande.motifRefus    || null;

  return (
    <div className={`mt-4 rounded-xl border-2 overflow-hidden ${isValidee ? "border-emerald-200" : "border-red-200"}`}>
      <div className={`flex items-center gap-2 px-4 py-3 ${isValidee ? "bg-emerald-600" : "bg-red-600"}`}>
        {isValidee ? <CheckCircle size={15} className="text-white" /> : <XCircle size={15} className="text-white" />}
        <span className="text-white font-bold text-sm">Décision de la Commission</span>
        <span className="ml-auto text-[11px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
          {isValidee ? "✅ ACCEPTÉE" : "❌ REFUSÉE"}
        </span>
      </div>
      <div className={`p-4 space-y-3 ${isValidee ? "bg-emerald-50" : "bg-red-50"}`}>
        {isRejetee && motif && (
          <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-red-100">
            <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase text-red-400 mb-1">Motif du refus</p>
              <p className="text-sm font-medium text-red-800">{motif}</p>
            </div>
          </div>
        )}
        <div className={`flex items-start gap-3 bg-white rounded-lg p-3 border ${isValidee ? "border-emerald-100" : "border-red-100"}`}>
          <MessageSquare size={15} className={`mt-0.5 shrink-0 ${isValidee ? "text-emerald-500" : "text-red-400"}`} />
          <div>
            <p className={`text-[10px] font-black uppercase mb-1 ${isValidee ? "text-emerald-500" : "text-red-400"}`}>Message de l'administration</p>
            <p className={`text-sm ${isValidee ? "text-emerald-900" : "text-red-900"}`}>
              {messageAdmin || (isValidee
                ? "Votre dossier a été accepté. Veuillez vous rapprocher de la structure de gestion."
                : "Votre dossier a été refusé. Contactez la structure de gestion pour plus d'informations."
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CHAMP FORMULAIRE ─────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-start gap-4 py-4 border-b border-gray-100 last:border-0">
      <label className="text-sm text-gray-600 pt-2.5 leading-tight">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div>{children}</div>
    </div>
  );
}

// ─── INPUT STYLE ──────────────────────────────────────────────────────────────
const inputCls = "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition placeholder-gray-400 bg-white";
const selectCls = `${inputCls} cursor-pointer`;

// ─── ZONE UPLOAD FICHIERS (illimité) ─────────────────────────────────────────
function FileUploadZone({ files, onChange, label, accept = "*" }) {
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    onChange([...files, ...dropped]);
  };

  const handleAdd = (e) => {
    const added = Array.from(e.target.files);
    onChange([...files, ...added]);
    e.target.value = "";
  };

  const removeFile = (index) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const getIcon = (file) => {
    if (file.type.startsWith("image/")) return "🖼️";
    if (file.type === "application/pdf") return "📄";
    return "📎";
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      {/* Zone de dépôt */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center cursor-pointer hover:border-green-500 hover:bg-green-50/30 transition-all group"
      >
        <Upload size={22} className="mx-auto mb-2 text-gray-400 group-hover:text-green-600 transition-colors" />
        <p className="text-sm text-gray-500 group-hover:text-green-700 font-medium transition-colors">
          Glissez vos fichiers ici ou <span className="text-green-700 font-bold underline">cliquez pour parcourir</span>
        </p>
        <p className="text-[11px] text-gray-400 mt-1">PDF, JPG, PNG — nombre illimité</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleAdd}
          className="hidden"
        />
      </div>

      {/* Liste des fichiers uploadés */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 group">
              <span className="text-base shrink-0">{getIcon(file)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{file.name}</p>
                <p className="text-[10px] text-gray-400">{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors shrink-0"
              >
                <X size={13} />
              </button>
            </div>
          ))}
          <p className="text-[11px] text-gray-400 text-right">{files.length} fichier{files.length > 1 ? "s" : ""} sélectionné{files.length > 1 ? "s" : ""}</p>
        </div>
      )}
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function DemandePage() {
  const [activeTab, setActiveTab] = useState("form");
  const [demandes, setDemandes] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState({ text: "", type: "" });

  // Champs du formulaire
  const [prenom, setPrenom]         = useState("");
  const [nom, setNom]               = useState("");
  const [sexe, setSexe]             = useState("");
  const [telephone, setTelephone]   = useState("");
  const [dateNaiss, setDateNaiss]   = useState("");
  const [fonction, setFonction]     = useState("");
  const [prestation, setPrestation] = useState("");
  const [fichiers, setFichiers]     = useState([]);

  const resetForm = () => {
    setPrenom(""); setNom(""); setSexe(""); setTelephone("");
    setDateNaiss(""); setFonction(""); setPrestation(""); setFichiers([]);
    setSubmitMsg({ text: "", type: "" });
  };

  const fetchDemandes = async () => {
    setFetchLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/demandes`);
      console.log("Demandes:", res.data);
      setDemandes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "list") fetchDemandes();
  }, [activeTab]);

  const handleSubmit = async () => {
    if (!prenom.trim() || !nom.trim() || !prestation || fichiers.length === 0) {
      setSubmitMsg({ text: "⚠️ Veuillez remplir tous les champs obligatoires et joindre au moins un document.", type: "error" });
      return;
    }
    setSubmitLoading(true);
    setSubmitMsg({ text: "", type: "" });

    const fd = new FormData();
    fd.append("nom_beneficiaire", `${prenom.trim()} ${nom.trim()}`);
    fd.append("type_prestation", prestation);
    fd.append("fonction", fonction || "Personnel");
    // Tous les fichiers sous la clé "pieces"
    fichiers.forEach((f) => fd.append("pieces", f));

    try {
      await axios.post(`${API_BASE}/demandes/ajouter`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSubmitMsg({ text: "✅ Votre dossier a été soumis avec succès ! Vous pouvez suivre son statut dans 'Mes Demandes'.", type: "success" });
      resetForm();
      setTimeout(() => setActiveTab("list"), 2200);
    } catch (err) {
      setSubmitMsg({ text: "❌ Une erreur est survenue lors de l'envoi. Veuillez réessayer.", type: "error" });
    } finally {
      setSubmitLoading(false);
    }
  };

  const nbEnAttente = demandes.filter(d => d.statut === "En attente").length;
  const nbValidees  = demandes.filter(d => d.statut === "Validée").length;
  const nbRejetees  = demandes.filter(d => d.statut === "Rejetée").length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* ── NAVIGATION ── */}
        <div className="flex gap-3 mb-8 border-b border-gray-200 pb-0">
          {[
            { key: "form", label: "Nouveau Dossier" },
            { key: "list", label: "Mes Demandes", badge: nbEnAttente },
          ].map(({ key, label, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${
                activeTab === key
                  ? "border-green-700 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              {badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── FORMULAIRE ── */}
        {activeTab === "form" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Titre */}
            <div className="px-8 pt-8 pb-4 border-b border-gray-100">
              <h1 className="text-xl font-bold text-gray-800">Formulaire de Demande de Prise en Charge</h1>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Merci de remplir ce formulaire pour soumettre votre demande. Un responsable examinera votre dossier dans les meilleurs délais.
              </p>
              <hr className="mt-4 border-gray-200" />
            </div>

            {/* Corps du formulaire */}
            <div className="px-8 py-2">

              <Field label="Nom du Bénéficiaire" required>
                <div className="flex gap-2">
                  <input
                    type="text" value={prenom} onChange={e => setPrenom(e.target.value)}
                    placeholder="Prénom" className={inputCls}
                  />
                  <input
                    type="text" value={nom} onChange={e => setNom(e.target.value)}
                    placeholder="Nom" className={inputCls}
                  />
                </div>
              </Field>

              <Field label="Sexe">
                <select value={sexe} onChange={e => setSexe(e.target.value)} className={selectCls}>
                  <option value="">*Merci de Sélectionner*</option>
                  <option value="Masculin">Masculin</option>
                  <option value="Féminin">Féminin</option>
                </select>
              </Field>

              <Field label="Téléphone" required>
                <input
                  type="tel" value={telephone} onChange={e => setTelephone(e.target.value)}
                  placeholder="### ### ####" className={inputCls}
                />
              </Field>

              <Field label="Date de Naissance" required>
                <input
                  type="date" value={dateNaiss} onChange={e => setDateNaiss(e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Fonction">
                <select value={fonction} onChange={e => setFonction(e.target.value)} className={selectCls}>
                  <option value="">*Merci de Sélectionner*</option>
                  <option value="ATS">ATS</option>
                  <option value="ENSEIGNANT">Enseignant</option>
                  <option value="RETRAITE">Retraité</option>
                  <option value="Personnel">Personnel administratif</option>
                </select>
              </Field>

              <Field label="Type de Prestation" required>
                <select value={prestation} onChange={e => setPrestation(e.target.value)} className={selectCls}>
                  <option value="">*Merci de Sélectionner*</option>
                  <option value="Intervention Chirurgicale">Intervention Chirurgicale</option>
                  <option value="Analyses Médicales">Analyses Médicales</option>
                  <option value="Radiologie">Radiologie</option>
                  <option value="Soins Dentaire">Soins Dentaire</option>
                  <option value="Soins Ophtalmologiques">Soins Ophtalmologiques</option>
                  <option value="Circoncision">Circoncision</option>
                </select>
              </Field>

              <Field label="Documents Justificatifs" required>
                <FileUploadZone
                  files={fichiers}
                  onChange={setFichiers}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <p className="text-[11px] text-gray-400 mt-2">
                  Joignez tous les documents nécessaires : ordonnance, résultats d'analyses, devis, etc.
                </p>
              </Field>

            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
              {submitMsg.text && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-medium border ${
                  submitMsg.type === "success"
                    ? "bg-green-50 text-green-800 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  {submitMsg.text}
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  type="button" onClick={resetForm}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition"
                >
                  Réinitialiser
                </button>
                <button
                  type="button" onClick={handleSubmit} disabled={submitLoading}
                  className="flex items-center gap-2 px-7 py-2.5 text-sm font-bold bg-green-700 text-white rounded hover:bg-green-800 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  {submitLoading
                    ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Envoi...</>
                    : <><Send size={15} /> Soumettre le Dossier</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── LISTE DES DEMANDES ── */}
        {activeTab === "list" && (
          <div>
            {/* Stats */}
            {demandes.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "En attente", val: nbEnAttente, cls: "text-amber-600 border-amber-200"   },
                  { label: "Validées",   val: nbValidees,  cls: "text-emerald-600 border-emerald-200" },
                  { label: "Refusées",   val: nbRejetees,  cls: "text-red-600 border-red-200"        },
                ].map(({ label, val, cls }) => (
                  <div key={label} className={`bg-white rounded-lg p-4 text-center shadow-sm border ${cls}`}>
                    <p className={`text-2xl font-black ${cls.split(" ")[0]}`}>{val}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800">Suivi de mes dossiers</h2>
              <button onClick={fetchDemandes} className="text-xs text-green-700 font-bold hover:underline">↻ Actualiser</button>
            </div>

            {fetchLoading ? (
              <div className="text-center py-20 text-gray-400">
                <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-3" />
                Chargement...
              </div>
            ) : demandes.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-16 text-gray-400">
                <FileText size={36} className="mx-auto mb-3 text-gray-200" />
                <p className="font-medium text-sm">Aucune demande soumise pour le moment.</p>
                <button onClick={() => setActiveTab("form")} className="mt-3 text-green-700 text-sm font-bold underline">
                  Soumettre un dossier →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {demandes.map((d) => {
                  // Récupération des pièces jointes (tableau JSON du modèle)
                  const pieces = Array.isArray(d.pieces) ? d.pieces : (d.pieces ? Object.values(d.pieces) : []);

                  return (
                    <div
                      key={d.id}
                      className={`bg-white rounded-lg shadow-sm border overflow-hidden transition hover:shadow-md ${
                        d.statut === "Validée" ? "border-emerald-200" :
                        d.statut === "Rejetée" ? "border-red-200" : "border-gray-200"
                      }`}
                    >
                      {/* Barre de couleur */}
                      <div className={`h-1 w-full ${
                        d.statut === "Validée" ? "bg-emerald-400" :
                        d.statut === "Rejetée" ? "bg-red-400" : "bg-amber-400"
                      }`} />

                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-gray-400 tracking-widest">#{d.id}</span>
                              <h3 className="font-bold text-gray-800">{d.type_prestation}</h3>
                            </div>
                            <p className="text-gray-500 text-sm mt-1">
                              Bénéficiaire : <span className="text-gray-700 font-semibold">{d.nom_beneficiaire}</span>
                            </p>
                            {d.fonction && (
                              <p className="text-gray-400 text-xs mt-0.5">Fonction : {d.fonction}</p>
                            )}
                            <p className="text-gray-400 text-xs mt-1">
                              Déposé le {new Date(d.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>

                            {/* Pièces jointes */}
                            {pieces.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {pieces.map((p, i) => {
                                  const filename = typeof p === "string" ? p : p?.filename || p?.name || `Document ${i + 1}`;
                                  return (
                                    <a
                                      key={i}
                                      href={`${API_BASE}/uploads/pieces/${filename}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1 text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-blue-50 hover:text-blue-700 transition border border-gray-200"
                                    >
                                      <Paperclip size={10} /> {filename}
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <StatusBadge status={d.statut} />
                        </div>

                        {/* Décision de l'admin */}
                        <DecisionCard demande={d} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
