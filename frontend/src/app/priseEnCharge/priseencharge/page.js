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
    e.preventDefault(); setDrag(false);
    handleFile(e.dataTransfer.files[0]);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 p-5 flex justify-between items-center">
          <div>
            <p className="text-white/70 text-xs uppercase tracking-widest">Upload Prise en Charge</p>
            <h2 className="text-white font-black text-base">{demande.nom_beneficiaire}</h2>
            <p className="text-white/60 text-xs mt-0.5">{demande.type_prestation}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white font-bold transition">✕</button>
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

          <div style="margin-top:16px;padding-top:8px;border-top:1px dashed #aaa;display:flex;justify-content:space-between;font-size:10px;color:#666;">
            <span><strong>Établi par :</strong> ${item.agentNom || "—"}</span>
            <span>${new Date(item.createdAt).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" })}</span>
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
function DossierModal({ demande, onClose, onDecision, cliniques, onUploadSuccess }) {
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
            <div className="flex items-center gap-2">
              <button onClick={() => setShowUpload(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">📤 Upload PEC</button>
              {demande.statut === "Validée" && (
                <button onClick={() => downloadPEC(demande, cliniques)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition">⬇️ Télécharger PEC</button>
              )}
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-lg transition">✕</button>
            </div>
          </div>

          {/* Détails */}
          <div className="p-6 grid grid-cols-2 gap-4 text-sm border-b">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Bénéficiaire</p>
              <p className="font-bold text-gray-800">{demande.nom_beneficiaire}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Sexe</p>
              <span className="bg-purple-50 px-3 py-1 rounded-full text-purple-700 font-medium">{demande.sexe || "—"}</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Date de naissance</p>
              <span className="bg-pink-50 px-3 py-1 rounded-full text-pink-700 font-medium">
                🎂 {demande.date_naissance ? new Date(demande.date_naissance).toLocaleDateString("fr-FR") : "—"}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Fonction</p>
              <span className="bg-yellow-50 px-3 py-1 rounded-full text-yellow-700 font-medium">{demande.fonction || "—"}</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Type de prestation</p>
              <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-700 font-medium">{demande.type_prestation}</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Lieu</p>
              <span className="bg-blue-50 px-3 py-1 rounded-full text-blue-700 font-medium">📍 {demande.lieu_naissance || "—"}</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Établissement</p>
              <span className="bg-green-50 px-3 py-1 rounded-full text-green-700 font-medium">🏥 {demande.etablissement || "—"}</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Date de dépôt</p>
              <p className="text-gray-700">{new Date(demande.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Statut actuel</p>
              <StatusBadge status={demande.statut} />
            </div>

     

            <div className="col-span-2">
              <p className="text-xs text-gray-400 uppercase font-bold mb-3">Documents joints par le client ({pieces.length})</p>
              {pieces.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center text-gray-400 text-sm">Aucun document joint</div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {pieces.map((p, i) => {
                    const isImage = p.type?.includes("image") || p.nom?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    const isPdf   = p.type?.includes("pdf")   || p.nom?.match(/\.pdf$/i);
                    return (
                      <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{isImage ? "🖼️" : isPdf ? "📄" : "📎"}</span>
                            <span className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">{p.nom || `Document ${i + 1}`}</span>
                          </div>
                          <a href={p.data} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 font-bold hover:underline">Ouvrir ↗</a>
                        </div>
                        {isImage && p.data && (
                          <div className="p-3">
                            <img src={p.data} alt={p.nom} className="w-full max-h-64 object-contain rounded-lg cursor-pointer hover:opacity-90 transition" onClick={() => window.open(p.data, "_blank")} />
                          </div>
                        )}
                        {isPdf && p.data && (
                          <div className="p-3">
                            <iframe src={p.data} className="w-full h-48 rounded-lg border border-gray-200" title={p.nom} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

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
      const nom    = payload.nomComplet    || payload.nom    || payload.name  || payload.username || "";
      const prenom = payload.prenomComplet || payload.prenom || payload.firstName || "";
      setAgentConnecte(`${nom} ${prenom}`.trim() || "—");
    } catch (e) {}
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
    setSelectedDemande(demande);
    setShowModal(true);
  };

  const executerDecision = async (id, action, motif, messageClient) => {
    try {
      const body = action === "valider" ? { message_client: messageClient } : { motif_refus: motif, message_client: messageClient };
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
          .tabs-nav, .tab-en-ligne, .tab-consulter, nav, header, select { display: none !important; }
          @page { margin: 10mm; }
          input[type="text"], input:not([type]) { border: none !important; border-bottom: 1.5px solid black !important; background: transparent !important; min-width: 100px; }
          .sf-line-empty { border-bottom: 1.5px solid black !important; min-width: 80px; display: inline-block; }
        }
        .print-field { display: inline-block; min-width: 160px; border-bottom: 1px dotted black; padding: 2px 4px; font-weight: bold; text-transform: uppercase; }
        .print-field:empty::after { content: "____________________"; letter-spacing: 2px; }
      `}</style>

      {/* ── MODALS ── */}
      {showModal && (
        <DossierModal
          demande={selectedDemande}
          onClose={() => { setShowModal(false); setSelectedDemande(null); }}
          onDecision={executerDecision}
          cliniques={cliniques}
          onUploadSuccess={fetchDemandesEnLigne}
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
                            <span className="font-bold text-gray-800 text-sm">{d.nom_beneficiaire}</span>
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

          <div className="mt-10">
            <h2 className="text-center font-bold text-lg underline uppercase">Service Fait</h2>
            <div className="space-y-4 mt-4">
              <div className="flex gap-2"><span>Nom et Prénom du patient :</span> <div className="flex-1 border-b border-black font-bold uppercase sf-line-empty"></div></div>
              <div className="flex gap-2"><span>Date et lieu de Naissance :</span> <div className="flex-1 border-b border-black font-bold uppercase sf-line-empty"></div></div>
              <div className="flex gap-2"><span>Désignation de la prestation :</span> <div className="flex-1 border-b border-black sf-line-empty"></div></div>
              <div className="flex gap-2 font-bold"><span>Montant de la prestation "70%" :</span> <div className="flex-1 border-b border-black sf-line-empty"></div> <span>DA</span></div>
              <div className="flex justify-between items-end pt-6">
                <QRCodeSVG value={qrData} size={80} />
                <div className="text-center min-w-[250px]">
                  <p className="font-bold italic mb-1 text-[11px]">La Clinique / Le Laboratoire</p>
                  <select name="sfEtablissement" value={formData.sfEtablissement || ""} onChange={handleChange} className="w-full text-center font-black text-red-700 bg-transparent border-b border-black outline-none uppercase">
                    <option value="">-- Choisir une clinique --</option>
                    {cliniques.map((c) => (<option key={c.id} value={String(c.id)}>{c.nom || c.nom_clinique}</option>))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-dashed border-gray-300 text-[11px] text-gray-600 flex justify-between items-center print:border-gray-400">
            <div>
              <span className="font-bold uppercase text-gray-500">Établi par : </span>
              <span className="font-black text-gray-800 uppercase">{agentConnecte || formData.agentNom || "—"}</span>
            </div>
            <div className="text-gray-400 text-[10px]">{new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
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

        const exportCSV = () => {
          const header = ["Référence","Patient","Fonctionnaire","Prestation","Montant Total","Part OS (70%)","Part Perso (30%)","Date","Agent","Statut"];
          const rows = historiqueFiltré.map(i => [
            i.ref || i.numeroSequentiel || "", `${i.pNom || ""} ${i.pPrenom || ""}`.trim(),
            `${i.fNom || ""} ${i.fPrenom || ""}`.trim(), i.prestation || "",
            i.montantTotal || 0, Math.round((i.montantTotal || 0) * 0.7), Math.round((i.montantTotal || 0) * 0.3),
            new Date(i.createdAt).toLocaleDateString("fr-FR"), i.agentNom || "", i.annule ? "Annulée" : "Active"
          ]);
          const csv = [header, ...rows].map(r => r.join(";")).join("\n");
          const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url;
          a.download = `prises_en_charge_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.csv`;
          a.click();
        };

        return (
          <div className="tab-consulter mx-auto w-full max-w-5xl px-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200 min-h-[600px]">
              <div className="flex justify-between items-center border-b pb-4 mb-5">
                <h2 className="text-xl font-bold text-blue-800">Historique {new Date().getFullYear()}</h2>
                <span className="text-sm bg-blue-100 px-3 py-1 rounded text-blue-600">{historiqueFiltré.length} / {history.length} entrées</span>
              </div>

              <div className="flex gap-3 mb-5 flex-wrap items-end bg-gray-50 p-3 rounded-xl">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Du</label>
                  <input type="date" value={filtreDebut} onChange={e => setFiltreDebut(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Au</label>
                  <input type="date" value={filtreFin} onChange={e => setFiltreFin(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Recherche</label>
                  <input type="text" value={filtreNom} onChange={e => setFiltreNom(e.target.value)} placeholder="Nom patient ou fonctionnaire..."
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300 w-52" />
                </div>
                <button onClick={() => { setFiltreDebut(""); setFiltreFin(""); setFiltreNom(""); }} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-300">🔄 Réinitialiser</button>
                <button onClick={exportCSV} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-bold hover:bg-green-800 flex items-center gap-2 ml-auto">⬇️ Télécharger CSV</button>
              </div>

              {historiqueFiltré.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Total montants", val: historiqueFiltré.filter(i => !i.annule).reduce((s, i) => s + parseFloat(i.montantTotal || 0), 0), color: "blue" },
                    { label: "Part OS (70%)", val: historiqueFiltré.filter(i => !i.annule).reduce((s, i) => s + Math.round(parseFloat(i.montantTotal || 0) * 0.7), 0), color: "green" },
                    { label: "Part Perso (30%)", val: historiqueFiltré.filter(i => !i.annule).reduce((s, i) => s + Math.round(parseFloat(i.montantTotal || 0) * 0.3), 0), color: "orange" },
                  ].map(({ label, val, color }) => (
                    <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-3`}>
                      <p className={`text-xs font-bold text-${color}-500 uppercase`}>{label}</p>
                      <p className={`text-lg font-black text-${color}-700`}>{val.toLocaleString("fr-FR")} DA</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="overflow-x-auto">
                {historiqueFiltré.length === 0 ? (
                  <p className="text-gray-400 italic text-center py-20">Aucune prise en charge trouvée.</p>
                ) : (
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 text-[11px] uppercase text-gray-500">
                        <th className="p-3">Référence</th>
                        <th className="p-3">Patient</th>
                        <th className="p-3">Fonctionnaire</th>
                        <th className="p-3">Prestation</th>
                        <th className="p-3 text-right">Montant</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-center">Statut</th>
                        <th className="p-3">Agent</th>
                        <th className="p-3 text-center">PDF</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historiqueFiltré.map((item) => (
                        <tr key={item.id} className={`border-b transition-colors ${item.annule ? "bg-red-50 opacity-60" : "hover:bg-blue-50"}`}>
                          <td className="p-3 font-mono font-bold text-xs">
                            <span className={item.annule ? "line-through text-gray-400" : ""}>{item.ref || item.numeroSequentiel || "—"}</span>
                          </td>
                          <td className="p-3 font-bold uppercase">
                            <span className={item.annule ? "line-through text-gray-400" : ""}>
                              {item.pNom && item.pPrenom ? `${item.pNom} ${item.pPrenom}` : item.fNom && item.fPrenom ? `${item.fNom} ${item.fPrenom}` : "—"}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600"><span className={item.annule ? "line-through text-gray-400" : ""}>{item.fNom} {item.fPrenom}</span></td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${item.annule ? "bg-gray-100 text-gray-400 line-through" : "bg-blue-50 text-blue-700"}`}>{item.prestation}</span>
                          </td>
                          <td className="p-3 text-right font-bold text-blue-900">
                            <span className={item.annule ? "line-through text-gray-400" : ""}>{(item.montantTotal || 0).toLocaleString("fr-FR")} DA</span>
                          </td>
                          <td className="p-3 text-gray-500 text-xs">{new Date(item.createdAt).toLocaleDateString("fr-FR")}</td>
                          <td className="p-3 text-center">
                            {item.annule ? <span className="text-red-400 text-[10px] font-bold italic">Annulée</span> : <span className="text-green-600 text-[10px] font-bold">Active</span>}
                          </td>
                          <td className="p-3 text-xs text-gray-500 font-semibold uppercase">{item.agentNom || "—"}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => downloadPEC(item, cliniques)}
                              title="Télécharger la prise en charge en PDF"
                              className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition"
                            >
                              ⬇️ PDF
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            {!item.annule && (
                              <button onClick={() => annulerPrise(item.id)} className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-600 font-bold">Annuler</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
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