"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from 'qrcode.react';
import axios from "axios";

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
function DossierModal({ demande, onClose, onDecision }) {
  const [motif, setMotif] = useState("");
  const [messageClient, setMessageClient] = useState("");
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!demande) return null;

  // ✅ Récupération des pièces jointes depuis l'objet demande
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
  // Ajouter ce helper dans DossierModal (avant le return)
const getFileUrl = (data) => {
  if (!data) return null;
  if (data.startsWith('http') || data.startsWith('blob') || data.startsWith('data:')) return data;
  return `http://localhost:5001/${data.replace(/^\//, '')}`;
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-fadeIn max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className={`p-5 text-white flex justify-between items-center sticky top-0 z-10 ${action === "rejeter" ? "bg-red-700" : action === "valider" ? "bg-emerald-700" : "bg-gray-800"}`}>
          <div>
            <p className="text-xs uppercase tracking-widest opacity-70">Dossier #{demande.id}</p>
            <h2 className="text-lg font-black">{demande.nom_beneficiaire}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center font-bold text-lg transition">✕</button>
        </div>

        {/* Détails */}
        <div className="p-6 grid grid-cols-2 gap-4 text-sm border-b">
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Bénéficiaire</p>
            <p className="font-bold text-gray-800">{demande.nom_beneficiaire}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Type de prestation</p>
            <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-700 font-medium">{demande.type_prestation}</span>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Date de dépôt</p>
            <p className="text-gray-700">{new Date(demande.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Statut actuel</p>
            <StatusBadge status={demande.statut} />
          </div>

          {/* ✅ PIÈCES JOINTES DU CLIENT */}
          <div className="col-span-2">
            <p className="text-xs text-gray-400 uppercase font-bold mb-3">
              Documents joints par le client ({pieces.length})
            </p>

            {pieces.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center text-gray-400 text-sm">
                Aucun document joint
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {pieces.map((p, i) => {
                  const isImage = p.type?.includes("image") || p.nom?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                  const isPdf   = p.type?.includes("pdf")   || p.nom?.match(/\.pdf$/i);

                  return (
                    <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                      {/* Barre de titre du fichier */}
                      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{isImage ? "🖼️" : isPdf ? "📄" : "📎"}</span>
                          <span className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">
                            {p.nom || `Document ${i + 1}`}
                          </span>
                        </div>
                        <a
                          href={p.data}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                        >
                          Ouvrir ↗
                        </a>
                      </div>

                      {/* Aperçu image */}
                      {isImage && p.data && (
                        <div className="p-3">
                          <img
                            src={p.data}
                            alt={p.nom}
                            className="w-full max-h-64 object-contain rounded-lg cursor-pointer hover:opacity-90 transition"
                            onClick={() => window.open(p.data, "_blank")}
                          />
                        </div>
                      )}

                      {/* Aperçu PDF */}
                      {isPdf && p.data && (
                        <div className="p-3">
                          <iframe
                            src={p.data}
                            className="w-full h-48 rounded-lg border border-gray-200"
                            title={p.nom}
                          />
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
                <button
                  onClick={() => setAction("valider")}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition shadow-md shadow-emerald-200"
                >
                  ✅ Valider le dossier
                </button>
                <button
                  onClick={() => setAction("rejeter")}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition shadow-md shadow-red-200"
                >
                  ❌ Rejeter le dossier
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm font-bold ${action === "valider" ? "text-emerald-700" : "text-red-700"}`}>
                  {action === "valider" ? "✅ Validation du dossier" : "❌ Rejet du dossier"}
                </span>
                <button onClick={() => { setAction(null); setMotif(""); setMessageClient(""); }} className="text-xs text-gray-400 underline hover:text-gray-600">
                  Changer
                </button>
              </div>

              {action === "rejeter" && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Motif de refus *</label>
                  <select
                    value={motif}
                    onChange={e => setMotif(e.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-400 outline-none bg-red-50"
                  >
                    <option value="">-- Sélectionner un motif --</option>
                    <option value="Plafond annuel atteint">Plafond annuel atteint</option>
                    <option value="Document(s) manquant(s) ou illisible(s)">Document(s) manquant(s) ou illisible(s)</option>
                    <option value="Prestation non couverte par la convention">Prestation non couverte par la convention</option>
                    <option value="Dossier incomplet">Dossier incomplet</option>
                    <option value="Bénéficiaire non éligible">Bénéficiaire non éligible</option>
                    <option value="Autre">Autre</option>
                  </select>
                  {motif === "Autre" && (
                    <textarea
                      placeholder="Précisez le motif..."
                      onChange={e => setMotif(e.target.value)}
                      className="mt-2 w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 outline-none focus:ring-2 focus:ring-red-400"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Message pour le bénéficiaire (optionnel)
                </label>
                <textarea
                  value={messageClient}
                  onChange={e => setMessageClient(e.target.value)}
                  placeholder={
                    action === "valider"
                      ? "Ex: Votre dossier a été validé. Vous pouvez vous présenter à la clinique..."
                      : "Ex: Nous vous invitons à renouveler votre demande avec les documents complets..."
                  }
                  className={`mt-1 w-full border rounded-xl p-3 text-sm resize-none h-24 outline-none focus:ring-2 transition ${
                    action === "valider" ? "border-emerald-200 focus:ring-emerald-400 bg-emerald-50" : "border-red-200 focus:ring-red-400 bg-red-50"
                  }`}
                />
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-black text-white text-sm transition shadow-lg ${
                  action === "valider"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 disabled:bg-emerald-300"
                    : "bg-red-600 hover:bg-red-700 shadow-red-200 disabled:bg-red-300"
                }`}
              >
                {loading ? "Traitement en cours..." : action === "valider" ? "✅ Confirmer la validation" : "❌ Confirmer le rejet"}
              </button>
            </div>
          )}
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

  const inputLine = "border-b border-dotted border-black bg-transparent outline-none focus:bg-blue-50 px-1 transition-colors";
  const selectStyle = "border-b border-dotted border-black bg-transparent outline-none cursor-pointer hover:bg-blue-50 transition-colors";

  const getOneMonthLater = () => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    return nextMonth.toISOString().split("T")[0];
  };

  const getLastDayOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  };

  const fetchDemandesEnLigne = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/demandes");
      setDemandesEnLigne(res.data);
    } catch (err) { console.error("Erreur chargement demandes:", err); }
  };

  useEffect(() => {
    if (activeTab === "en_ligne") fetchDemandesEnLigne();
  }, [activeTab]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/agents");
        const data = await res.json();
        setAgents(data);
      } catch (err) { console.error("Erreur agents:", err); }
    };
    fetchAgents();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchPlafonds();
        const [resClinics, resHistory] = await Promise.all([
          fetch("http://localhost:5001/api/clinics/all"),
          fetch("http://localhost:5001/api/prise-en-charge/all")
        ]);
        if (resClinics.ok) setCliniques(await resClinics.json());
        if (resHistory.ok) {
          const allData = await resHistory.json();
          const currentYear = new Date().getFullYear();
          setHistory(allData.filter(item => new Date(item.createdAt).getFullYear() === currentYear));
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
          const res = await fetch(`http://localhost:5001/api/prise-en-charge/prochain-numero/${selected.id}`);
          if (!res.ok) return;
          const data = await res.json();
          const year = new Date().getFullYear();
          const prochainNumero = data.next || 1;
          setFormData(prev => ({
            ...prev,
            ref: `${selected.numeroSequence || 'REF'}/${prochainNumero}/SG/COS/${year}`,
            conventionStartDate: selected.dateAjout ? selected.dateAjout.split("T")[0] : "",
          }));
        } catch (err) { console.error("Erreur réseau:", err); }
      }
    };
    genererRef();
  }, [formData.sfEtablissement, cliniques]);

  useEffect(() => {
    if (selectedUserFull && formData.prestation) {
      calculerReste(selectedUserFull, formData.prestation);
    }
  }, [plafondGeneral, plafondDentaire, plafondOphta, history, selectedUserFull, formData.prestation]);

  const calculerReste = (user, prestation) => {
    if (!user) return;
    const prestUpper = (prestation || "").toUpperCase();
    const isDentaire = prestUpper.includes("DENT");
    const isOphta = prestUpper.includes("OPHTA") || prestUpper.includes("OEIL");
    let plafondApplique = plafondGeneral;
    if (isDentaire) plafondApplique = plafondDentaire;
    if (isOphta) plafondApplique = plafondOphta;
    const totalConsomme = history
      .filter(item => {
        if (item.annule) return false;
        if (!item.pNom || !item.pPrenom || !item.prestation) return false;
        const sameUser =
          item.pNom.toUpperCase() === user.nomComplet.toUpperCase() &&
          item.pPrenom.toUpperCase() === user.prenomComplet.toUpperCase();
        if (!sameUser) return false;
        const itemPrest = item.prestation.toUpperCase();
        if (isDentaire) return itemPrest.includes("DENT");
        if (isOphta) return itemPrest.includes("OPHTA") || itemPrest.includes("OEIL");
        return !itemPrest.includes("DENT") && !itemPrest.includes("OPHTA") && !itemPrest.includes("OEIL");
      })
      .reduce((sum, item) => sum + parseFloat(item.montantTotal || 0), 0);
    const solde = plafondApplique - totalConsomme;
    setResteDisponible(solde);
    setIsBlocked(solde <= 0);
  };

  useEffect(() => {
    if (selectedUserFull) calculerReste(selectedUserFull, formData.prestation);
  }, [formData.prestation, history]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "fNom") fetchSuggestions(value);
    if (name === "montantTotal") {
      const montantSaisi = parseFloat(value || 0);
      setIsBlocked(resteDisponible !== null && (montantSaisi > resteDisponible || resteDisponible <= 0));
    }
  };

  const [loadingPlafonds, setLoadingPlafonds] = useState(true);

  const fetchPlafonds = async () => {
    setLoadingPlafonds(true);
    try {
      const res = await fetch("http://localhost:5001/api/settings");
      if (res.ok) {
        const settings = await res.json();
        if (settings.plafond_general) setPlafondGeneral(Number(settings.plafond_general));
        if (settings.plafond_dentaire) setPlafondDentaire(Number(settings.plafond_dentaire));
        if (settings.plafond_ophta) setPlafondOphta(Number(settings.plafond_ophta));
      }
    } catch (err) { console.error("Erreur chargement plafonds:", err); }
    finally { setLoadingPlafonds(false); }
  };

  const fetchSuggestions = async (term) => {
    if (term.length > 1) {
      try {
        const res = await fetch(`http://localhost:5001/api/users/search?term=${term}`);
        setSuggestions(await res.json());
        setShowSuggestions(true);
      } catch (err) { console.error(err); }
    }
  };

  const selectUser = (user) => {
    setSelectedUserFull(user);
    setFormData(prev => ({
      ...prev,
      fNom: user.nomComplet,
      fPrenom: user.prenomComplet,
      fFonction: user.position || user.role || "",
      fDateLieu: `${new Date(user.dateNaissance).toLocaleDateString()} à ${user.lieuNaissance}`,
      pNom: "", pPrenom: "", pDateLieu: "", pLien: ""
    }));
    calculerReste(user, formData.prestation);
    if (user.photo) {
      setPhotoUrl(user.photo.startsWith('http') ? user.photo : `http://localhost:5001/${user.photo.replace(/^\//, '')}`);
    } else {
      setPhotoUrl(null);
    }
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (isBlocked) return;
    try {
      const dataToSend = {
        ref: formData.ref,
        dateForm: formData.dateForm,
        prestation: formData.prestation,
        conventionStartDate: formData.conventionStartDate || null,
        conventionEndDate: getLastDayOfMonth(),
        fNom: formData.fNom, fPrenom: formData.fPrenom,
        fDateLieu: formData.fDateLieu, fFonction: formData.fFonction, fVivant: formData.fVivant,
        pNom: formData.pNom, pPrenom: formData.pPrenom,
        pDateLieu: formData.pDateLieu, pLien: formData.pLien || null,
        montantTotal: parseFloat(formData.montantTotal || 0),
        montantOS: parseFloat(formData.montantTotal || 0) * 0.7,
        montantPerso: parseFloat(formData.montantTotal || 0) * 0.3,
        nbDate: formData.nbDate, nbDelivre: formData.nbDelivre,
        agentNom: formData.agentNom,
        sfEtablissement: formData.sfEtablissement,
      };
      const response = await fetch("http://localhost:5001/api/prise-en-charge/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });
      if (response.ok) {
        alert("✅ Enregistré avec succès !");
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert("❌ Erreur : " + (errorData.message || errorData.error || "Erreur serveur"));
      }
    } catch (err) {
      console.error(err);
      alert("❌ Erreur de connexion au serveur");
    }
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
      const endpoint = action === "valider"
        ? `http://localhost:5001/api/demandes/valider/${id}`
        : `http://localhost:5001/api/demandes/rejeter/${id}`;
      const body = action === "valider"
        ? { message_client: messageClient }
        : { motif_refus: motif, message_client: messageClient };
      const res = await axios.post(endpoint, body);
      if (res.status !== 200) throw new Error("Réponse serveur invalide");
      alert("✅ Action réussie !");
      await fetchDemandesEnLigne();
    } catch (err) {
      console.error("❌ ERREUR VALIDATION :", err.response?.data || err.message);
      alert("❌ Erreur lors de la décision");
    }
  };

  const annulerPrise = async (id) => {
    if (!window.confirm("Voulez-vous annuler cette prise en charge ?")) return;
    try {
      await axios.put(`http://localhost:5001/api/prise-en-charge/annuler/${id}`);
      alert("✅ Prise en charge annulée");
      const res = await fetch("http://localhost:5001/api/prise-en-charge/all");
      setHistory(await res.json());
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors de l'annulation");
    }
  };

  const getSoldeLabel = () => {
    const p = formData.prestation.toUpperCase();
    if (p.includes("DENT")) return "Dentaire";
    if (p.includes("OPHTA") || p.includes("OEIL")) return "Ophtalmique";
    return "Général";
  };

  const qrData = `REF:${formData.ref}|PATIENT:${formData.pNom}|MONTANT:${formData.montantTotal}DA`;
  const nbAttente = demandesEnLigne.filter(d => d.statut === "En attente").length;

  return (
    <div className="min-h-screen bg-gray-100 py-4 font-serif print:bg-white print:p-0">
      <style>{`
        @media print {
          .tabs-nav { display: none !important; }
          .tab-en-ligne { display: none !important; }
          .tab-consulter { display: none !important; }
          nav, header { display: none !important; }
          select { display: none !important; }
          @page { margin: 10mm; }
          .print-field { border-bottom: 2px solid black !important; }
          input[type="text"], input:not([type]) {
            border: none !important;
            border-bottom: 1.5px solid black !important;
            background: transparent !important;
            min-width: 100px;
          }
          .sf-line-empty {
            border-bottom: 1.5px solid black !important;
            min-width: 80px;
            display: inline-block;
          }
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
      `}</style>

      {/* Modal de décision */}
      {showModal && (
        <DossierModal
          demande={selectedDemande}
          onClose={() => { setShowModal(false); setSelectedDemande(null); }}
          onDecision={executerDecision}
        />
      )}

      {/* ── ONGLETS ── */}
      <div className="tabs-nav mx-auto w-[210mm] flex gap-2 mb-4 print:hidden px-2">
        {[
          { key: "ajouter",   label: "👤+ Ajouter Prise en Charge", color: "green" },
          { key: "consulter", label: "📋 Consulter la Liste",        color: "blue"  },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-6 py-2 rounded-t-lg font-bold transition-all ${
              activeTab === key
                ? `bg-white text-${color}-700 shadow-sm border-t-2 border-${color}-600`
                : "bg-gray-200 text-gray-500 hover:bg-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setActiveTab("en_ligne")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-bold transition-all ${
            activeTab === "en_ligne" ? "bg-white text-orange-700 border-t-2 border-orange-600 shadow" : "bg-gray-200 text-gray-500"
          }`}
        >
          🌐 Demandes en Ligne
          {nbAttente > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce">
              {nbAttente}
            </span>
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
            <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-700">Flux des demandes externes</h2>
              <button onClick={fetchDemandesEnLigne} className="text-xs text-blue-600 font-bold hover:underline">
                🔄 Actualiser
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[11px] uppercase text-gray-500 font-bold">
                  <tr>
                    <th className="px-5 py-4">Bénéficiaire</th>
                    <th className="px-5 py-4">Prestation</th>
                    <th className="px-5 py-4">Pièces jointes</th>
                    <th className="px-5 py-4">Statut</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {demandesEnLigne.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Aucune demande reçue.</td></tr>
                  ) : demandesEnLigne.map((d) => {
                    const pieces = d.pieces || [];
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

                        {/* ✅ Colonne pièces jointes dans le tableau */}
                        <td className="px-5 py-4">
  {pieces.length > 0 ? (
    <button
      onClick={() => ouvrirDossier(d)}
      className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full text-[11px] font-bold hover:bg-blue-100 transition cursor-pointer"
    >
      📎 {pieces.length} fichier{pieces.length > 1 ? "s" : ""}
    </button>
  ) : (
    <span className="text-gray-300 text-xs">—</span>
  )}
</td>

                        <td className="px-5 py-4"><StatusBadge status={d.statut} /></td>
                        <td className="px-5 py-4 text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => ouvrirDossier(d)}
                            className="bg-gray-900 text-white text-[10px] px-4 py-2 rounded-lg hover:bg-black transition font-bold"
                          >
                            OUVRIR LE DOSSIER →
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
                <option>Intervention Chirurgicale</option>
                <option>Analyses Médicales</option>
                <option>Radiologie</option>
                <option>Soins Dentaire</option>
                <option>Soins Ophtalmologiques</option>
                <option>Circoncision</option>
              </select>
            </div>

            <div>
              <span>Entrant dans le cadre de la convention médicale paraphée en date du </span>
              <span className="font-bold border-b px-2">{getOneMonthLater()}</span>
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
                      ...p,
                      pNom: ad.nom || "", pPrenom: ad.prenom || "",
                      pDateLieu: ad.dateNaissance ? `${new Date(ad.dateNaissance).toLocaleDateString()} à ${ad.lieuNaissance || ''}` : "",
                      pLien: ad.lien || ""
                    }));
                    if (ad.photo) {
      setPhotoUrl(ad.photo.startsWith('http') ? ad.photo : `http://localhost:5001/${ad.photo.replace(/^\//, '')}`);
    } else {
      setPhotoUrl(null); // pas de photo pour cet ayant droit
    }
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
              <div>
                <span className="font-bold">Date et lieu de Naissance :</span>
                <span className="print-field">{formData.pDateLieu || ""}</span>
              </div>
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
                <input name="montantTotal" value={formData.montantTotal} onChange={handleChange}
                  className={`border-b-2 border-black w-32 font-black text-sm px-2 outline-none ${isBlocked ? 'text-red-600 bg-red-50' : 'text-black'}`}
                /> DA
              </p>
            </div>

            <p className="text-[9px] text-justify leading-tight text-gray-500">
              Toute utilisation frauduleuse de la présente convention expose son auteur à des suites qui seront décidées par les œuvres sociales...
            </p>

            <div className="flex justify-between font-bold underline mt-4">
              <div>L'intéressé(e)</div>
              <div className="agent-field">
                <span className="font-bold">Agents :</span>
                <select
                  name="agentNom"
                  value={formData.agentNom}
                  onChange={(e) => setFormData(prev => ({ ...prev, agentNom: e.target.value }))}
                  className="border p-2 rounded w-full"
                >
                  <option value="">-- Choisir un agent --</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.nom}>{a.nom}</option>
                  ))}
                </select>
              </div>
              <div>La Structure de Gestion</div>
            </div>
          </div>

          <div className="mt-10">
            <div>
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
                    <select
                      name="sfEtablissement"
                      value={formData.sfEtablissement || ""}
                      onChange={handleChange}
                      className="w-full text-center font-black text-red-700 bg-transparent border-b border-black outline-none uppercase"
                    >
                      <option value="">-- Choisir une clinique --</option>
                      {cliniques.map((c) => (
                        <option key={c.id} value={String(c.id)}>{c.nom || c.nom_clinique}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ONGLET : HISTORIQUE ── */}
      {activeTab === "consulter" && (
        <div className="tab-consulter mx-auto w-[210mm] bg-white p-8 rounded-lg border border-gray-200 min-h-[600px]">
          <h2 className="text-xl font-bold border-b pb-4 mb-6 text-blue-800 flex justify-between items-center">
            <span>Historique des prises en charge ({new Date().getFullYear()})</span>
            <span className="text-sm bg-blue-100 px-3 py-1 rounded text-blue-600">{history.length} entrées</span>
          </h2>
          <div className="overflow-x-auto">
            {history.length === 0 ? (
              <p className="text-gray-400 italic text-center py-20">Aucune prise en charge trouvée pour cette année.</p>
            ) : (
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b-2">
                    <th className="p-3">Référence</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Prestation</th>
                    <th className="p-3 text-right">Montant</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-center">Action</th>
                    <th className="p-3">Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className={`border-b transition-colors ${item.annule ? 'bg-red-50 opacity-60' : 'hover:bg-blue-50'}`}>
                      <td className="p-3 font-mono font-bold">
                        <span className={item.annule ? 'line-through text-gray-400' : ''}>{item.ref || item.numeroSequentiel || "—"}</span>
                      </td>
                      <td className="p-3 uppercase font-bold">
                        <span className={item.annule ? 'line-through text-gray-400' : ''}>{item.pNom} {item.pPrenom}</span>
                      </td>
                      <td className="p-3">
                        <span className={item.annule ? 'line-through text-gray-400' : ''}>{item.prestation}</span>
                      </td>
                      <td className="p-3 text-right font-bold text-blue-900">
                        <span className={item.annule ? 'line-through text-gray-400' : ''}>{(item.montantTotal || 0).toLocaleString('fr-FR')} DA</span>
                      </td>
                      <td className="p-3 text-gray-500">
                        <span className={item.annule ? 'line-through text-gray-400' : ''}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</span>
                      </td>
                      <td className="p-3 text-center">
                        {item.annule ? (
                          <span className="text-red-400 text-[11px] font-bold italic">Annulée</span>
                        ) : (
                          <button onClick={() => annulerPrise(item.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                            Annuler
                          </button>
                        )}
                      </td>
                      <td className="p-3">{item.agentNom || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

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