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
  const [action, setAction] = useState(null); // "valider" | "rejeter"
  const [loading, setLoading] = useState(false);

  if (!demande) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className={`p-5 text-white flex justify-between items-center ${action === "rejeter" ? "bg-red-700" : action === "valider" ? "bg-emerald-700" : "bg-gray-800"}`}>
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
          {demande.pieces?.ordonnance && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400 uppercase font-bold mb-2">Documents joints</p>
              <button
                onClick={() => window.open(`http://localhost:5001/uploads/ordonnances/${demande.pieces.ordonnance}`)}
                className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition border border-blue-200"
              >
                📄 Voir l'ordonnance
              </button>
            </div>
          )}
        </div>

        {/* Zone de décision */}
        <div className="p-6 space-y-4">
          {/* Choix de l'action */}
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
                      onChange={e => setMotif(e.target.value === "Autre" ? "" : e.target.value)}
                      className="mt-2 w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 outline-none focus:ring-2 focus:ring-red-400"
                    />
                  )}
                </div>
              )}

              {/* Message personnalisé pour le client */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Message pour le bénéficiaire {action === "rejeter" ? "(optionnel)" : "(optionnel)"}
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

              {/* Bouton de confirmation */}
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
    nbDate: "", nbDelivre: "", montantTotal: "", sfEtablissement: ""
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

  // Modal state
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const inputLine = "border-b border-dotted border-black bg-transparent outline-none focus:bg-blue-50 px-1 transition-colors";
  const selectStyle = "border-b border-dotted border-black bg-transparent outline-none cursor-pointer hover:bg-blue-50 transition-colors";

const getLastDayOfMonth = () => {
  const date = new Date();
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  // Renvoie le format YYYY-MM-DD
  return lastDay.toISOString().split('T')[0]; 
};

  // ── Fetch demandes en ligne ──
  const fetchDemandesEnLigne = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/demandes");
      setDemandesEnLigne(res.data);
    } catch (err) { console.error("Erreur chargement demandes:", err); }
  };

  useEffect(() => { fetchDemandesEnLigne(); }, [activeTab]);

  // ── Fetch cliniques + historique ──
  useEffect(() => {
    const fetchData = async () => {
      try {
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

  // ── Génération de la référence ──
  // ── Génération de la référence sécurisée ──
  useEffect(() => {
  const genererRef = async () => {
    // 1. On vérifie que sfEtablissement existe ET n'est pas "undefined" (string)
    if (!formData.sfEtablissement || formData.sfEtablissement === "undefined" || cliniques.length === 0) return;
    
    const selected = cliniques.find(c => String(c.id) === String(formData.sfEtablissement));
    
    if (selected && selected.id) {
      try {
        // Ajout d'un log pour vérifier l'URL exacte appelée dans ta console
        console.log("Appel API vers :", `http://localhost:5001/api/prise-en-charge/prochain-numero/${selected.id}`);

        const res = await fetch(`http://localhost:5001/api/prise-en-charge/prochain-numero/${selected.id}`);
        
        if (!res.ok) {
          console.error("Erreur serveur (Status):", res.status);
          return;
        }

        const data = await res.json();
        const year = new Date().getFullYear();
        const prochainNumero = data.next || 1;

        setFormData(prev => ({
          ...prev,
          // On s'assure que ref est bien mis à jour
          ref: `${selected.numeroSequence || 'REF'}/${prochainNumero}/SG/COS/${year}`,
          conventionStartDate: selected.dateAjout ? selected.dateAjout.split("T")[0] : "",
        }));
      } catch (err) { 
        console.error("Erreur réseau ou parsing JSON :", err); 
      }
    }
  };
  genererRef();
}, [formData.sfEtablissement, cliniques]);

  // ── Calcul du reste disponible ──
  const calculerReste = (user, prestation) => {
    if (!user) return;
    const prestUpper = (prestation || "").toUpperCase();
    const isDentaire = prestUpper.includes("DENT");
    const isOphta = prestUpper.includes("OPHTA") || prestUpper.includes("OEIL");

    const plafondGen   = parseFloat(localStorage.getItem("plafond_general"))  || 130000;
    const plafondDent  = parseFloat(localStorage.getItem("plafond_dentaire")) || 50000;
    const plafondOphta = parseFloat(localStorage.getItem("plafond_ophta"))    || 20000;

    let plafondApplique = plafondGen;
    if (isDentaire) plafondApplique = plafondDent;
    if (isOphta)    plafondApplique = plafondOphta;

    const totalConsomme = history
      .filter(item => {
        if (!item.pNom || !item.pPrenom || !item.prestation) return false;
        const sameUser = item.pNom.toUpperCase() === user.nomComplet.toUpperCase() &&
                         item.pPrenom.toUpperCase() === user.prenomComplet.toUpperCase();
        if (!sameUser) return false;
        const itemPrest = item.prestation.toUpperCase();
        if (isDentaire) return itemPrest.includes("DENT");
        if (isOphta)    return itemPrest.includes("OPHTA") || itemPrest.includes("OEIL");
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
      pNom: user.nomComplet,
      pPrenom: user.prenomComplet,
      pDateLieu: `${new Date(user.dateNaissance).toLocaleDateString()} à ${user.lieuNaissance}`,
      pLien: "Lui-même"
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
      ref:                 formData.ref,
      dateForm:            formData.dateForm,
      prestation:          formData.prestation,
      conventionStartDate: formData.conventionStartDate || null,
      conventionEndDate:   getLastDayOfMonth(),
      // Fonctionnaire
      fNom:      formData.fNom,
      fPrenom:   formData.fPrenom,
      fDateLieu: formData.fDateLieu,
      fFonction: formData.fFonction,
      fVivant:   formData.fVivant,
      // Patient
      pNom:      formData.pNom,
      pPrenom:   formData.pPrenom,
      pDateLieu: formData.pDateLieu,
      pLien:     formData.pLien || null,
      // Montants
      montantTotal:  parseFloat(formData.montantTotal || 0),
      montantOS:     parseFloat(formData.montantTotal || 0) * 0.7,
      montantPerso:  parseFloat(formData.montantTotal || 0) * 0.3,
      // NB
      nbDate:    formData.nbDate,
      nbDelivre: formData.nbDelivre,
      // Clinique
      sfEtablissement: parseInt(formData.sfEtablissement),
    };
 
    // ✅ URL corrigée : POST / (pas /ajouter)
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

  // ── Ouvrir modal dossier ──
  const ouvrirDossier = (demande) => {
    setSelectedDemande(demande);
    setShowModal(true);
  };

  // ── Exécuter la décision (valider / rejeter) ──
  const executerDecision = async (id, action, motif, messageClient) => {
    const endpoint = action === "valider"
      ? `http://localhost:5001/api/demandes/valider/${id}`
      : `http://localhost:5001/api/demandes/rejeter/${id}`;

    const body = action === "valider"
      ? { message_client: messageClient }
      : { motif_refus: motif, message_client: messageClient };

    const res = await axios.post(endpoint, body);
    if (res.status !== 200) throw new Error("Erreur serveur");
    await fetchDemandesEnLigne();
  };
const annulerPrise = async (id) => {
  if (!window.confirm("Voulez-vous annuler cette prise en charge ?")) return;

  try {
    await axios.put(`http://localhost:5001/api/prise-en-charge/annuler/${id}`);

    alert("✅ Prise en charge annulée");

    // recharge les données
    const res = await fetch("http://localhost:5001/api/prise-en-charge/all");
    const data = await res.json();

    setHistory(data);

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

      {/* Modal de décision */}
      {showModal && (
        <DossierModal
          demande={selectedDemande}
          onClose={() => { setShowModal(false); setSelectedDemande(null); }}
          onDecision={executerDecision}
        />
      )}

      {/* ── ONGLETS ── */}
      <div className="mx-auto w-[210mm] flex gap-2 mb-4 print:hidden px-2">
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
        <div className="mx-auto w-full max-w-6xl px-4">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Reçues",  val: demandesEnLigne.length,                                          color: "blue"   },
              { label: "En Attente",    val: demandesEnLigne.filter(d => d.statut === "En attente").length,   color: "orange" },
              { label: "Validées",      val: demandesEnLigne.filter(d => d.statut === "Validée").length,      color: "green"  },
              { label: "Refusées",      val: demandesEnLigne.filter(d => d.statut === "Rejetée").length,      color: "red"    },
            ].map(({ label, val, color }) => (
              <div key={label} className={`bg-white p-5 rounded-xl shadow-sm border-l-4 border-${color}-500`}>
                <p className="text-gray-400 text-xs font-bold uppercase">{label}</p>
                <p className={`text-2xl font-black text-${color}-600`}>{val}</p>
              </div>
            ))}
          </div>

          {/* Tableau */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-700">Flux des demandes externes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[11px] uppercase text-gray-500 font-bold">
                  <tr>
                    <th className="px-5 py-4">Bénéficiaire</th>
                    <th className="px-5 py-4">Prestation</th>
                    <th className="px-5 py-4">Statut</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {demandesEnLigne.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Aucune demande reçue.</td></tr>
                  ) : demandesEnLigne.map((d) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ONGLET : FORMULAIRE D'AJOUT ── */}
      {activeTab === "ajouter" && (
        <div className="mx-auto w-[210mm] min-h-[290mm] bg-white p-10 shadow-lg border border-gray-200 text-[13px] leading-tight text-gray-800 print:shadow-none print:border-none print:m-0 print:p-8">

          {/* En-tête du document */}
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
              <span className="font-bold border-b px-2">{formData.conventionStartDate || "___/___/_____"}</span>
              <span> au </span>
              <span className="font-bold border-b px-2">{getLastDayOfMonth()}</span>
            </div>

            {/* Fonctionnaire */}
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

            {/* Patient */}
            <div className="border-t pt-2 space-y-3">
              <h3 className="font-bold underline text-[12px] uppercase">Le Patient :</h3>
              <div className="flex items-center gap-3">
                <span className="font-bold text-red-800">Bénéficiaire :</span>
                <select className={selectStyle} onChange={(e) => {
                  const val = e.target.value;
                  if (val === "self") {
                    setFormData(p => ({ ...p, pNom: p.fNom, pPrenom: p.fPrenom, pDateLieu: p.fDateLieu, pLien: "Lui-même" }));
                  } else if (selectedUserFull?.ayantDroits) {
                    const ad = selectedUserFull.ayantDroits[val];
                    setFormData(p => ({ ...p, pNom: ad.nom, pPrenom: ad.prenom, pDateLieu: `${new Date(ad.dateNaissance).toLocaleDateString()} à ${ad.lieuNaissance || ''}`, pLien: ad.lien }));
                  }
                }}>
                  <option value="self">L'assuré lui-même</option>
                  {selectedUserFull?.ayantDroits?.map((ad, i) => (
                    <option key={i} value={i}>{ad.nom} {ad.prenom} ({ad.lien})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-bold">Nom :</span> <span className="border-b inline-block w-40 font-bold uppercase">{formData.pNom}</span></div>
                <div><span className="font-bold">Prénom :</span> <span className="border-b inline-block w-40 font-bold uppercase">{formData.pPrenom}</span></div>
              </div>
              <div>
                <span className="font-bold">Date et lieu de Naissance :</span>
                <span className="border-b inline-block w-2/3">{formData.pDateLieu}</span>
              </div>
            </div>

            {/* NB + Montant */}
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
              <div>La Structure de Gestion</div>
            </div>

            {/* Service Fait */}
            <div>
              <h2 className="text-center font-bold text-lg underline uppercase">Service Fait</h2>
              <div className="space-y-4 mt-4">
                <div className="flex gap-2"><span>Nom et Prénom du patient :</span> <div className="flex-1 border-b border-black font-bold uppercase">{formData.pNom} {formData.pPrenom}</div></div>
                <div className="flex gap-2"><span>Date et lieu de Naissance :</span> <div className="flex-1 border-b border-black font-bold uppercase">{formData.pDateLieu}</div></div>
                <div className="flex gap-2"><span>Désignation de la prestation :</span> <div className="flex-1 border-b border-black">{formData.prestation}</div></div>
                <div className="flex gap-2 font-bold"><span>Montant de la prestation "70%" :</span> <div className="flex-1 border-b border-black">{formData.montantTotal}</div> <span>DA</span></div>
                <div className="flex justify-between items-end pt-6">
                  <QRCodeSVG value={qrData} size={80} />
                  <div className="text-center min-w-[250px]">
                    <p className="font-bold italic mb-1 text-[11px]">La Clinique / Le Laboratoire</p>
                    <select name="sfEtablissement" value={formData.sfEtablissement} onChange={handleChange} className="w-full text-center font-black text-red-700 bg-transparent border-b border-black outline-none uppercase">
                      <option value="">-- Choisir l'établissement --</option>
                      {cliniques.map((c) => (<option key={c.id} value={c.id}>{c.nom || c.nom_clinique}</option>))}
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
        <div className="mx-auto w-[210mm] bg-white p-8 rounded-lg shadow-lg border border-gray-200 min-h-[600px]">
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
                  </tr>
                </thead>
                <tbody>
{history.map((item) => (
  <tr key={item.id} className="border-b hover:bg-blue-50 transition-colors">
    {/* ✅ ref est un champ direct du modèle Prise */}
    <td className="p-3 font-mono font-bold">{item.ref || item.numeroSequentiel || "—"}</td>
 
    {/* ✅ Patient = pNom + pPrenom */}
    <td className="p-3 uppercase font-bold">
      {item.pNom} {item.pPrenom}
    </td>
 
    {/* ✅ prestation est un champ direct */}
    <td className="p-3">{item.prestation}</td>
 
    {/* ✅ montantTotal est un champ direct */}
    <td className="p-3 text-right font-bold text-blue-900">
      {(item.montantTotal || 0).toLocaleString('fr-FR')} DA
    </td>
 
    <td className="p-3 text-gray-500">{new Date(item.createdAt).toLocaleDateString('fr-FR')}</td>

    {/* annuler */}
     <td className="p-3 text-center">
      <button
        onClick={() => annulerPrise(item.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
        Annuler
    </button>
    </td>
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
