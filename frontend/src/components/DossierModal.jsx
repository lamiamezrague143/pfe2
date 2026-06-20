"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Paperclip,
  Download,
  ClipboardList,
  ChevronRight,
  Loader2,
  ExternalLink,
} from "lucide-react";

// ─── UPLOAD PRISE EN CHARGE MODAL ────────────────────────────────────────────
function UploadPriseEnChargeModal({ demande, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [drag, setDrag] = useState(false);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef(null);

  if (!demande) return null;

  const handleFile = (f) => {
    if (!f) return;
    const isValid = f.type === "application/pdf" || f.type.startsWith("image/");
    if (!isValid) {
      alert("Format accepté : PDF ou image (JPG, PNG, WEBP)");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      alert("Fichier trop lourd (max 10 Mo)");
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview("pdf");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("pec", file);
      if (note.trim()) formData.append("note", note);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"}/demandes/upload-pec/${demande.id}`,
        { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData }
      );
      if (!res.ok) throw new Error("Échec upload");
      setUploaded(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch {
      alert("Une erreur est survenue lors de l'envoi du fichier.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-700 to-teal-600 px-6 py-5 flex justify-between items-start">
          <div>
            <p className="text-emerald-50/80 text-[11px] font-semibold uppercase tracking-widest">
              Prise en charge
            </p>
            <h2 className="text-white font-semibold text-base mt-0.5">{demande.nom_beneficiaire}</h2>
            <p className="text-emerald-50/70 text-xs mt-0.5">{demande.type_prestation}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                drag ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-400 hover:bg-slate-50"
              }`}
            >
              <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Upload size={20} strokeWidth={2} />
              </div>
              <p className="font-semibold text-slate-700 text-sm">Glisser-déposer un fichier ou cliquer</p>
              <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, WEBP — 10 Mo maximum</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {preview === "pdf" ? (
                <div className="bg-rose-50 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} Ko</p>
                  </div>
                </div>
              ) : (
                <img src={preview} alt="Aperçu du document" className="w-full max-h-52 object-contain bg-slate-50" />
              )}
              <div className="px-3 py-2.5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <span className="text-xs text-slate-500 truncate max-w-[220px]">{file.name}</span>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  className="text-xs text-rose-600 font-medium hover:underline"
                >
                  Changer le fichier
                </button>
              </div>
            </div>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note pour le bénéficiaire (optionnel)"
            rows={3}
            className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 bg-slate-50 placeholder:text-slate-400"
          />

          <button
            onClick={handleUpload}
            disabled={!file || uploading || uploaded}
            className={`w-full py-3 rounded-xl font-semibold text-sm text-white transition flex items-center justify-center gap-2 ${
              uploaded
                ? "bg-emerald-600 cursor-default"
                : !file || uploading
                ? "bg-slate-300 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {uploaded ? (
              <>
                <CheckCircle2 size={16} /> Document envoyé
              </>
            ) : uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Envoi en cours…
              </>
            ) : (
              <>
                <Upload size={16} /> Envoyer la prise en charge
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BADGE STATUT ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    "En attente": { cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
    Validée: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
    Rejetée: { cls: "bg-rose-50 text-rose-700 border-rose-200", Icon: XCircle },
  };
  const { cls, Icon } = cfg[status] || { cls: "bg-slate-100 text-slate-600 border-slate-200", Icon: Clock };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      <Icon size={12} strokeWidth={2.5} />
      {status}
    </span>
  );
}

// ─── COMPOSANT PRINCIPAL : DOSSIER MODAL ─────────────────────────────────────
export default function DossierModal({ demande, onClose, onDecision, cliniques, onUploadSuccess, onPrefillForm }) {
  const [activeTab, setActiveTab] = useState("infos");
  const [decisionStep, setDecisionStep] = useState("init"); // init | form | done
  const [currentAction, setCurrentAction] = useState(null);
  const [motif, setMotif] = useState("");
  const [messageClient, setMessageClient] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  if (!demande) return null;

  const pieces = demande.pieces || [];
  const ayantsDroits = demande.ayant_nom
    ? [
        {
          nom: demande.ayant_nom,
          prenom: demande.ayant_prenom,
          lien: demande.ayant_lien,
          date_naiss: demande.ayant_date_naiss,
          telephone: demande.ayant_telephone,
        },
      ]
    : [];

  const initials = (str = "") =>
    str.trim().split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

  const handleDecision = async () => {
    if (currentAction === "rejeter" && !motif.trim()) {
      alert("Veuillez saisir un motif de refus.");
      return;
    }
    setLoading(true);
    try {
      await onDecision(demande.id, currentAction, motif, messageClient);
      setDecisionStep("done");
    } catch {
      alert("Une erreur est survenue lors de l'enregistrement de la décision.");
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { key: "infos", label: "Informations" },
    { key: "ayants", label: "Ayants droit", count: ayantsDroits.length },
    { key: "pieces", label: "Pièces jointes", count: pieces.length },
    { key: "decision", label: "Décision" },
  ];

  return (
    <>
      {showUpload && (
        <UploadPriseEnChargeModal
          demande={demande}
          onClose={() => setShowUpload(false)}
          onSuccess={() => onUploadSuccess?.()}
        />
      )}

      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* ── HEADER ── */}
          <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
              {initials(demande.nom_beneficiaire)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-slate-900 truncate">{demande.nom_beneficiaire}</h2>
                <StatusBadge status={demande.statut} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dossier n°{demande.id} ·{" "}
                {new Date(demande.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer le dossier"
              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <X size={16} strokeWidth={2.25} />
            </button>
          </div>

          {/* ── ONGLETS ── */}
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {TABS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 focus:outline-none ${
                  activeTab === key
                    ? "border-emerald-600 text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {label}
                {count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      count > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── BODY ── */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* ── TAB : INFORMATIONS ── */}
            {activeTab === "infos" && (
              <div className="space-y-5">
                <Section title="Fonctionnaire">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nom complet" value={demande.nom_beneficiaire} />
                    <Field label="Fonction" value={demande.fonction} />
                    <Field
                      label="Date et lieu de naissance"
                      value={
                        demande.date_naissance
                          ? `${new Date(demande.date_naissance).toLocaleDateString("fr-FR")}${
                              demande.lieu_naissance ? ` à ${demande.lieu_naissance}` : ""
                            }`
                          : undefined
                      }
                    />
                    <Field label="Téléphone" value={demande.telephone} />
                  </div>
                </Section>

                <Section title="Prestation demandée">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Type de prestation" value={demande.type_prestation} />
                    <Field
                      label="Bénéficiaire"
                      value={
                        demande.pour_qui === "autre" && demande.ayant_nom
                          ? `${demande.ayant_prenom || ""} ${demande.ayant_nom || ""}`.trim()
                          : "L'assuré lui-même"
                      }
                    />
                  </div>
                </Section>

                {demande.statut === "Rejetée" && demande.motif_refus && (
                  <Section title="Motif de refus">
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-sm text-rose-700">
                      {demande.motif_refus}
                    </div>
                  </Section>
                )}
              </div>
            )}

            {/* ── TAB : AYANTS DROIT ── */}
            {activeTab === "ayants" && (
              <div>
                {ayantsDroits.length === 0 ? (
                  <EmptyState icon={Users} text="Aucun ayant droit déclaré pour ce dossier." />
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 mb-4">
                      {ayantsDroits.length} ayant{ayantsDroits.length > 1 ? "s" : ""} droit déclaré
                      {ayantsDroits.length > 1 ? "s" : ""}
                    </p>
                    {ayantsDroits.map((ad, i) => (
                      <AyantDroitCard key={i} ad={ad} index={i} initials={initials} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB : PIÈCES JOINTES ── */}
            {activeTab === "pieces" && (
              <div>
                {pieces.length === 0 ? (
                  <EmptyState icon={Paperclip} text="Aucun document joint à ce dossier." />
                ) : (
                  <div className="space-y-2">
                    {pieces.map((p, i) => {
  const data = typeof p === "string" ? p : p.data || "";
  const nom = typeof p === "string" ? `Document ${i + 1}` : p.nom || p.name || `Document ${i + 1}`;
  const type = typeof p === "object" ? p.type || "" : "";
  const isPdf = type.includes("pdf") || data.startsWith("data:application/pdf");
  return (
    <a 
      key={i}
      href={data}
      target="_blank"
      rel="noopener noreferrer"
      download={nom}
      className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition group"
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isPdf ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
        }`}
      >
        {isPdf ? <FileText size={16} /> : <ImageIcon size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{nom}</p>
        <p className="text-xs text-slate-400">{isPdf ? "PDF" : "Image"}</p>
      </div>
      <span className="flex items-center gap-1 text-xs text-emerald-700 opacity-0 group-hover:opacity-100 transition font-medium">
        Ouvrir <ExternalLink size={12} />
      </span>
    </a>
  );
})}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB : DÉCISION ── */}
            {activeTab === "decision" && (
              <div>
                {/* INIT */}
                {decisionStep === "init" && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">Choisissez l'action à effectuer sur ce dossier.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setCurrentAction("valider");
                          setDecisionStep("form");
                        }}
                        className="flex flex-col items-center gap-2 p-5 border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition group"
                      >
                        <CheckCircle2 size={22} className="text-slate-400 group-hover:text-emerald-600" />
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700">
                          Valider
                        </span>
                        <span className="text-xs text-slate-400 text-center">
                          Approuver le dossier et notifier le bénéficiaire
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentAction("rejeter");
                          setDecisionStep("form");
                        }}
                        className="flex flex-col items-center gap-2 p-5 border border-slate-200 rounded-xl hover:border-rose-300 hover:bg-rose-50 transition group"
                      >
                        <XCircle size={22} className="text-slate-400 group-hover:text-rose-600" />
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-rose-700">
                          Rejeter
                        </span>
                        <span className="text-xs text-slate-400 text-center">
                          Refuser le dossier avec un motif explicatif
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* FORM */}
                {decisionStep === "form" && (
                  <div className="space-y-4">
                    <div
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        currentAction === "valider"
                          ? "bg-emerald-50 border-emerald-100"
                          : "bg-rose-50 border-rose-100"
                      }`}
                    >
                      {currentAction === "valider" ? (
                        <CheckCircle2 size={18} className="text-emerald-600" />
                      ) : (
                        <XCircle size={18} className="text-rose-600" />
                      )}
                      <p
                        className={`text-sm font-semibold ${
                          currentAction === "valider" ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {currentAction === "valider" ? "Validation du dossier" : "Rejet du dossier"}
                      </p>
                      <button
                        onClick={() => {
                          setDecisionStep("init");
                          setMotif("");
                          setMessageClient("");
                        }}
                        className="ml-auto text-xs text-slate-400 underline hover:text-slate-600"
                      >
                        Changer
                      </button>
                    </div>

                    {currentAction === "rejeter" && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                          Motif de refus <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          value={motif}
                          onChange={(e) => setMotif(e.target.value)}
                          placeholder="Ex : documents manquants, plafond annuel atteint…"
                          rows={3}
                          className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 bg-rose-50/30 placeholder:text-slate-400"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Message pour le bénéficiaire <span className="text-slate-300 font-normal">(optionnel)</span>
                      </label>
                      <textarea
                        value={messageClient}
                        onChange={(e) => setMessageClient(e.target.value)}
                        placeholder={
                          currentAction === "valider"
                            ? "Ex : votre dossier a été validé, vous pouvez vous présenter à la clinique…"
                            : "Ex : nous vous invitons à renouveler votre dossier avec les pièces manquantes…"
                        }
                        rows={3}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 bg-slate-50 placeholder:text-slate-400"
                      />
                    </div>

                    <button
                      onClick={handleDecision}
                      disabled={loading}
                      className={`w-full py-3 rounded-xl font-semibold text-sm text-white transition flex items-center justify-center gap-2 ${
                        currentAction === "valider"
                          ? "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300"
                          : "bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300"
                      }`}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Traitement…
                        </>
                      ) : currentAction === "valider" ? (
                        <>
                          <CheckCircle2 size={16} /> Confirmer la validation
                        </>
                      ) : (
                        <>
                          <XCircle size={16} /> Confirmer le rejet
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* DONE */}
                {decisionStep === "done" && (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center ${
                        currentAction === "valider" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {currentAction === "valider" ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
                    </div>
                    <p className="text-base font-semibold text-slate-800">
                      {currentAction === "valider" ? "Dossier validé avec succès" : "Dossier rejeté"}
                    </p>
                    <p className="text-sm text-slate-400">Le bénéficiaire sera notifié par la plateforme.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div className="border-t border-slate-100 px-6 py-3 flex items-center gap-2 flex-wrap bg-slate-50/60">
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-white hover:shadow-sm transition font-medium"
            >
              <Upload size={14} /> Upload PEC
            </button>
            <button
              onClick={() => {
                onPrefillForm?.(demande);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-white hover:shadow-sm transition font-medium"
            >
              <ClipboardList size={14} /> Formulaire PEC
            </button>
            <div className="flex-1" />
            {demande.statut === "Validée" && (
              <button
                onClick={() => {
                  /* appelle downloadPEC depuis le parent si besoin */
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-black transition"
              >
                <Download size={14} /> Télécharger PEC
              </button>
            )}
            {decisionStep === "init" && demande.statut === "En attente" && (
              <button
                onClick={() => setActiveTab("decision")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition"
              >
                Décider <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── SOUS-COMPOSANTS ──────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl px-4 py-3">
      <p className="text-[11px] text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value || "—"}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
        <Icon size={20} />
      </div>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

const LIEN_COLORS = {
  Enfant: "bg-blue-50 text-blue-700",
  Conjoint: "bg-emerald-50 text-emerald-700",
  "Conjoint(e)": "bg-emerald-50 text-emerald-700",
  Père: "bg-amber-50 text-amber-700",
  Mère: "bg-amber-50 text-amber-700",
  Parent: "bg-amber-50 text-amber-700",
};

function AyantDroitCard({ ad, index, initials }) {
  const colorCls = LIEN_COLORS[ad.lien] || "bg-teal-50 text-teal-700";
  const avatarColors = [
    "bg-blue-50 text-blue-700",
    "bg-emerald-50 text-emerald-700",
    "bg-amber-50 text-amber-700",
    "bg-teal-50 text-teal-700",
  ];
  const avatarCls = avatarColors[index % avatarColors.length];

  return (
    <div className="border border-slate-100 rounded-xl p-4 bg-white hover:shadow-sm transition">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${avatarCls}`}
        >
          {initials(`${ad.prenom || ""} ${ad.nom || ""}`)}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {ad.prenom || ""} {ad.nom || ""}
          </p>
          {ad.lien && (
            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${colorCls}`}>
              {ad.lien}
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 pl-0.5">
        <div>
          <p className="text-[10px] text-slate-400 mb-0.5">Date de naissance</p>
          <p className="text-xs font-medium text-slate-700">
            {ad.date_naiss ? new Date(ad.date_naiss).toLocaleDateString("fr-FR") : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 mb-0.5">Téléphone</p>
          <p className="text-xs font-medium text-slate-700">{ad.telephone || "—"}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 mb-0.5">Lien</p>
          <p className="text-xs font-medium text-slate-700">{ad.lien || "—"}</p>
        </div>
      </div>
    </div>
  );
}