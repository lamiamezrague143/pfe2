"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from 'qrcode.react';
import ProtectedRoutes from "../../../components/ProtectedRoutes";
import { apiFetch } from "../../../lib/api";

// ─── NOTIFICATION SYSTEM ─────────────────────────────────────────────────────
function NotificationPanel({ demandes, isOpen, onClose, onOpenDossier }) {
  const pending = demandes.filter(d => d.statut === "En attente");
  const recent = demandes
    .filter(d => {
      const diff = Date.now() - new Date(d.createdAt).getTime();
      return diff < 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed top-16 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slideDown">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 flex justify-between items-center">
          <div>
            <p className="text-white font-black text-sm">Notifications</p>
            <p className="text-white/70 text-xs">{pending.length} en attente de traitement</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white text-lg font-bold">✕</button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {recent.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              <p className="text-3xl mb-2">🔔</p>
              <p>Aucune nouvelle demande</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map((d) => {
                const isNew = Date.now() - new Date(d.createdAt).getTime() < 2 * 60 * 60 * 1000;
                return (
                  <div
                    key={d.id}
                    onClick={() => { onOpenDossier(d); onClose(); }}
                    className="p-4 hover:bg-orange-50 cursor-pointer transition-colors flex gap-3 items-start"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                      d.statut === "En attente" ? "bg-amber-100 text-amber-700" :
                      d.statut === "Validée" ? "bg-emerald-100 text-emerald-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {d.nom_beneficiaire?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-gray-800 text-xs truncate">{d.nom_beneficiaire}</p>
                        {isNew && <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">NEW</span>}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{d.type_prestation}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          d.statut === "En attente" ? "bg-amber-100 text-amber-700" :
                          d.statut === "Validée" ? "bg-emerald-100 text-emerald-700" :
                          "bg-red-100 text-red-700"
                        }`}>{d.statut}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(d.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {pending.length > 0 && (
          <div className="p-3 bg-orange-50 border-t border-orange-100">
            <p className="text-xs text-orange-700 font-bold text-center">
              ⚡ {pending.length} dossier{pending.length > 1 ? "s" : ""} en attente de décision
            </p>
          </div>
        )}
      </div>
    </>
  );
}

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
    if (!isValid) { alert("Format accepté : PDF ou image (JPG, PNG, WEBP)"); return; }
    if (f.size > 10 * 1024 * 1024) { alert("Fichier trop lourd (max 10 Mo)"); return; }
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target.result);
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
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );
      if (!res.ok) throw new Error("Échec upload");
      setUploaded(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1200);
    } catch (err) {
      alert("❌ Erreur lors de l'envoi du fichier");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-5 flex justify-between items-center">
          <div>
            <p className="text-white/70 text-xs uppercase tracking-widest">Upload Prise en Charge</p>
            <h2 className="text-white font-black text-base">{demande.nom_beneficiaire}</h2>
            <p className="text-white/60 text-xs mt-0.5">{demande.type_prestation}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white font-bold transition">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Info récap */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-700 space-y-1">
            <p><span className="font-bold">Dossier :</span> #{demande.id}</p>
            <p><span className="font-bold">Bénéficiaire :</span> {demande.nom_beneficiaire}</p>
            <p><span className="font-bold">Prestation :</span> {demande.type_prestation}</p>
            <p className="text-[10px] text-indigo-400 mt-1">
              📎 Le fichier uploadé sera envoyé au bénéficiaire et stocké dans son dossier.
            </p>
          </div>

          {/* Zone drag & drop */}
          {!file ? (
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                drag ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
              }`}
            >
              <p className="text-4xl mb-2">📤</p>
              <p className="font-bold text-gray-700 text-sm">Glisser-déposer ou cliquer</p>
              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, WEBP — max 10 Mo</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {preview === "pdf" ? (
                <div className="bg-red-50 p-4 flex items-center gap-3">
                  <span className="text-3xl">📄</span>
                  <div>
                    <p className="font-bold text-sm text-gray-800">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} Ko — PDF</p>
                  </div>
                </div>
              ) : (
                <img src={preview} alt="preview" className="w-full max-h-52 object-contain bg-gray-50" />
              )}
              <div className="p-3 border-t bg-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-500 truncate max-w-[200px]">{file.name}</span>
                <button
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="text-xs text-red-500 font-bold hover:underline"
                >
                  ✕ Changer
                </button>
              </div>
            </div>
          )}

          {/* Note optionnelle */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
              Note pour le bénéficiaire (optionnel)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ex: Votre prise en charge est prête, veuillez vous présenter à la clinique..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
            />
          </div>

          {/* Bouton upload */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading || uploaded}
            className={`w-full py-3 rounded-xl font-black text-white text-sm transition shadow-lg ${
              uploaded
                ? "bg-emerald-500 cursor-default"
                : !file || uploading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
            }`}
          >
            {uploaded ? "✅ Envoyé avec succès !" : uploading ? "Envoi en cours..." : "📤 Envoyer la prise en charge"}
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── DOWNLOAD PRISE EN CHARGE ─────────────────────────────────────────────────
function useDownloadPEC() {
  const downloadPEC = useCallback(async (item, cliniques) => {
    try {
      if (item.fichier_prise_en_charge) {
        const url = item.fichier_prise_en_charge.startsWith("http")
          ? item.fichier_prise_en_charge
          : `http://localhost:5001/${item.fichier_prise_en_charge.replace(/^\//, "")}`;
        const link = document.createElement("a");
        link.href = url;
        link.download = `PEC_${item.ref || item.id}_${item.fNom || item.nom_beneficiaire || ""}.pdf`;
        link.click();
        return;
      }

      const clinique = cliniques?.find(c => String(c.id) === String(item.sfEtablissement));
      const printWindow = window.open("", "_blank", "width=900,height=700");
      const montant = parseFloat(item.montantTotal || 0);
      const partOS = Math.round(montant * 0.7);
      const partPerso = Math.round(montant * 0.3);

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <title>Prise en Charge - ${item.ref || item.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Times New Roman', serif; font-size: 12px; padding: 20mm; color: #000; }
            h1 { font-size: 16px; text-align: center; text-transform: uppercase; text-decoration: underline; margin-bottom: 16px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
            .header-center { text-align: center; flex: 1; padding: 0 16px; }
            .ref-date { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .field { border-bottom: 1px solid #000; min-width: 120px; display: inline-block; font-weight: bold; padding: 0 4px; }
            .section-title { font-weight: bold; text-decoration: underline; font-size: 11px; text-transform: uppercase; margin: 12px 0 6px; }
            .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px; }
            .note { font-size: 9px; font-style: italic; border-left: 3px solid #666; padding-left: 8px; margin-top: 12px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 32px; }
            .sig { text-align: center; }
            .sig-line { border-top: 1px solid #000; width: 120px; margin: 32px auto 0; }
            .service-fait { margin-top: 24px; border-top: 2px dashed #000; padding-top: 12px; }
            .sf-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
            .sf-line { display: flex; gap: 8px; align-items: baseline; }
            .sf-blank { flex: 1; border-bottom: 1px solid #000; }
            .institution { font-size: 9px; font-weight: normal; font-style: italic; }
            .institution-bold { font-size: 10px; font-weight: bold; }
            .montants { display: flex; gap: 16px; margin-top: 4px; }
            .part-os { color: #166534; font-weight: bold; }
            .part-pp { color: #9a3412; font-weight: bold; }
            @media print { body { padding: 10mm; } @page { margin: 10mm; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="width:80px;height:100px;border:1px solid #ccc;display:flex;align-items:center;justify-content:center;font-size:9px;color:#999;">PHOTO</div>
            <div class="header-center">
              <p style="font-size:9px;text-transform:uppercase;font-weight:bold;">République Algérienne Démocratique et Populaire</p>
              <p class="institution">Ministère de l'enseignement supérieur et de la recherche scientifique</p>
              <p class="institution-bold">Université « Mouloud Mammeri » de Tizi-Ouzou</p>
              <p style="font-size:11px;font-weight:bold;color:#1e3a8a;margin-top:4px;">Commission des Œuvres Sociales</p>
              <p style="font-size:9px;">Structure de Gestion</p>
            </div>
            <div style="width:60px;"></div>
          </div>

          <h1>Prise en Charge</h1>

          <div class="ref-date">
            <div><strong>Réf :</strong> <span class="field">${item.ref || item.numeroSequentiel || "—"}</span></div>
            <div><strong>Date :</strong> <span class="field">${item.dateForm || new Date(item.createdAt).toLocaleDateString("fr-FR")}</span></div>
          </div>

          <p style="margin-bottom:8px;">Nous avons l'honneur de vous adresser le patient dont les références suivent pour :
            <strong> ${item.prestation || item.type_prestation || "—"}</strong></p>
          <p style="margin-bottom:12px;">Entrant dans le cadre de la convention médicale paraphée en date du
            <span class="field">${item.conventionStartDate ? new Date(item.conventionStartDate).toLocaleDateString("fr-FR") : "—"}</span>
          </p>

          <p class="section-title">Le Fonctionnaire :</p>
          <div class="grid2">
            <div><strong>NOM :</strong> <span class="field">${(item.fNom || "").toUpperCase()}</span></div>
            <div><strong>Prénom :</strong> <span class="field">${item.fPrenom || ""}</span></div>
          </div>
          <div style="margin-bottom:6px;"><strong>Date et lieu de Naissance :</strong> <span class="field">${item.fDateLieu || "—"}</span></div>
          <div><strong>Fonction :</strong> <span class="field">${item.fFonction || "—"}</span></div>

          <p class="section-title">Le Patient :</p>
          <div class="grid2">
            <div><strong>Nom :</strong> <span class="field">${(item.pNom || item.fNom || "").toUpperCase()}</span></div>
            <div><strong>Prénom :</strong> <span class="field">${item.pPrenom || item.fPrenom || ""}</span></div>
          </div>
          <div style="margin-bottom:6px;"><strong>Date et lieu de Naissance :</strong> <span class="field">${item.pDateLieu || item.fDateLieu || "—"}</span></div>

          <div class="note">
            <p><strong>NB:</strong> Valable uniquement pour la prescription médicale du <span class="field">${item.nbDate || ""}</span></p>
            <p>Délivrée par : <span class="field">${item.nbDelivre || ""}</span></p>
            <p style="margin-top:6px;font-weight:bold;">
              Montant pris en charge : <span class="field">${montant.toLocaleString("fr-FR")}</span> DA
            </p>
            <div class="montants">
              <span class="part-os">Part OS (70%) : ${partOS.toLocaleString("fr-FR")} DA</span>
              <span class="part-pp">Part perso (30%) : ${partPerso.toLocaleString("fr-FR")} DA</span>
            </div>
          </div>

          <p style="font-size:9px;color:#666;font-style:italic;margin-top:12px;text-align:justify;">
            Toute utilisation frauduleuse de la présente convention expose son auteur à des suites qui seront décidées par les œuvres sociales "y compris des ponctions sur salaire jusqu'à concurrence de la somme due"
          </p>

          <div class="signatures">
            <div class="sig"><p>L'intéressé(e)</p><div class="sig-line"></div></div>
            <div class="sig"><p style="font-weight:bold;font-style:italic;">${clinique?.nom || item.sfEtablissement || "La Clinique"}</p><div class="sig-line"></div></div>
            <div class="sig"><p>La Structure de Gestion</p><div class="sig-line"></div></div>
          </div>

          <div class="service-fait">
            <h2 style="text-align:center;font-size:14px;text-decoration:underline;text-transform:uppercase;margin-bottom:12px;">Service Fait</h2>
            <div class="sf-grid">
              <div class="sf-line"><span>Nom et Prénom du patient :</span><div class="sf-blank"></div></div>
              <div class="sf-line"><span>Date et lieu de Naissance :</span><div class="sf-blank"></div></div>
              <div class="sf-line"><span>Désignation de la prestation :</span><div class="sf-blank"></div></div>
              <div class="sf-line" style="font-weight:bold;"><span>Montant de la prestation "70%" :</span><div class="sf-blank"></div><span>DA</span></div>
            </div>
            <div style="margin-top:20px;display:flex;justify-content:flex-end;">
              <div style="text-align:center;">
                <p style="font-size:10px;font-style:italic;font-weight:bold;">La Clinique / Le Laboratoire</p>
                <p style="font-weight:black;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:4px;">${clinique?.nom || "—"}</p>
              </div>
            </div>
          </div>

        
          <script>window.onload = () => { window.print(); };<\/script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error("Erreur download PEC:", err);
      alert("❌ Impossible de générer le document");
    }
  }, []);

  return downloadPEC;
}

// ─── STATUS BADGE ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const config = {
    "En attente": "bg-amber-100 text-amber-700 border-amber-300",
    "Validée":    "bg-emerald-100 text-emerald-700 border-emerald-300",
    "Rejetée":    "bg-red-100 text-red-700 border-red-300",
  };
  const icons = { "En attente": "⏳", "Validée": "✅", "Rejetée": "❌" };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${config[status] || "bg-gray-100 text-gray-600 border-gray-300"}`}>
      {icons[status]} {status?.toUpperCase()}
    </span>
  );
}

// ─── MODAL DOSSIER ────────────────────────────────────────────────────────────
function DossierModal({ demande, onClose, onDecision, cliniques, onUploadSuccess, onPrefillForm }) {
  const [motif, setMotif] = useState("");
  const [messageClient, setMessageClient] = useState("");
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const downloadPEC = useDownloadPEC();

  if (!demande) return null;

  const pieces = demande.pieces || [];

  const handleConfirm = async () => {
    if (action === "rejeter" && !motif.trim()) {
      alert("Veuillez saisir un motif de refus.");
      return;
    }
    setLoading(true);
    try {
      await onDecision(demande.id, action, motif, messageClient);
      onClose();
    } catch (e) {
      alert("Erreur lors de la décision.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showUpload && (
        <UploadPriseEnChargeModal
          demande={demande}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { onUploadSuccess?.(); }}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-fadeIn max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="p-5 text-white flex justify-between items-center sticky top-0 z-10 bg-[#1a1a2e]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-base">
                {demande.nom_beneficiaire?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/50">Dossier #{demande.id}</p>
                <h2 className="text-base font-semibold">{demande.nom_beneficiaire}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button onClick={() => setShowUpload(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                📤 Upload PEC
              </button>
              {demande.statut === "Validée" && (
                <button onClick={() => downloadPEC(demande, cliniques)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                  ⬇️ Télécharger PEC
                </button>
              )}
              <button onClick={() => { onPrefillForm?.(demande); onClose(); }} className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">
                📋 Remplir formulaire
              </button>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-lg transition">
                ✕
              </button>
            </div>
          </div>

          {/* ── Détails du dossier ── */}
          <div className="p-6 border-b border-gray-100 space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Bénéficiaire</p>
                <p className="font-bold text-gray-800">{demande.nom_beneficiaire || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Prestation</p>
                <p className="font-bold text-gray-800">{demande.type_prestation || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Date de la demande</p>
                <p className="text-gray-700">{demande.createdAt ? new Date(demande.createdAt).toLocaleDateString("fr-FR") : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Statut</p>
                <StatusBadge status={demande.statut} />
              </div>
              {demande.fonction && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Fonction</p>
                  <p className="text-gray-700">{demande.fonction}</p>
                </div>
              )}
              {demande.date_naissance && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Date / lieu de naissance</p>
                  <p className="text-gray-700">
                    {new Date(demande.date_naissance).toLocaleDateString("fr-FR")}
                    {demande.lieu_naissance ? ` à ${demande.lieu_naissance}` : ""}
                  </p>
                </div>
              )}
              {demande.telephone && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Téléphone</p>
                  <p className="text-gray-700">{demande.telephone}</p>
                </div>
              )}
            </div>

            {/* Pièces jointes */}
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-2">📎 Pièces jointes ({pieces.length})</p>
              {pieces.length === 0 ? (
                <p className="text-xs text-gray-300 italic">Aucun document joint.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {pieces.map((p, i) => {
                    const raw = typeof p === "string" ? p : (p.url || p.path || p.fichier || p.chemin || "");
                    const fullUrl = raw.startsWith("http") ? raw : `http://localhost:5001/${raw.replace(/^\//, "")}`;
                    const nom = typeof p === "string" ? `Document ${i + 1}` : (p.nom || p.name || `Document ${i + 1}`);
                    return (
                      <a
                        key={i}
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition truncate"
                      >
                        📄 {nom}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Ayant droit — bloc conditionnel */}
          {demande.pour_qui === "autre" && (
            <div className="p-6 border-b border-gray-100">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs text-amber-600 font-black uppercase tracking-widest mb-3">
                  👨‍👩‍👧 Demande pour un ayant droit
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Prénom</p>
                    <p className="font-bold text-gray-800">{demande.ayant_prenom || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Nom</p>
                    <p className="font-bold text-gray-800">{demande.ayant_nom || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Lien de parenté</p>
                    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold">
                      {demande.ayant_lien || "—"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Date de naissance</p>
                    <p className="text-gray-700">
                      {demande.ayant_date_naiss ? new Date(demande.ayant_date_naiss).toLocaleDateString("fr-FR") : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Téléphone</p>
                    <p className="font-semibold text-gray-700">{demande.ayant_telephone || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Zone de décision */}
          <div className="p-6 space-y-4">
            {!action ? (
              <div>
                <p className="text-sm font-bold text-gray-600 mb-3">Quelle décision souhaitez-vous prendre ?</p>
                <div className="flex gap-3">
                  <button onClick={() => setAction("valider")} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition shadow-md shadow-emerald-200">✅ Valider le dossier</button>
                  <button onClick={() => setAction("rejeter")} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition shadow-md shadow-red-200">❌ Rejeter le dossier</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-bold ${action === "valider" ? "text-emerald-700" : "text-red-700"}`}>
                    {action === "valider" ? "✅ Validation du dossier" : "❌ Rejet du dossier"}
                  </span>
                  <button onClick={() => { setAction(null); setMotif(""); setMessageClient(""); }} className="text-xs text-gray-400 underline hover:text-gray-600">Changer</button>
                </div>
                {action === "rejeter" && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Motif de refus *</label>
                    <textarea
                      value={motif}
                      onChange={e => setMotif(e.target.value)}
                      placeholder="Décrivez le motif de refus (ex: documents manquants, plafond atteint...)"
                      rows={3}
                      className="mt-1 w-full border border-red-200 rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-red-400 bg-red-50"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Message pour le bénéficiaire (optionnel)</label>
                  <textarea value={messageClient} onChange={e => setMessageClient(e.target.value)}
                    placeholder={action === "valider" ? "Ex: Votre dossier a été validé..." : "Ex: Nous vous invitons à renouveler..."}
                    className={`mt-1 w-full border rounded-xl p-3 text-sm resize-none h-24 outline-none focus:ring-2 transition ${action === "valider" ? "border-emerald-200 focus:ring-emerald-400 bg-emerald-50" : "border-red-200 focus:ring-red-400 bg-red-50"}`}
                  />
                </div>
                <button onClick={handleConfirm} disabled={loading}
                  className={`w-full py-3.5 rounded-xl font-black text-white text-sm transition shadow-lg ${action === "valider" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 disabled:bg-emerald-300" : "bg-red-600 hover:bg-red-700 shadow-red-200 disabled:bg-red-300"}`}>
                  {loading ? "Traitement en cours..." : action === "valider" ? "✅ Confirmer la validation" : "❌ Confirmer le rejet"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── PRIX MODAL ───────────────────────────────────────────────────────────────
function PrixModal({ prixList, onClose, onConfirm }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState({});

  const toggle = (item) => {
    setSelected(prev => {
      const key = String(item.id);
      if (prev[key]) { const n = { ...prev }; delete n[key]; return n; }
      return { ...prev, [key]: parseFloat(item.prix) };
    });
  };

  const total = Object.values(selected).reduce((a, b) => a + b, 0);
  const filtered = prixList.filter(p =>
    (p?.nom || p?.TypesPrestations?.nom || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[85vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-800 text-sm">Sélectionner les analyses</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm">✕</button>
        </div>
        <div className="p-3 border-b">
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.map((item) => {
            const key = String(item.id);
            const isSel = !!selected[key];
            return (
              <div key={item.id} onClick={() => toggle(item)} className={`flex items-center justify-between px-4 py-2.5 cursor-pointer border-b border-gray-50 transition-colors ${isSel ? "bg-green-50" : "hover:bg-gray-50"}`}>
                <span className="text-sm text-gray-800">{item?.nom || item?.TypesPrestations?.nom || `Analyse #${item.id}`}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-medium">{parseFloat(item.prix).toLocaleString("fr-FR")} DA</span>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center text-[11px] ${isSel ? "bg-green-600 border-green-600 text-white" : "border-gray-300"}`}>{isSel ? "✓" : ""}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t bg-gray-50 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Total sélectionné :</span>
            <span className="font-bold text-gray-900 text-base">{total.toLocaleString("fr-FR")} DA</span>
          </div>
          {total > 0 && (
            <div className="flex gap-4 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-gray-500">Part OS (70%) : <strong className="text-green-700">{Math.round(total * 0.7).toLocaleString("fr-FR")} DA</strong></span>
              <span className="text-gray-500">Part perso (30%) : <strong className="text-orange-700">{Math.round(total * 0.3).toLocaleString("fr-FR")} DA</strong></span>
            </div>
          )}
          <button onClick={() => { onConfirm(total); onClose(); }} disabled={total === 0} className="w-full py-2.5 bg-green-700 text-white rounded-xl font-bold text-sm hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition">
            Confirmer {total > 0 ? `— ${total.toLocaleString("fr-FR")} DA` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function FormulairePriseEnCharge() {
  const [activeTab, setActiveTab] = useState("ajouter");

  const initialFormState = {
    ref: "", dateForm: new Date().toLocaleDateString("fr-FR"), prestation: "", conventionStartDate: "", conventionEndDate: "",
    fNom: "", fPrenom: "", fDateLieu: "", fFonction: "", fVivant: "Oui",
    pNom: "", pPrenom: "", pDateLieu: "", pLien: "",
    nbDate: "", nbDelivre: "", montantTotal: "", sfEtablissement: "", agentNom: ""
  };

  const [resteDisponible, setResteDisponible] = useState(null);
  const [history, setHistory] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [cliniques, setCliniques] = useState([]);
  const [selectedUserFull, setSelectedUserFull] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [demandesEnLigne, setDemandesEnLigne] = useState([]);
  const [agents, setAgents] = useState([]);
  const [plafondGeneral, setPlafondGeneral] = useState(130000);
  const [plafondDentaire, setPlafondDentaire] = useState(50000);
  const [plafondOphta, setPlafondOphta] = useState(50000);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [avenants, setAvenants] = useState([]);
  const [typesprestations, setTypesPrestations] = useState([]);
  const [showPrixModal, setShowPrixModal] = useState(false);
  const [prixList, setPrixList] = useState([]);
  const [filtreDebut, setFiltreDebut] = useState("");
  const [filtreFin, setFiltreFin] = useState("");
  const [filtreNom, setFiltreNom] = useState("");
  const [loadingPlafonds, setLoadingPlafonds] = useState(true);
  const [agentConnecte, setAgentConnecte] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
 const [isManualInput, setIsManualInput] = useState(false);
  const downloadPEC = useDownloadPEC();
const [openCliniques, setOpenCliniques] = useState({});
  const inputLine = "border-b border-dotted border-black bg-transparent outline-none focus:bg-blue-50 px-1 transition-colors";
  const selectStyle = "border-b border-dotted border-black bg-transparent outline-none cursor-pointer hover:bg-blue-50 transition-colors";

  const getLastDayOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString("fr-FR");
  };

  const fetchDemandesEnLigne = async () => {
    try {
      const data = await apiFetch("/demandes");
      const list = Array.isArray(data) ? data : Array.isArray(data?.demandes) ? data.demandes : Array.isArray(data?.data) ? data.data : [];
      setDemandesEnLigne(list);
    } catch (err) {
      console.error("Erreur chargement demandes:", err);
      setDemandesEnLigne([]);
    }
  };
// Fonction à ajouter dans FormulairePriseEnCharge
const prefillFromDemande = (demande) => {
  // Cherche l'utilisateur correspondant pour récupérer sa photo
  const nomParts = (demande.nom_beneficiaire || "").trim().split(" ");
  const nomSearch = nomParts[0] || "";

  setFormData(prev => ({
    ...prev,
    fNom: demande.nom_beneficiaire || "",
    fPrenom: "",                          // la demande n'a qu'un nom complet, tu peux splitter si besoin
    fDateLieu: demande.date_naissance
      ? `${new Date(demande.date_naissance).toLocaleDateString("fr-FR")} à ${demande.lieu_naissance || ""}`
      : "",
    fFonction: demande.fonction || "",
    prestation: demande.type_prestation || "",
    pNom: demande.nom_beneficiaire || "",
    pPrenom: "",
    pLien: "Lui-même",
  }));

  // Charge la photo si elle existe sur la demande
  if (demande.photo) {
    setPhotoUrl(
      demande.photo.startsWith("http")
        ? demande.photo
        : `http://localhost:5001/${demande.photo.replace(/^\//, "")}`
    );
  }

  setActiveTab("ajouter");
};


const fetchPrix = async () => {
  if (!formData.sfEtablissement) { 
    alert("Sélectionne une clinique d'abord"); 
    return; 
  }
  try {
    const result = await apiFetch(`/prix-prestations/clinique/${formData.sfEtablissement}`);
    const list = Array.isArray(result) ? result 
      : Array.isArray(result?.data) ? result.data 
      : Array.isArray(result?.prix) ? result.prix 
      : [];

    if (list.length === 0) {
      // Pas de prix en base → saisie manuelle
      setIsManualInput(true);
    } else {
      setPrixList(list);
      setShowPrixModal(true);
    }
  } catch (err) {
    console.error("❌ fetchPrix error:", err);
    // En cas d'erreur aussi on laisse saisir manuellement
    setIsManualInput(true);
  }
};

  useEffect(() => {
    if (activeTab === "en_ligne") fetchDemandesEnLigne();
  }, [activeTab]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await apiFetch("/demandes");
        const list = Array.isArray(data) ? data : Array.isArray(data?.demandes) ? data.demandes : [];
        setDemandesEnLigne(list);
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const nbAttente = demandesEnLigne.filter(d => d.statut === "En attente").length;
  const nbNewNotifications = demandesEnLigne.filter(d => {
    const diff = Date.now() - new Date(d.createdAt).getTime();
    return diff < 24 * 60 * 60 * 1000;
  }).length;
  const hasUnread = nbNewNotifications > lastSeenCount;

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const result = await apiFetch("/agents");
        const list = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : Array.isArray(result?.agents) ? result.agents : [];
        setAgents(list);
      } catch (err) { setAgents([]); }
    };
    fetchAgents();
  }, []);

useEffect(() => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;
    const payload = JSON.parse(atob(token.split(".")[1]));
    const nom    = payload.nom    || "";
    const prenom = payload.prenom || "";
    setAgentConnecte(`${nom} ${prenom}`.trim().toUpperCase());
  } catch (e) {
    setAgentConnecte("—");
  }
}, []);
  useEffect(() => {
    const fetchTypesPrestations = async () => {
      try {
        const data = await apiFetch("/typesprestations");
        setTypesPrestations(Array.isArray(data) ? data : data?.data || []);
      } catch (err) { setTypesPrestations([]); }
    };
    fetchTypesPrestations();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchPlafonds();
        const [clinicsData, historyData] = await Promise.all([apiFetch("/clinics/all"), apiFetch("/prise-en-charge/all")]);
        if (clinicsData) setCliniques(clinicsData);
        if (historyData) {
          const list = Array.isArray(historyData) ? historyData : Array.isArray(historyData?.data) ? historyData.data : Array.isArray(historyData?.prises) ? historyData.prises : [];
          const currentYear = new Date().getFullYear();
          setHistory(list.filter(item => new Date(item.createdAt).getFullYear() === currentYear));
        }
      } catch (err) { console.error("ERREUR RÉSEAU:", err); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const genererRef = async () => {
      if (!formData.sfEtablissement || formData.sfEtablissement === "undefined" || cliniques.length === 0) return;
      const selected = cliniques.find(c => String(c.id) === String(formData.sfEtablissement));
      if (selected && selected.id) {
        try {
          const data = await apiFetch(`/prise-en-charge/prochain-numero/${selected.id}`);
          if (!data) return;
          const year = new Date().getFullYear();
          setFormData(prev => ({
            ...prev,
            ref: `${selected.numeroSequence || 'REF'}/${data.next || 1}/SG/COS/${year}`,
            conventionStartDate: selected.dateAjout ? selected.dateAjout.split("T")[0] : "",
          }));
        } catch (err) {}
      }
    };
    genererRef();
  }, [formData.sfEtablissement, cliniques]);

  useEffect(() => {
    if (selectedUserFull && formData.prestation) calculerReste(selectedUserFull, formData.prestation);
  }, [plafondGeneral, plafondDentaire, plafondOphta, history, selectedUserFull, formData.prestation]);

  const calculerReste = (user, prestation) => {
    if (!user) return;
    const avenantsArray = Array.isArray(avenants) ? avenants : [];
    const prestUpper = (prestation || "").toUpperCase();
    const isDentaire = prestUpper.includes("DENT");
    const isOphta = prestUpper.includes("OPHTA") || prestUpper.includes("OEIL");
    const currentYear = new Date().getFullYear();

    let plafondApplique = plafondGeneral;
    if (isDentaire) plafondApplique = plafondDentaire;
    if (isOphta) plafondApplique = plafondOphta;

    const totalPrises = history
      .filter(item => {
        if (item.annule) return false;
        const sameUser = item.fNom?.toUpperCase() === user.nomComplet.toUpperCase() && item.fPrenom?.toUpperCase() === user.prenomComplet.toUpperCase();
        if (!sameUser) return false;
        const itemPrest = item.prestation.toUpperCase();
        if (isDentaire) return itemPrest.includes("DENT");
        if (isOphta) return itemPrest.includes("OPHTA") || itemPrest.includes("OEIL");
        return !itemPrest.includes("DENT") && !itemPrest.includes("OPHTA") && !itemPrest.includes("OEIL");
      })
      .reduce((sum, item) => sum + parseFloat(item.montantTotal || 0), 0);

    const normalize = (str) => (str || "").toLowerCase().replace(/\s+/g, "").trim();
    const totalAvenants = avenantsArray
      .filter(d => {
        if (new Date(d.createdAt).getFullYear() !== currentYear) return false;
        const nomDos = normalize(d.nom_beneficiaire);
        const nomUserNorm = normalize(user.nomComplet);
        if (!nomDos.includes(nomUserNorm) && !nomUserNorm.includes(nomDos)) return false;
        if (parseFloat(d.montant_avenant || 0) <= 0) return false;
        const p = (d.type_prestation || "").toUpperCase();
        if (isDentaire) return p.includes("DENT");
        if (isOphta) return p.includes("OPHTA") || p.includes("OEIL");
        return true;
      })
      .reduce((sum, d) => sum + parseFloat(d.montant_avenant || 0), 0);

    const solde = plafondApplique - (totalPrises + totalAvenants);
    setResteDisponible(solde);
    setIsBlocked(solde <= 0);
  };

  useEffect(() => {
    if (selectedUserFull) calculerReste(selectedUserFull, formData.prestation);
  }, [formData.prestation, history, avenants]);

  useEffect(() => {
    const fetchAvenants = async () => {
      try {
        const data = await apiFetch("/dossiers/liste-generale");
        if (data) setAvenants(data);
      } catch (err) {}
    };
    fetchAvenants();
  }, []);

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
  if (name === "sfEtablissement") setIsManualInput(false); // reset au changement de clinique
  if (name === "fNom") fetchSuggestions(value);
  if (name === "montantTotal") {
    const montantSaisi = parseFloat(value || 0);
    setIsBlocked(resteDisponible !== null && (montantSaisi > resteDisponible || resteDisponible <= 0));
  }
};
  const fetchPlafonds = async () => {
    setLoadingPlafonds(true);
    try {
      const settings = await apiFetch("/settings");
      if (settings) {
        if (settings.plafond_general) setPlafondGeneral(Number(settings.plafond_general));
        if (settings.plafond_dentaire) setPlafondDentaire(Number(settings.plafond_dentaire));
        if (settings.plafond_ophta) setPlafondOphta(Number(settings.plafond_ophta));
      }
    } catch (err) {}
    finally { setLoadingPlafonds(false); }
  };

  const fetchSuggestions = async (term) => {
    if (term.length > 1) {
      try {
        const data = await apiFetch(`/users/search?term=${term}`);
        if (data) setSuggestions(data);
        setShowSuggestions(true);
      } catch (err) {}
    }
  };

  const selectUser = (user) => {
    setSelectedUserFull(user);
    setFormData(prev => ({
      ...prev, fNom: user.nomComplet, fPrenom: user.prenomComplet,
      fFonction: user.position || user.role || "",
      fDateLieu: `${new Date(user.dateNaissance).toLocaleDateString()} à ${user.lieuNaissance}`,
      pNom: "", pPrenom: "", pDateLieu: "", pLien: ""
    }));
    calculerReste(user, formData.prestation);
    setPhotoUrl(user.photo ? (user.photo.startsWith('http') ? user.photo : `http://localhost:5001/${user.photo.replace(/^\//, '')}`) : null);
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (isBlocked) return;
    try {
      const dataToSend = {
        ref: formData.ref, dateForm: formData.dateForm, prestation: formData.prestation,
        conventionStartDate: formData.conventionStartDate || null,
        fNom: formData.fNom, fPrenom: formData.fPrenom, fDateLieu: formData.fDateLieu,
        fFonction: formData.fFonction, fVivant: formData.fVivant,
        pNom: formData.pNom, pPrenom: formData.pPrenom, pDateLieu: formData.pDateLieu, pLien: formData.pLien || null,
        montantTotal: parseFloat(formData.montantTotal || 0),
        montantOS: parseFloat(formData.montantTotal || 0) * 0.7,
        montantPerso: parseFloat(formData.montantTotal || 0) * 0.3,
        nbDate: formData.nbDate, nbDelivre: formData.nbDelivre,
        agentNom: agentConnecte || formData.agentNom,
        sfEtablissement: formData.sfEtablissement,
      };
      const response = await apiFetch("/prise-en-charge/", { method: "POST", body: JSON.stringify(dataToSend) });
      if (response) {
        alert("✅ Enregistré avec succès !");
        window.location.reload();
      } else {
        alert("❌ Erreur lors de l'enregistrement");
      }
    } catch (err) { alert("❌ Erreur de connexion au serveur"); }
  };

  const handleReset = () => {
    if (window.confirm("Voulez-vous vraiment réinitialiser ?")) {
      setFormData(initialFormState);
      setPhotoUrl(null);
      setSelectedUserFull(null);
      setResteDisponible(null);
      setIsBlocked(false);
    }
  };
const ouvrirDossier = (demande) => {
  // Prendre la version fraîche depuis demandesEnLigne si disponible
  const fraiche = demandesEnLigne.find(d => d.id === demande.id) || demande;
  setSelectedDemande(fraiche);
  setShowModal(true);
};
// 2. Dans executerDecision, mettre à jour selectedDemande après la décision
 const executerDecision = async (id, action, motif, messageClient) => {
  try {
    const body = action === "valider" 
      ? { message_client: messageClient } 
      : { motif_refus: motif, message_client: messageClient };
      
    const res = await apiFetch(
      action === "valider" ? `/demandes/valider/${id}` : `/demandes/rejeter/${id}`,
      { method: "POST", body: JSON.stringify(body) }
    );
    if (!res) throw new Error("Réponse serveur invalide");
    
    alert("✅ Action réussie !");
    await fetchDemandesEnLigne();

  } catch (err) {
    alert("❌ Erreur lors de la décision");
  }
};
  const annulerPrise = async (id) => {
    if (!window.confirm("Voulez-vous annuler cette prise en charge ?")) return;
    try {
      await apiFetch(`/prise-en-charge/annuler/${id}`, { method: "PUT" });
      alert("✅ Prise en charge annulée");
      const data = await apiFetch("/prise-en-charge/all");
      if (data) setHistory(data);
    } catch (err) { alert("❌ Erreur lors de l'annulation"); }
  };

  const getSoldeLabel = () => {
    const p = formData.prestation.toUpperCase();
    if (p.includes("DENT")) return "Dentaire";
    if (p.includes("OPHTA") || p.includes("OEIL")) return "Ophtalmique";
    return "Général";
  };

  const qrData = [
    `REF: ${formData.ref}`, `DATE: ${formData.dateForm}`, `PRESTATION: ${formData.prestation}`,
    `FONCTIONNAIRE: ${formData.fNom} ${formData.fPrenom}`, `FONCTION: ${formData.fFonction}`,
    `PATIENT: ${formData.pNom} ${formData.pPrenom}`, `LIEN: ${formData.pLien || "Lui-même"}`,
    `ETABLISSEMENT: ${cliniques.find(c => String(c.id) === String(formData.sfEtablissement))?.nom || ""}`,
    `MONTANT TOTAL: ${formData.montantTotal} DA`,
    `PART OS (70%): ${Math.round(parseFloat(formData.montantTotal||0)*0.7)} DA`,
    `PART PERSO (30%): ${Math.round(parseFloat(formData.montantTotal||0)*0.3)} DA`,
    `AGENT: ${formData.agentNom}`,
  ].join("\n");

  return (
    <div className="min-h-screen bg-gray-100 py-4 font-serif print:bg-white print:p-0">
   <style>{`
  @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
  .animate-slideDown { animation: slideDown 0.2s ease; }
  .animate-fadeIn { animation: fadeIn 0.2s ease; }

  @media print {
    /* ✅ Cache tout sauf le formulaire */
    .tabs-nav, .tab-en-ligne, .tab-consulter, nav, header { display: none !important; }
    
    /* ✅ Reset complet pour l'impression */
    * { box-sizing: border-box !important; }
    
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 210mm !important;
      max-width: 210mm !important;
    }

  @page {
    size: A4 portrait;
    margin: 10mm 15mm 10mm 15mm;
    /* Supprime les en-têtes/pieds de page du navigateur */
    margin-top: 10mm;
  }
     html {
    margin: 0 !important;
  }
    /* ✅ Le conteneur principal prend toute la largeur */
    .min-h-screen {
      background: white !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    /* ✅ Le formulaire s'adapte à la page */
    .mx-auto.w-\\[210mm\\] {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
    }

    /* ✅ Cache les selects — affiche leur valeur en texte */
    select {
      -webkit-appearance: none !important;
      border: none !important;
      border-bottom: 1.5px solid black !important;
      background: transparent !important;
    }

    input[type="text"], input[type="date"], input:not([type]) {
      border: none !important;
      border-bottom: 1.5px solid black !important;
      background: transparent !important;
      min-width: 80px;
    }

    input[type="radio"] { display: inline !important; }

    .sf-line-empty {
      border-bottom: 1.5px solid black !important;
      min-width: 80px;
      display: inline-block;
    }

    /* ✅ Cache les boutons flottants */
    .fixed { display: none !important; }

    /* ✅ Empêche les coupures dans les sections importantes */
    .border-t { page-break-inside: avoid; }
  }

  .print-field {
    display: inline-block;
    min-width: 160px;
    border-bottom: 1px dotted black;
    padding: 2px 4px;
    font-weight: bold;
    text-transform: uppercase;
  }
  .print-field:empty::after {
    content: "____________________";
    letter-spacing: 2px;
  }
    @media print {
  /* Cache la sidebar — adapte le sélecteur à ton layout */
  aside,
  nav,
  [class*="sidebar"],
  [class*="Sidebar"],
  [class*="side-bar"],
  [id*="sidebar"],
  
  /* Si c'est un div avec une classe spécifique */
  .sidebar,
  .nav-sidebar,
  .left-panel { 
    display: none !important; 
  }

  /* ✅ Le contenu principal prend toute la largeur */
  main,
  [class*="main-content"],
  [class*="content"] {
    margin-left: 0 !important;
    padding-left: 0 !important;
    width: 100% !important;
  }
}
`}</style>

      {/* ── MODALS ── */}
      {showModal && (
        // Dans le JSX du DossierModal, ajoute le prop :
<DossierModal
  demande={selectedDemande}
  onClose={() => { setShowModal(false); setSelectedDemande(null); }}
  onDecision={executerDecision}
  cliniques={cliniques}
  onUploadSuccess={fetchDemandesEnLigne}
  onPrefillForm={prefillFromDemande}   // ← ajouter
/>
      )}
      {showPrixModal && (
        <PrixModal prixList={prixList} onClose={() => setShowPrixModal(false)} onConfirm={(total) => setFormData(prev => ({ ...prev, montantTotal: total }))} />
      )}
  

      {/* ── NOTIFICATION PANEL ── */}
      <NotificationPanel
        demandes={demandesEnLigne}
        isOpen={showNotifications}
        onClose={() => { setShowNotifications(false); setLastSeenCount(nbNewNotifications); }}
        onOpenDossier={ouvrirDossier}
      />

      {/* ── BOUTON CLOCHE FLOTTANT ── */}
      <div className="fixed top-4 right-4 z-40 print:hidden">
        <button
          onClick={() => { setShowNotifications(v => !v); if (!showNotifications) setLastSeenCount(nbNewNotifications); }}
          className="relative w-11 h-11 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-105"
          title="Notifications"
        >
          <span className="text-xl">🔔</span>
          {nbAttente > 0 && (
            <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 ${hasUnread ? "animate-bounce" : ""}`}>
              {nbAttente}
            </span>
          )}
        </button>
      </div>

      {/* ── ONGLETS ── */}
      <div className="tabs-nav mx-auto w-[210mm] flex gap-2 mb-4 print:hidden px-2">
        {[
          { key: "ajouter",   label: "👤+ Ajouter Prise en Charge", color: "green" },
          { key: "consulter", label: "📋 Consulter la Liste",        color: "blue"  },
        ].map(({ key, label, color }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-6 py-2 rounded-t-lg font-bold transition-all ${activeTab === key ? `bg-white text-${color}-700 shadow-sm border-t-2 border-${color}-600` : "bg-gray-200 text-gray-500 hover:bg-gray-300"}`}>
            {label}
          </button>
        ))}
        <button onClick={() => setActiveTab("en_ligne")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold transition-all ${activeTab === "en_ligne" ? "bg-white text-orange-700 border-t-2 border-orange-600 shadow" : "bg-gray-200 text-gray-500"}`}>
          🌐 Demandes en Ligne
          {nbAttente > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce">{nbAttente}</span>
          )}
        </button>
      </div>

      {/* ── ONGLET : DEMANDES EN LIGNE ── */}
      {activeTab === "en_ligne" && (
        <div className="tab-en-ligne mx-auto w-full max-w-6xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Reçues",  val: demandesEnLigne.length,                                        color: "blue"   },
              { label: "En Attente",    val: demandesEnLigne.filter(d => d.statut === "En attente").length, color: "orange" },
              { label: "Validées",      val: demandesEnLigne.filter(d => d.statut === "Validée").length,    color: "green"  },
              { label: "Refusées",      val: demandesEnLigne.filter(d => d.statut === "Rejetée").length,    color: "red"    },
            ].map(({ label, val, color }) => (
              <div key={label} className={`bg-white p-5 rounded-xl shadow-sm border-l-4 border-${color}-500`}>
                <p className="text-gray-400 text-xs font-bold uppercase">{label}</p>
                <p className={`text-2xl font-black text-${color}-600`}>{val}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[11px] uppercase text-gray-500 font-bold">
                  <tr>
                    <th className="px-5 py-4">Bénéficiaire</th>
                    <th className="px-5 py-4">Prestation</th>
                    <th className="px-5 py-4">Pièces jointes</th>
                    <th className="px-5 py-4">Statut</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {demandesEnLigne.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Aucune demande reçue.</td></tr>
                  ) : demandesEnLigne.map((d) => {
                    const pieces = d.pieces || [];
                    const hasPEC = !!d.fichier_prise_en_charge;
                    return (
              <tr key={d.id} className="hover:bg-blue-50/40 transition-colors">
  <td className="px-5 py-4">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-black text-xs">
        {d.nom_beneficiaire?.charAt(0)?.toUpperCase()}
      </div>
      <div>
        <span className="font-bold text-gray-800 text-sm">{d.nom_beneficiaire}</span>
        {d.pour_qui === "autre" && d.ayant_nom && (
          <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
            👨‍👩‍👧 Ayant droit : {d.ayant_prenom} {d.ayant_nom}
            {d.ayant_lien && ` (${d.ayant_lien})`}
          </p>
        )}
      </div>
    </div>
  </td>
  <td className="px-5 py-4">
    <span className="bg-gray-100 px-2 py-1 rounded-full text-[11px] font-medium text-gray-600">{d.type_prestation}</span>
  </td>
  <td className="px-5 py-4">
    {pieces.length > 0 ? (
      <button onClick={() => ouvrirDossier(d)} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full text-[11px] font-bold hover:bg-blue-100 transition">
        📎 {pieces.length} fichier{pieces.length > 1 ? "s" : ""}
      </button>
    ) : (
      <span className="text-gray-300 text-xs">—</span>
    )}
  </td>
  <td className="px-5 py-4"><StatusBadge status={d.statut} /></td>
  <td className="px-5 py-4 text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
  <td className="px-5 py-4 text-right">
    <button onClick={() => ouvrirDossier(d)} className="bg-gray-900 text-white text-[10px] px-4 py-2 rounded-lg hover:bg-black transition font-bold">
      OUVRIR →
    </button>
  </td>
</tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ONGLET : FORMULAIRE D'AJOUT ── */}
      {activeTab === "ajouter" && (
        <div className="mx-auto w-[210mm] min-h-[290mm] bg-white p-10 shadow-lg border border-gray-200 text-[13px] leading-tight text-gray-800 print:shadow-none print:border-none print:m-0 print:p-8">
          <div className="flex justify-between items-start mb-4">
            <div className="relative w-24 h-28 border border-gray-300 flex items-center justify-center text-[10px] text-gray-400">
              {photoUrl ? <img src={photoUrl} className="w-full h-full object-cover" alt="User" /> : "PHOTO"}
            </div>
            <div className="text-center flex-1 px-4 uppercase font-bold text-[10px]">
              <p>République Algérienne Démocratique et Populaire</p>
              <p className="font-normal normal-case italic text-[9px]">Ministère de l'enseignement supérieur et de la recherche scientifique</p>
              <p>Université « Mouloud Mammeri » de Tizi-Ouzou</p>
              <p className="mt-1 text-blue-900 text-[11px]">Commission des Œuvres Sociales</p>
              <p className="text-[10px]">Structure de Gestion</p>
            </div>
            <div className="w-20">
              <img src="/image2.png" alt="Logo" className="w-full object-contain" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-black underline uppercase">Prise en Charge</h1>
            <div className="flex justify-between mt-4 px-2">
              <div><span className="font-bold">Réf :</span> <span className="border-b min-w-[150px] inline-block font-mono">{formData.ref}</span></div>
              <div><span className="font-bold">Date :</span> <span className="border-b px-2">{formData.dateForm}</span></div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span>Nous avons l'honneur de vous adresser le patient dont les références suivent pour :</span>
              <select name="prestation" value={formData.prestation} onChange={handleChange} className={`${selectStyle} flex-1 font-bold text-blue-800`}>
                <option value="">-- Sélectionner --</option>
                {typesprestations.map((p) => (<option key={p.id} value={p.nom}>{p.nom}</option>))}
              </select>
            </div>

            <div>
              <span>Entrant dans le cadre de la convention médicale paraphée en date du </span>
              <span className="font-bold border-b px-2">{getLastDayOfMonth()}</span>
            </div>

            <div className="border-t pt-2 space-y-3">
              <h3 className="font-bold underline text-[12px] uppercase">Le Fonctionnaire :</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <span className="font-bold">NOM :</span>
                  <input name="fNom" value={formData.fNom} onChange={handleChange} className={`${inputLine} w-48 uppercase`} autoComplete="off" />
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white border shadow-lg mt-1 rounded-lg overflow-hidden">
                      {suggestions.map(u => (
                        <li key={u.id} onClick={() => selectUser(u)} className="p-2 hover:bg-blue-50 cursor-pointer text-[11px] border-b last:border-0">
                          {u.nomComplet} {u.prenomComplet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div><span className="font-bold">Prénom :</span> <input name="fPrenom" value={formData.fPrenom} onChange={handleChange} className={inputLine} /></div>
              </div>
              <div><span>Date et lieu de Naissance :</span> <input name="fDateLieu" value={formData.fDateLieu} onChange={handleChange} className={`${inputLine} w-2/3`} /></div>
              <div className="flex gap-4 items-center flex-wrap">
                <span className="font-bold">Fonction :</span>
                {["ATS", "ENSEIGNANT", "RETRAITE"].map(f => (
                  <label key={f} className="flex items-center gap-1">
                    <input type="radio" name="fFonction" value={f} checked={formData.fFonction === f} onChange={handleChange} /> {f}
                  </label>
                ))}
                {formData.fFonction === "RETRAITE" && (
                  <div className="ml-4 flex gap-3 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                    {[{ val: "Oui", label: "Vivant", cls: "text-green-700" }, { val: "Non", label: "Décédé", cls: "text-red-700" }].map(({ val, label, cls }) => (
                      <label key={val} className={`flex items-center gap-1 font-bold ${cls}`}>
                        <input type="radio" name="fVivant" value={val} checked={formData.fVivant === val} onChange={handleChange} /> {label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-2 space-y-3">
              <h3 className="font-bold underline text-[12px] uppercase">Le Patient :</h3>
              <div className="flex items-center gap-3">
                <span className="font-bold text-red-800">Bénéficiaire :</span>
                <select className={selectStyle} onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setFormData(p => ({ ...p, pNom: "", pPrenom: "", pDateLieu: "", pLien: "" }));
                  } else if (val === "self") {
                    setFormData(p => ({ ...p, pNom: p.fNom, pPrenom: p.fPrenom, pDateLieu: p.fDateLieu, pLien: "Lui-même" }));
                  } else if (selectedUserFull?.ayantDroits) {
                    const ad = selectedUserFull.ayantDroits[val];
                    setFormData(p => ({
                      ...p, pNom: ad.nom || "", pPrenom: ad.prenom || "",
                      pDateLieu: ad.dateNaissance ? `${new Date(ad.dateNaissance).toLocaleDateString()} à ${ad.lieuNaissance || ''}` : "",
                      pLien: ad.lien || ""
                    }));
                    if (typeof ad.photo === "string") setPhotoUrl(ad.photo.startsWith("http") ? ad.photo : `http://localhost:5001/${ad.photo.replace(/^\//, "")}`);
                    else setPhotoUrl(null);
                  }
                }}>
                  <option value="">-- Choisir un bénéficiaire --</option>
                  <option value="self">L'assuré lui-même</option>
                  {selectedUserFull?.ayantDroits?.map((ad, i) => (
                    <option key={i} value={i}>{ad.nom} {ad.prenom} ({ad.lien})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-bold">Nom :</span><span className="print-field">{formData.pNom || ""}</span></div>
                <div><span className="font-bold">Prénom :</span><span className="print-field">{formData.pPrenom || ""}</span></div>
              </div>
              <div><span className="font-bold">Date et lieu de Naissance :</span><span className="print-field">{formData.pDateLieu || ""}</span></div>
            </div>

            <div className="text-[10px] italic border-l-4 border-gray-400 pl-2">
              <p>NB: Valable uniquement pour la prescription médicale du <input name="nbDate" value={formData.nbDate} onChange={handleChange} className={inputLine} /></p>
              <p>Délivrée par : <input name="nbDelivre" value={formData.nbDelivre} onChange={handleChange} className={inputLine} /></p>
              {resteDisponible !== null && (
                <div className={`mt-2 p-1 px-2 inline-block rounded font-bold print:hidden ${isBlocked ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-green-100 text-green-700'}`}>
                  Solde {getSoldeLabel()} ({new Date().getFullYear()}) : {resteDisponible.toLocaleString()} DA
                  {isBlocked && " — DÉPASSEMENT OU PLAFOND ATTEINT !"}
                </div>
              )}
              <p className="font-bold mt-1 text-black">
                Montant pris en charge :
               <input
  name="montantTotal"
  value={formData.montantTotal}
  onChange={handleChange}
  onClick={(!isManualInput && formData.sfEtablissement) ? fetchPrix : undefined}
  className={`border-b-2 border-black w-32 font-black text-sm px-2 outline-none 
    ${isManualInput ? "cursor-text bg-yellow-50" : "cursor-pointer"} 
    ${isBlocked ? "text-red-600 bg-red-50" : "text-black"}`}
  readOnly={!isManualInput && !!formData.sfEtablissement}
  placeholder={
    isManualInput ? "Saisir montant" 
    : formData.sfEtablissement ? "Cliquer pour choisir" 
    : ""
  }
/> DA
              </p>
              {formData.montantTotal > 0 && (
                <div className="flex gap-4 text-[10px] mt-1">
                  <span className="text-green-700 font-bold">Part OS (70%) : {Math.round(parseFloat(formData.montantTotal) * 0.7).toLocaleString("fr-FR")} DA</span>
                  <span className="text-orange-700 font-bold">Part perso (30%) : {Math.round(parseFloat(formData.montantTotal) * 0.3).toLocaleString("fr-FR")} DA</span>
                </div>
              )}
            </div>

            <p className="text-[9px] text-justify leading-tight text-gray-500">
              Toute utilisation frauduleuse de la présente convention expose son auteur à des suites qui seront décidées par les œuvres sociales "y compris des ponctions sur salaire jusqu'à concurrence de la somme due"
            </p>

            <div className="flex justify-between font-bold underline mt-4">
              <div className="text-center"><p>L'intéressé(e)</p><div className="mt-8 border-t border-black w-32 mx-auto" /></div>
              <div className="text-center"><p>La Structure de Gestion</p><div className="mt-8 border-t border-black w-32 mx-auto" /></div>
            </div>
          </div>

     {/* ── BAS DU FORMULAIRE : SERVICE FAIT + QR + SIGNATURES ── */}
<div className="mt-10" style={{ fontFamily: "'Times New Roman', serif", fontSize: "12px", color: "#000" }}>

  {/* Ligne séparatrice */}
  <hr style={{ border: "none", borderTop: "1.5px solid black", margin: "0 0 12px 0" }} />

  <h2 style={{ textAlign: "center", fontSize: "14px", fontWeight: "bold", textDecoration: "underline", textTransform: "uppercase", marginBottom: "14px", letterSpacing: "1px" }}>
    Service Fait
  </h2>

  {/* Lignes à remplir */}
  <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", marginBottom: "10px" }}>
    <span>Nom et Prénom du patient :</span>
    <div style={{ flex: 1, borderBottom: "1px solid black" }}></div>
  </div>
  <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", marginBottom: "10px" }}>
    <span>Date et lieu de Naissance :</span>
    <div style={{ flex: 1, borderBottom: "1px solid black" }}></div>
  </div>
  <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", marginBottom: "10px" }}>
    <span>Désignation de la prestation :</span>
    <div style={{ flex: 1, borderBottom: "1px solid black" }}></div>
  </div>
  <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", marginBottom: "10px", fontWeight: "bold" }}>
    <span>Montant de la prestation "70%" :</span>
    <div style={{ flex: 1, borderBottom: "1px solid black" }}></div>
    <span>DA</span>
  </div>

  {/* QR + Clinique */}
  {/* QR + Clinique */}
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "20px" }}>

    <div style={{ minWidth: "220px" }}></div>

    {/* QR code au centre */}
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1 }}>
      <div style={{ border: "3px solid black", padding: "5px", display: "inline-block" }}>
        <QRCodeSVG value={qrData} size={90} />
      </div>
      <p style={{ fontSize: "9px", textAlign: "center", margin: 0, color: "#000" }}>
        Scannez ce code pour authentifier le document.
      </p>
      <p style={{ fontSize: "9px", textAlign: "center", margin: 0, color: "#555" }}>
        Œuvres Sociales — UMMTO
      </p>
    </div>

    {/* Signature clinique à droite */}
    <div style={{ textAlign: "center", minWidth: "220px" }}>
      <p style={{ fontSize: "11px", fontWeight: "bold", fontStyle: "italic", marginBottom: "4px" }}>
        La Clinique / Le Laboratoire
      </p>
      <select
        name="sfEtablissement"
        value={formData.sfEtablissement || ""}
        onChange={handleChange}
        style={{ width: "100%", textAlign: "center", fontWeight: "bold", color: "#7f1d1d", background: "transparent", border: "none", borderBottom: "1px solid black", outline: "none", textTransform: "uppercase", fontSize: "12px" }}
      >
        <option value="">-- Choisir une clinique --</option>
        {cliniques.map((c) => (
          <option key={c.id} value={String(c.id)}>{c.nom || c.nom_clinique}</option>
        ))}
      </select>
      <div style={{ borderTop: "1px solid black", marginTop: "40px", width: "180px", marginLeft: "auto", marginRight: "auto" }}></div>
    </div>

  </div>
  
  {/* Établi par + date */}
<div className="mt-6 pt-3 border-t border-dashed border-gray-300 text-[11px] text-gray-600 flex justify-between items-center print:border-gray-400">
  <div>
    <span className="font-bold uppercase text-gray-500">Établi par : </span>
    <span className="font-black text-gray-800 uppercase">{agentConnecte || formData.agentNom || "—"}</span>
  </div>
  <div className="text-gray-400 text-[10px]">{new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
</div>

</div>

        </div>
      )}

      {/* ── ONGLET : HISTORIQUE ── */}

{activeTab === "consulter" && (() => {
  const historiqueFiltré = history.filter(item => {
    const date = new Date(item.createdAt);
    if (filtreDebut && date < new Date(filtreDebut)) return false;
    if (filtreFin && date > new Date(filtreFin + "T23:59:59")) return false;
    const nomPatient = `${item.pNom || ""} ${item.pPrenom || ""}`.toLowerCase();
    const nomFonct = `${item.fNom || ""} ${item.fPrenom || ""}`.toLowerCase();
    if (filtreNom && !nomPatient.includes(filtreNom.toLowerCase()) && !nomFonct.includes(filtreNom.toLowerCase())) return false;
    return true;
  });

  // ── Groupement par clinique ──────────────────────────────────────────────
  const groupesByClinique = historiqueFiltré.reduce((acc, item) => {
    const key = String(item.sfEtablissement || "inconnu");
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const cliqueIds = Object.keys(groupesByClinique).sort();

  const toggleClinique = (id) => {
    setOpenCliniques(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = (val) => {
    const next = {};
    cliqueIds.forEach(id => { next[id] = val; });
    setOpenCliniques(next);
  };

  // ── Stats globales ───────────────────────────────────────────────────────
  const totalMontant = historiqueFiltré
    .filter(i => !i.annule)
    .reduce((s, i) => s + parseFloat(i.montantTotal || 0), 0);
  const totalPartOS = Math.round(totalMontant * 0.7);
  const totalPartPerso = Math.round(totalMontant * 0.3);

  const exportCSV = () => {
    const header = ["Référence","Patient","Fonctionnaire","Prestation","Montant Total","Part OS (70%)","Part Perso (30%)","Date","Agent","Statut","Clinique"];
    const rows = historiqueFiltré.map(i => {
      const clinique = cliniques.find(c => String(c.id) === String(i.sfEtablissement));
      return [
        i.ref || i.numeroSequentiel || "",
        `${i.pNom || ""} ${i.pPrenom || ""}`.trim(),
        `${i.fNom || ""} ${i.fPrenom || ""}`.trim(),
        i.prestation || "",
        i.montantTotal || 0,
        Math.round((i.montantTotal || 0) * 0.7),
        Math.round((i.montantTotal || 0) * 0.3),
        new Date(i.createdAt).toLocaleDateString("fr-FR"),
        i.agentNom || "",
        i.annule ? "Annulée" : "Active",
        clinique?.nom || clinique?.nom_clinique || i.sfEtablissement || "—",
      ];
    });
    const csv = [header, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prises_en_charge_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.csv`;
    a.click();
  };

  // ── Couleurs par index de clinique ───────────────────────────────────────
  const PALETTE = [
    { border: "#185FA5", bg: "#E6F1FB", text: "#0C447C" },
    { border: "#0F6E56", bg: "#E1F5EE", text: "#085041" },
    { border: "#993C1D", bg: "#FAECE7", text: "#712B13" },
    { border: "#993556", bg: "#FBEAF0", text: "#72243E" },
    { border: "#3B6D11", bg: "#EAF3DE", text: "#27500A" },
    { border: "#854F0B", bg: "#FAEEDA", text: "#633806" },
    { border: "#534AB7", bg: "#EEEDFE", text: "#3C3489" },
  ];

  return (
    <div className="tab-consulter mx-auto w-full max-w-5xl px-4 pb-10">

      {/* ── Stats globales ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Dossiers", val: historiqueFiltré.length, sub: "tous statuts" },
          { label: "Actifs", val: historiqueFiltré.filter(i => !i.annule).length, sub: "en cours", color: "emerald" },
          { label: "Annulés", val: historiqueFiltré.filter(i => i.annule).length, sub: "révoqués", color: "red" },
          { label: "Montant total", val: `${totalMontant.toLocaleString("fr-FR")} DA`, sub: `OS: ${totalPartOS.toLocaleString("fr-FR")} DA`, color: "blue" },
        ].map(({ label, val, sub, color }) => (
          <div key={label} className={`bg-white rounded-xl border border-gray-200 p-4 ${color ? `border-l-4 border-l-${color}-500` : ""}`}>
            <p className="text-[10px] font-bold uppercase text-gray-400">{label}</p>
            <p className={`text-xl font-black mt-0.5 ${color ? `text-${color}-700` : "text-gray-800"}`}>{val}</p>
            {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Barre filtres ── */}
      <div className="flex gap-2 mb-4 flex-wrap items-end bg-white border border-gray-200 rounded-xl p-3">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Du</label>
          <input type="date" value={filtreDebut} onChange={e => setFiltreDebut(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Au</label>
          <input type="date" value={filtreFin} onChange={e => setFiltreFin(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Recherche</label>
          <input type="text" value={filtreNom} onChange={e => setFiltreNom(e.target.value)}
            placeholder="Nom patient ou fonctionnaire..."
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 w-52" />
        </div>
        <button onClick={() => { setFiltreDebut(""); setFiltreFin(""); setFiltreNom(""); }}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200">
          🔄 Réinitialiser
        </button>
        <div className="ml-auto flex gap-2">
          <button onClick={() => toggleAll(true)}
            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200">
            Tout ouvrir
          </button>
          <button onClick={() => toggleAll(false)}
            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200">
            Tout fermer
          </button>
          <button onClick={exportCSV}
            className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-bold hover:bg-green-800 flex items-center gap-2">
            ⬇️ CSV
          </button>
        </div>
      </div>

      {/* ── Résumé filtré ── */}
      <p className="text-xs text-gray-400 mb-3 px-1">
        {historiqueFiltré.length} dossier{historiqueFiltré.length > 1 ? "s" : ""} · {cliqueIds.length} clinique{cliqueIds.length > 1 ? "s" : ""} · {new Date().getFullYear()}
      </p>

      {/* ── Blocs cliniques ── */}
      {cliqueIds.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400">
          <p className="text-3xl mb-2">🗂️</p>
          <p className="text-sm">Aucune prise en charge trouvée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cliqueIds.map((cid, idx) => {
            const rows = groupesByClinique[cid];
            const clinique = cliniques.find(c => String(c.id) === cid);
            const nomClinique = clinique?.nom || clinique?.nom_clinique || `Établissement #${cid}`;
            const actifs = rows.filter(r => !r.annule);
            const annules = rows.filter(r => r.annule);
            const sousTotal = actifs.reduce((s, r) => s + parseFloat(r.montantTotal || 0), 0);
            const isOpen = !!openCliniques[cid];
            const pal = PALETTE[idx % PALETTE.length];

            return (
              <div key={cid} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

                {/* ── En-tête clinique (cliquable) ── */}
                <button
                  onClick={() => toggleClinique(cid)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                  style={{ borderLeft: `4px solid ${pal.border}` }}
                >
                  {/* Icône */}
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: pal.bg }}>
                    🏥
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{nomClinique}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {rows.length} dossier{rows.length > 1 ? "s" : ""} · Montant actif : {sousTotal.toLocaleString("fr-FR")} DA
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {actifs.length > 0 && (
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {actifs.length} actif{actifs.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {annules.length > 0 && (
                      <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {annules.length} annulé{annules.length > 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-100">
                      {sousTotal.toLocaleString("fr-FR")} DA
                    </span>
                    <span className={`text-gray-400 text-sm transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>
                      ›
                    </span>
                  </div>
                </button>

                {/* ── Liste des dossiers ── */}
                {isOpen && (
                  <div className="border-t border-gray-100">

                    {/* En-tête colonnes */}
                    <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-gray-50 text-[10px] font-bold uppercase text-gray-400 border-b border-gray-100">
                      <div className="col-span-2">Référence</div>
                      <div className="col-span-2">Patient</div>
                      <div className="col-span-2">Fonctionnaire</div>
                      <div className="col-span-2">Prestation</div>
                      <div className="col-span-1 text-right">Montant</div>
                      <div className="col-span-1">Date</div>
                      <div className="col-span-1 text-center">Statut</div>
                      <div className="col-span-1 text-center">Actions</div>
                    </div>

                    {/* Lignes */}
                    {rows.map(item => {
                      const patient = (item.pNom && item.pPrenom)
                        ? `${item.pNom} ${item.pPrenom}`
                        : `${item.fNom || ""} ${item.fPrenom || ""}`.trim() || "—";

                      return (
                        <div
                          key={item.id}
                          className={`grid grid-cols-12 gap-2 px-5 py-3 border-b border-gray-50 text-[12px] items-center transition-colors
                            ${item.annule ? "bg-red-50/40 opacity-60" : "hover:bg-blue-50/30"}`}
                        >
                          {/* Référence */}
                          <div className="col-span-2 font-mono text-[11px] text-gray-500 truncate">
                            <span className={item.annule ? "line-through" : ""}>{item.ref || item.numeroSequentiel || "—"}</span>
                          </div>

                          {/* Patient */}
                          <div className="col-span-2 font-bold text-gray-800 uppercase truncate text-[11px]" title={patient}>
                            <span className={item.annule ? "line-through text-gray-400" : ""}>{patient}</span>
                          </div>

                          {/* Fonctionnaire */}
                          <div className="col-span-2 text-gray-500 truncate text-[11px]" title={`${item.fNom} ${item.fPrenom}`}>
                            <span className={item.annule ? "line-through" : ""}>{item.fNom} {item.fPrenom}</span>
                          </div>

                          {/* Prestation */}
                          <div className="col-span-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium truncate block max-w-full
                              ${item.annule ? "bg-gray-100 text-gray-400 line-through" : "bg-blue-50 text-blue-700"}`}>
                              {item.prestation}
                            </span>
                          </div>

                          {/* Montant */}
                          <div className="col-span-1 text-right">
                            <span className={`font-bold text-[11px] ${item.annule ? "text-gray-400 line-through" : "text-blue-900"}`}>
                              {(item.montantTotal || 0).toLocaleString("fr-FR")} DA
                            </span>
                          </div>

                          {/* Date */}
                          <div className="col-span-1 text-gray-400 text-[10px]">
                            {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                          </div>

                          {/* Statut */}
                          <div className="col-span-1 text-center">
                            {item.annule
                              ? <span className="text-red-400 text-[10px] font-bold italic">Annulée</span>
                              : <span className="text-emerald-600 text-[10px] font-bold">Active</span>
                            }
                          </div>

                          {/* Actions */}
                          <div className="col-span-1 flex gap-1 justify-center">
                            <button
                              onClick={() => downloadPEC(item, cliniques)}
                              title="Télécharger PDF"
                              className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition"
                            >
                              ⬇️
                            </button>
                            {!item.annule && (
                              <button
                                onClick={() => annulerPrise(item.id)}
                                title="Annuler"
                                className="bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-red-100 transition"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* ── Sous-total clinique ── */}
                    <div className="flex items-center gap-6 px-5 py-2.5 bg-gray-50 text-[11px] border-t border-gray-200">
                      <span className="text-gray-500">
                        Sous-total actif :
                        <strong className="text-gray-800 ml-1">{sousTotal.toLocaleString("fr-FR")} DA</strong>
                      </span>
                      <span className="text-gray-400">
                        Part OS (70%) :
                        <strong className="text-emerald-700 ml-1">{Math.round(sousTotal * 0.7).toLocaleString("fr-FR")} DA</strong>
                      </span>
                      <span className="text-gray-400">
                        Part perso (30%) :
                        <strong className="text-orange-700 ml-1">{Math.round(sousTotal * 0.3).toLocaleString("fr-FR")} DA</strong>
                      </span>
                      <span className="ml-auto text-gray-400">
                        Agent : <strong className="text-gray-600">{rows[0]?.agentNom || "—"}</strong>
                      </span>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
})()}

      {/* ── BOUTONS FLOTTANTS ── */}
      {activeTab === "ajouter" && (
        <div className="fixed bottom-5 right-5 flex gap-3 print:hidden">
          <button onClick={handleReset} className="bg-gray-500 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:bg-gray-600 transition-all">Réinitialiser</button>
          <button onClick={handleSave} disabled={isBlocked} className={`${isBlocked ? "bg-gray-400 cursor-not-allowed opacity-70" : "bg-green-700 hover:scale-105"} text-white px-8 py-3 rounded-full font-bold shadow-2xl transition-all`}>
            {isBlocked ? "Plafond Atteint" : "Enregistrer"}
          </button>
          <button onClick={() => window.print()} className="bg-blue-800 text-white px-8 py-3 rounded-full font-bold shadow-2xl hover:scale-105 transition-transform">Imprimer PDF</button>
        </div>
      )}
    </div>
  );
}
