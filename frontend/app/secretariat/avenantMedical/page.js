"use client";
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import { 
  Plus, Trash2, Printer, Search, ArrowLeft, LayoutDashboard, Check, 
  ChevronRight, ClipboardList, Filter, Edit3, X, Shield, Activity, 
  Landmark, FileText, User, Calendar, GripVertical, Pencil  // <--- Tu peux essayer Coins ou Banknote ici
} from 'lucide-react';

const API_BASE = "http://localhost:5001/api";

const getIcon = (titre) => {
  const t = titre?.toLowerCase() || "";
  if (t.includes('médicaux')) return <Shield size={20}/>;
  if (t.includes('cancer')) return <Activity size={20}/>;
  if (t.includes('dentaire')) return <Landmark size={20}/>;
  return <FileText size={20}/>;
};

export default function GestionDossiersDashboard() {
  const [vueActive, setVueActive] = useState("dashboard"); 
  const [dossiers, setDossiers] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [blocs, setBlocs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prestationTitre, setPrestationTitre] = useState('');
  const [nomRecherche, setNomRecherche] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [beneficiaireSelectionne, setBeneficiaireSelectionne] = useState(null);
  const [fonctionChoisie, setFonctionChoisie] = useState(''); 
  const [listePieces, setListePieces] = useState([]); 
  const [montantAvenant, setMontantAvenant] = useState(''); // <--- NOUVEAU
  const [accusereception, setAccuseReception] = useState(null);

  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [rechercheRegistre, setRechercheRegistre] = useState('');

  // ── États modale ajout prestation ──
  const [showModalPrestation, setShowModalPrestation] = useState(false);
  const [newPrestationTitre, setNewPrestationTitre] = useState('');
  // Pièces sous forme de tableau d'objets { id, nom, editing }
  const [newPrestationPieces, setNewPrestationPieces] = useState([]);
  const [newPieceInput, setNewPieceInput] = useState('');

  // ── États modale MODIFICATION prestation ──
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [editPrestation, setEditPrestation] = useState(null); // { id, titre, pieces[] }
  const [editTitre, setEditTitre] = useState('');
  const [editPieces, setEditPieces] = useState([]);
  const [editPieceInput, setEditPieceInput] = useState('');

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
      setBlocs(resPrestations.data || []);
    } catch (err) { 
      console.error("Erreur chargement données:", err); 
    }
  }, []);

  useEffect(() => { chargerDonnees(); }, [chargerDonnees]);
  
  // ── Helpers pièces (modale ajout) ──
  const ajouterPieceNouveauForm = () => {
    const val = newPieceInput.trim();
    if (!val) return;
    setNewPrestationPieces(prev => [...prev, { id: Date.now(), nom: val, editing: false }]);
    setNewPieceInput('');
  };

  const supprimerPieceNouveauForm = (id) => {
    setNewPrestationPieces(prev => prev.filter(p => p.id !== id));
  };

  const startEditPieceNouveauForm = (id) => {
    setNewPrestationPieces(prev => prev.map(p => p.id === id ? { ...p, editing: true, tempNom: p.nom } : p));
  };

  const saveEditPieceNouveauForm = (id) => {
    setNewPrestationPieces(prev => prev.map(p => {
      if (p.id === id) {
        const newNom = (p.tempNom || '').trim();
        return { ...p, nom: newNom || p.nom, editing: false, tempNom: undefined };
      }
      return p;
    }));
  };

  const cancelEditPieceNouveauForm = (id) => {
    setNewPrestationPieces(prev => prev.map(p => p.id === id ? { ...p, editing: false, tempNom: undefined } : p));
  };

  // ── Helpers pièces (modale modification) ──
  const ajouterPieceEdit = () => {
    const val = editPieceInput.trim();
    if (!val) return;
    setEditPieces(prev => [...prev, { id: Date.now(), nom: val, editing: false }]);
    setEditPieceInput('');
  };

  const supprimerPieceEdit = (id) => {
    setEditPieces(prev => prev.filter(p => p.id !== id));
  };

  const startEditPieceEdit = (id) => {
    setEditPieces(prev => prev.map(p => p.id === id ? { ...p, editing: true, tempNom: p.nom } : p));
  };

  const saveEditPieceEdit = (id) => {
    setEditPieces(prev => prev.map(p => {
      if (p.id === id) {
        const newNom = (p.tempNom || '').trim();
        return { ...p, nom: newNom || p.nom, editing: false, tempNom: undefined };
      }
      return p;
    }));
  };

  const cancelEditPieceEdit = (id) => {
    setEditPieces(prev => prev.map(p => p.id === id ? { ...p, editing: false, tempNom: undefined } : p));
  };

  // ── Ouvrir modale MODIFICATION ──
  const ouvrirEditPrestation = (e, bloc) => {
    e.stopPropagation();
    setEditPrestation(bloc);
    setEditTitre(bloc.titre);
    setEditPieces((bloc.pieces || []).map((nom, i) => ({ id: i + '_' + nom, nom, editing: false })));
    setEditPieceInput('');
    setShowModalEdit(true);
  };

  // ── Sauvegarder modification ──
  const sauvegarderModification = async () => {
    if (!editTitre.trim()) return;
    const payload = {
      titre: editTitre.trim(),
      pieces: editPieces.map(p => p.nom).filter(Boolean)
    };
    try {
      await axios.put(`${API_BASE}/prestations/modifier/${editPrestation.id}`, payload);
      chargerDonnees();
      setShowModalEdit(false);
      setEditPrestation(null);
    } catch (err) {
      console.error("Erreur modification:", err);
      alert("Erreur lors de la modification.");
    }
  };

  // ── Ajouter prestation ──
  const ajouterPrestation = async () => {
    if (!newPrestationTitre.trim()) return;
    const payload = {
      titre: newPrestationTitre.trim(),
      pieces: newPrestationPieces.map(p => p.nom).filter(Boolean)
    };
    try {
      await axios.post(`${API_BASE}/prestations/ajouter`, payload);
      chargerDonnees(); 
      setNewPrestationTitre('');
      setNewPrestationPieces([]);
      setNewPieceInput('');
      setShowModalPrestation(false);
    } catch (err) {
      console.error("Erreur ajout prestation:", err);
      alert("Erreur lors de la création de la prestation sur le serveur.");
    }
  };

  const dossiersFiltrés = dossiers.filter(d => {
    const matchNom = d.nom_beneficiaire?.toLowerCase().includes(rechercheRegistre.toLowerCase());
    const dateDossier = d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : "";
    const matchDateDebut = dateDebut ? dateDossier >= dateDebut : true;
    const matchDateFin = dateFin ? dateDossier <= dateFin : true;
    return matchNom && matchDateDebut && matchDateFin;
  });

const ouvrirFormulaire = (bloc) => {
    setPrestationTitre(bloc.titre);
    setListePieces(bloc.pieces.map(p => ({ nom: p, cochee: false })));
    setMontantAvenant(''); // Reset montant
    setVueActive("formulaire");
    setAccuseReception(null);
    setNomRecherche('');
    setBeneficiaireSelectionne(null);
    setFonctionChoisie('');
  };

  const fermerFormulaire = () => {
    setVueActive("dashboard");
    setListePieces([]);
    setBeneficiaireSelectionne(null);
    setNomRecherche('');
    setFonctionChoisie('');
    setAccuseReception(null);
  };

const handleSubmit = async () => {
    if (!beneficiaireSelectionne || !fonctionChoisie || !toutesLesPiecesCochees) return;
    setIsSubmitting(true);
    
    const isAvenant = prestationTitre.toLowerCase().includes("avenant");
    const piecesSelectionnees = listePieces.filter(p => p.cochee).map(p => p.nom);
    
    const payload = {
      nom_beneficiaire: `${beneficiaireSelectionne.nomComplet} ${beneficiaireSelectionne.prenomComplet}`,
      type_prestation: prestationTitre,
      fonction: fonctionChoisie,
      pieces_deposees: piecesSelectionnees,
      montant_avenant: isAvenant ? parseFloat(montantAvenant) || 0 : 0 // <--- ENVOI DU MONTANT
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
        montantAffichage: isAvenant ? (parseFloat(montantAvenant) || 0) : null,
        dateSysteme: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      });
      chargerDonnees();
    } catch (err) { alert("Erreur lors de l'enregistrement"); }
    finally { setIsSubmitting(false); }
  };

  // ── Composant liste de pièces réutilisable ────────────────────────────────
  function PiecesManager({ pieces, onAdd, onDelete, onStartEdit, onSaveEdit, onCancelEdit, onChangeTempNom, inputValue, onInputChange, placeholder = "Nom du document..." }) {
    return (
      <div className="space-y-3">
        {/* Liste des pièces existantes */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {pieces.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-sm font-medium bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              Aucun document requis pour l'instant
            </div>
          )}
          {pieces.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border-2 transition-all ${p.editing ? 'border-green-400 bg-green-50' : 'border-transparent'}`}>
              <GripVertical size={14} className="text-gray-300 shrink-0" />
              
              {p.editing ? (
                <>
                  <input
                    autoFocus
                    value={p.tempNom ?? p.nom}
                    onChange={e => onChangeTempNom(p.id, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') onSaveEdit(p.id); if (e.key === 'Escape') onCancelEdit(p.id); }}
                    className="flex-1 bg-white border border-green-300 rounded-lg px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button onClick={() => onSaveEdit(p.id)} className="w-7 h-7 bg-green-600 text-white rounded-lg flex items-center justify-center hover:bg-green-700 transition shrink-0">
                    <Check size={13} strokeWidth={3}/>
                  </button>
                  <button onClick={() => onCancelEdit(p.id)} className="w-7 h-7 bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center hover:bg-gray-300 transition shrink-0">
                    <X size={13}/>
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-bold text-slate-700 truncate">{p.nom}</span>
                  <span className="text-[10px] font-black text-slate-300 mr-1">#{i + 1}</span>
                  <button onClick={() => onStartEdit(p.id)} className="w-7 h-7 bg-white border border-gray-200 text-gray-400 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition shrink-0">
                    <Pencil size={12}/>
                  </button>
                  <button onClick={() => onDelete(p.id)} className="w-7 h-7 bg-white border border-gray-200 text-gray-400 rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition shrink-0">
                    <Trash2 size={12}/>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Champ d'ajout */}
        <div className="flex gap-2 mt-2">
          <input
            value={inputValue}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onAdd(); }}
            placeholder={placeholder}
            className="flex-1 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-green-400 focus:bg-green-50 transition-all placeholder-gray-300"
          />
          <button
            onClick={onAdd}
            disabled={!inputValue.trim()}
            className="px-4 py-2.5 bg-green-700 text-white rounded-xl font-black text-sm hover:bg-green-800 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
          >
            <Plus size={15}/> Ajouter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F7FE] font-sans text-slate-900">

      {/* ── TOPBAR ── */}
      <header className="bg-green-900 text-white sticky top-0 z-20 shadow-xl print:hidden">
        <div className="flex items-center justify-between px-8 h-16">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-xl border border-white/10"><Shield size={20}/></div>
            <span className="font-black text-base tracking-tight uppercase">Portal COS</span>
          </div>
          <nav className="flex items-center gap-2">
            <button onClick={() => setVueActive("dashboard")} className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all text-sm font-black ${vueActive === "dashboard" || vueActive === "formulaire" ? "bg-white text-green-900 shadow" : "text-green-100/70 hover:bg-white/10"}`}>
              <LayoutDashboard size={16}/> Dashboard
            </button>
            <button onClick={() => setVueActive("liste")} className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all text-sm font-black ${vueActive === "liste" ? "bg-white text-green-900 shadow" : "text-green-100/70 hover:bg-white/10"}`}>
              <ClipboardList size={16}/> Registre Général
            </button>
          </nav>
          <div className="w-36"/>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR ── */}
        {(vueActive === "dashboard" || vueActive === "formulaire") && (
          <aside className="w-64 bg-white border-r border-gray-100 shadow-sm flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] flex flex-col print:hidden">
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Prestations</p>
              <div className="flex flex-col gap-2">
                {blocs.map(b => (
                  <div key={b.id} className="relative group">
                    <button
                      onClick={() => ouvrirFormulaire(b)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all border-2 ${
                        prestationTitre === b.titre && vueActive === "formulaire"
                          ? "bg-green-900 border-green-900 text-white shadow-md"
                          : "bg-gray-50 border-transparent text-slate-700 hover:border-green-200 hover:bg-green-50"
                      }`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${prestationTitre === b.titre && vueActive === "formulaire" ? "bg-white/20 text-white" : "bg-white text-green-700 group-hover:bg-green-100"}`}>
                        {getIcon(b.titre)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate">{b.titre}</p>
                        <p className={`text-[10px] font-bold truncate ${prestationTitre === b.titre && vueActive === "formulaire" ? "text-green-200" : "text-slate-400"}`}>{b.pieces?.length || 0} docs requis</p>
                      </div>
                      <ChevronRight size={14} className="flex-shrink-0 opacity-50"/>
                    </button>
                    {/* Bouton modifier — apparaît au hover */}
                    <button
                      onClick={(e) => ouvrirEditPrestation(e, b)}
                      title="Modifier cette prestation"
                      className="absolute right-10 top-1/2 -translate-y-1/2 w-7 h-7 bg-white border border-gray-200 rounded-lg items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition hidden group-hover:flex z-10"
                    >
                      <Pencil size={12}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => setShowModalPrestation(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-50 border-2 border-dashed border-green-200 text-green-700 font-black text-sm hover:bg-green-900 hover:border-green-900 hover:text-white transition-all">
                <Plus size={16}/> Nouvelle prestation
              </button>
            </div>
          </aside>
        )}

        {/* ── CONTENU ── */}
        <main className="flex-1 p-8 lg:p-12 overflow-y-auto print:p-0 print:bg-white">

          {vueActive === "dashboard" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
              <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center text-green-700 mb-6 shadow-sm"><Shield size={36}/></div>
              <h1 className="text-3xl font-black text-slate-800 mb-3">Bienvenue sur Portal COS</h1>
              <p className="text-slate-400 font-medium max-w-sm">Sélectionnez une prestation dans la barre de gauche pour ouvrir un dossier.</p>
            </div>
          )}

          {vueActive === "formulaire" && (
            <div className="max-w-4xl mx-auto animate-in fade-in duration-500 print:hidden">
              <button onClick={fermerFormulaire} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-green-900 font-bold text-sm uppercase"><ArrowLeft size={20}/> Retour</button>
              <div className="bg-white p-10 rounded-[35px] shadow-xl border border-gray-100">
                <h2 className="text-3xl font-black text-slate-800 mb-10">{prestationTitre}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-green-900 uppercase">Rechercher l'Agent</label>
                      <div className="relative">
                        <Search className="absolute left-4 top-4 text-gray-400" size={20} />
                        <input className="w-full pl-12 p-4 bg-gray-50 border-none rounded-2xl outline-none font-bold" placeholder="Nom de l'agent..." value={nomRecherche} onChange={(e) => { setNomRecherche(e.target.value); if(e.target.value.length > 1) { setSuggestions(utilisateurs.filter(u => (u.nomComplet || "").toLowerCase().includes(e.target.value.toLowerCase()))); } else setSuggestions([]); }} />
                      </div>
                      {suggestions.length > 0 && (
                        <div className="absolute w-full max-w-md bg-white shadow-2xl rounded-2xl border border-gray-100 mt-2 overflow-hidden z-30">
                          {suggestions.map(u => (<div key={u.id} onClick={() => { setBeneficiaireSelectionne(u); setNomRecherche(`${u.nomComplet} ${u.prenomComplet}`); setSuggestions([]); }} className="p-4 hover:bg-green-50 cursor-pointer font-bold border-b last:border-0">{u.nomComplet} {u.prenomComplet}</div>))}
                        </div>
                      )}
                    </div>
                    {beneficiaireSelectionne && (
                      <div className="bg-green-50/50 p-6 rounded-[25px] border border-green-100 animate-in slide-in-from-left-2 shadow-sm">
                        <div className="flex items-center gap-4 mb-6"><div className="bg-green-900 text-white p-3 rounded-xl"><User size={20}/></div><h4 className="font-black text-green-900 uppercase text-sm">Fiche Bénéficiaire</h4></div>
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                          <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Nom</p><p className="font-bold text-slate-800">{beneficiaireSelectionne.nomComplet}</p></div>
                          <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Prénom</p><p className="font-bold text-slate-800">{beneficiaireSelectionne.prenomComplet}</p></div>
                          <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Date de Naissance</p><p className="font-bold text-slate-800">{beneficiaireSelectionne.dateNaissance}</p></div>
                          <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Lieu de Naissance</p><p className="font-bold text-slate-800">{beneficiaireSelectionne.lieuNaissance}</p></div>
                        </div>
                      </div>
                    )}
                    {/* ✅ AJOUT DU CHAMP MONTANT SI AVENANT */}
                    {prestationTitre.toLowerCase().includes("avenant") && (
                      <div className="bg-amber-50 p-6 rounded-[25px] border-2 border-amber-100 animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3 mb-4 text-amber-700">
                          <Landmark size={20} />
                          <label className="text-xs font-black uppercase">Montant de l'Avenant (DA)</label>
                        </div>
                        <input 
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full p-4 bg-white border-2 border-amber-200 rounded-xl outline-none font-black text-xl text-amber-700 focus:border-amber-500 transition-all"
                          value={montantAvenant}
                          onChange={(e) => setMontantAvenant(e.target.value)}
                        />
                        <p className="mt-2 text-[10px] font-bold text-amber-500 italic">* Saisissez le montant figurant sur le document médical</p>
                      </div>
                    )}
                    <div className="space-y-3">
                      <label className="text-xs font-black text-slate-400 uppercase">Confirmer la Catégorie</label>
                      <div className="flex gap-2">
                        {['ATS', 'Enseignant', 'Retraité'].map(f => (<button key={f} onClick={() => setFonctionChoisie(f)} className={`flex-1 py-4 rounded-xl text-xs font-black border-2 transition-all ${fonctionChoisie === f ? "bg-green-900 border-green-900 text-white" : "bg-white border-gray-100 text-gray-400"}`}>{f}</button>))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-8 rounded-[30px] border border-gray-100">
                    <label className="text-sm font-black text-green-900 uppercase block mb-6">Documents fournis</label>
                    <div className="space-y-3 mb-8">
                      {listePieces.map((p, i) => (
                        <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl bg-white border-2 transition-all ${p.cochee ? 'border-green-600 shadow-sm' : 'border-transparent'}`}>
                          <div onClick={() => { const copy = [...listePieces]; copy[i].cochee = !copy[i].cochee; setListePieces(copy); }} className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer ${p.cochee ? 'bg-green-700 border-green-700 text-white' : 'border-gray-200'}`}>{p.cochee && <Check size={14} strokeWidth={4}/>}</div>
                          <span className={`flex-1 font-bold text-sm ${p.cochee ? 'text-green-900' : 'text-gray-400'}`}>{p.nom}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={handleSubmit} disabled={!beneficiaireSelectionne || !fonctionChoisie || !toutesLesPiecesCochees || isSubmitting} className="w-full py-5 bg-green-900 text-white rounded-2xl font-black uppercase shadow-xl disabled:opacity-20 disabled:grayscale transition-all hover:scale-[1.02]">
                      {isSubmitting ? "Enregistrement..." : "Enregistrer le dossier"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {vueActive === "liste" && (
            <div className="animate-in fade-in duration-500">
              <div className="hidden print:block mb-8 border-b-4 border-green-900 pb-4">
                <h1 className="text-2xl font-black uppercase">Registre Général des Dossiers - COS</h1>
                <p className="font-bold text-slate-600">Extrait généré le : {new Date().toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10 print:hidden">
                <div>
                  <h1 className="text-3xl font-black text-slate-800 mb-2">Registre Général</h1>
                  <p className="text-slate-500 font-medium">Consultez et filtrez l'historique des dossiers</p>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => window.print()} className="flex items-center gap-2 bg-green-900 text-white px-6 py-4 rounded-2xl font-black shadow-lg hover:bg-green-800 transition-all"><Printer size={20}/> IMPRIMER LE TABLEAU</button>
                  <div className="flex flex-wrap gap-4 bg-white p-5 rounded-[30px] shadow-sm border border-gray-100 items-center">
                    <div className="flex flex-col"><span className="text-[10px] font-black text-green-800 uppercase ml-2 mb-1">Du</span><input type="date" value={dateDebut} onChange={(e)=>setDateDebut(e.target.value)} className="bg-gray-50 border-none rounded-xl text-xs font-bold p-2 outline-none"/></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black text-green-800 uppercase ml-2 mb-1">Au</span><input type="date" value={dateFin} onChange={(e)=>setDateFin(e.target.value)} className="bg-gray-50 border-none rounded-xl text-xs font-bold p-2 outline-none"/></div>
                    <div className="flex flex-col min-w-[200px]"><span className="text-[10px] font-black text-green-800 uppercase ml-2 mb-1">Recherche</span><div className="relative"><Search size={14} className="absolute left-3 top-3 text-gray-400"/><input placeholder="Nom..." value={rechercheRegistre} onChange={(e)=>setRechercheRegistre(e.target.value)} className="bg-gray-50 border-none rounded-xl text-xs font-bold p-2 pl-8 outline-none w-full"/></div></div>
                    <button onClick={()=>{setDateDebut(''); setDateFin(''); setRechercheRegistre('');}} className="mt-4 p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><X size={20}/></button>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-none print:rounded-none">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-green-900 text-white print:bg-gray-100 print:text-black">
                      <th className="p-6 text-xs font-black uppercase border-b print:border-gray-300">ID</th>
                      <th className="p-6 text-xs font-black uppercase border-b print:border-gray-300">Bénéficiaire</th>
                      <th className="p-6 text-xs font-black uppercase border-b print:border-gray-300">Catégorie</th>
                      <th className="p-6 text-xs font-black uppercase border-b print:border-gray-300">Prestation</th>
                      <th className="p-6 text-xs font-black uppercase border-b print:border-gray-300">Date Dépôt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 print:divide-gray-300">
                      {dossiersFiltrés.map((d) => (
                      <tr key={d.id} className="hover:bg-green-50/40">
                          <td className="p-6 text-xs font-bold text-slate-400">#{d.id}</td>
                         <td className="p-6 font-black text-slate-800">{d.nom_beneficiaire}</td>
                         <td className="p-6 text-xs font-bold">{d.type_prestation}</td>
                          <td className="p-6 text-center">
                          {d.montant_avenant > 0 ? (
                            <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-black text-xs">
                              {d.montant_avenant.toLocaleString('fr-FR')} DA
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold text-xs">—</span>
                          )}
                        </td>
                        <td className="p-6 font-black text-xs">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}                    
                    {dossiersFiltrés.length > 0 ? dossiersFiltrés.map((d) => (
                      <tr key={d.id} className="hover:bg-green-50/40 transition-colors">
                        <td className="p-6"><span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-[10px] font-bold print:border print:bg-transparent">#{d.id}</span></td>
                        <td className="p-6"><p className="font-black text-slate-800 text-sm">{d.nom_beneficiaire}</p></td>
                        <td className="p-6"><span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase print:border print:bg-transparent print:text-black">{d.fonction}</span></td>
                        <td className="p-6"><div className="flex items-center gap-2"><div className="text-green-700 scale-75 print:hidden">{getIcon(d.type_prestation)}</div><span className="font-bold text-xs text-slate-600">{d.type_prestation}</span></div></td>
                        <td className="p-6"><p className="font-black text-slate-800 text-xs">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</p><p className="text-[10px] text-slate-400 print:hidden">{new Date(d.createdAt).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</p></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" className="p-20 text-center text-slate-400 font-bold">Aucun dossier trouvé.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {accusereception && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:relative print:inset-auto print:block">
              <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 print:shadow-none print:rounded-none">
                <div className="bg-green-900 p-8 text-white flex justify-between items-center print:bg-white print:text-black print:border-b-4 print:border-green-900">
                  <div><h3 className="text-2xl font-black uppercase tracking-tight">Accusé de Réception</h3><p className="text-green-200 text-sm font-bold">Dossier N° {accusereception.num_sequence || '2026-X'}</p></div>
                  <button onClick={() => setAccuseReception(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors print:hidden"><X size={24}/></button>
                </div>
                <div className="p-10 space-y-8">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                    <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase">Type de Prestation</p><p className="text-xl font-black text-green-900">{prestationTitre}</p></div>
                    <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase italic flex items-center gap-2 justify-end"><Calendar size={12}/> Date de dépôt</p><p className="font-bold text-slate-800">{accusereception.dateSysteme}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Bénéficiaire</p><p className="font-black text-slate-800 text-lg">{accusereception.nom} {accusereception.prenom}</p></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Né(e) le</p><p className="font-bold text-slate-800">{accusereception.dateN}</p></div>
                        <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">À</p><p className="font-bold text-slate-800">{accusereception.lieuN}</p></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <p className="text-[10px] font-black text-green-900 uppercase mb-4 underline">Documents fournis</p>
                      <ul className="space-y-3">
                        {accusereception.piecesAffichees.map((p, index) => (<li key={index} className="flex items-center gap-2 text-sm font-bold text-slate-700"><Check size={18} className="text-green-600" strokeWidth={4}/> {p}</li>))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="p-10 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-slate-400 font-medium max-w-[200px]">Cet accusé prouve le dépôt de votre dossier auprès du service COS.</p>
                    <button onClick={() => window.print()} className="flex items-center gap-3 bg-green-900 text-white px-8 py-4 rounded-2xl font-black shadow-lg print:hidden"><Printer size={20}/> Imprimer l'accusé</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODALE AJOUT PRESTATION — grande, avec gestion des pièces
      ══════════════════════════════════════════════════════════════════════ */}
      {showModalPrestation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-green-900 px-8 py-6 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Nouvelle Prestation</h3>
                <p className="text-green-300 text-xs font-bold mt-0.5">Définissez le titre et les documents requis</p>
              </div>
              <button onClick={() => { setShowModalPrestation(false); setNewPrestationTitre(''); setNewPrestationPieces([]); setNewPieceInput(''); }} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                <X size={20}/>
              </button>
            </div>

            {/* Corps scrollable */}
            <div className="overflow-y-auto flex-1 p-8 space-y-7">
              {/* Titre */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-green-900 uppercase tracking-widest">Titre de la prestation <span className="text-red-500">*</span></label>
                <input
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-slate-800 border-2 border-transparent focus:border-green-300 transition-all text-base"
                  placeholder="ex: Aide médicale spécialisée"
                  value={newPrestationTitre}
                  onChange={e => setNewPrestationTitre(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Documents requis */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-green-900 uppercase tracking-widest">
                    Documents requis
                  </label>
                  <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {newPrestationPieces.length} document{newPrestationPieces.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <PiecesManager
                  pieces={newPrestationPieces}
                  onAdd={ajouterPieceNouveauForm}
                  onDelete={supprimerPieceNouveauForm}
                  onStartEdit={startEditPieceNouveauForm}
                  onSaveEdit={saveEditPieceNouveauForm}
                  onCancelEdit={cancelEditPieceNouveauForm}
                  onChangeTempNom={(id, val) => setNewPrestationPieces(prev => prev.map(p => p.id === id ? { ...p, tempNom: val } : p))}
                  inputValue={newPieceInput}
                  onInputChange={setNewPieceInput}
                  placeholder="ex: Demande manuscrite, Ordonnance..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 pb-7 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
              <button onClick={() => { setShowModalPrestation(false); setNewPrestationTitre(''); setNewPrestationPieces([]); setNewPieceInput(''); }} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-100 text-slate-500 font-black text-sm hover:bg-gray-50 transition-all">
                Annuler
              </button>
              <button onClick={ajouterPrestation} disabled={!newPrestationTitre.trim()} className="flex-1 py-3.5 rounded-2xl bg-green-900 text-white font-black text-sm shadow-lg disabled:opacity-30 hover:bg-green-800 transition-all flex items-center justify-center gap-2">
                <Plus size={16}/> Créer la prestation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODALE MODIFICATION PRESTATION — grande, avec gestion des pièces
      ══════════════════════════════════════════════════════════════════════ */}
      {showModalEdit && editPrestation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-blue-700 px-8 py-6 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Modifier la Prestation</h3>
                <p className="text-blue-200 text-xs font-bold mt-0.5">Modifiez le titre ou les documents requis</p>
              </div>
              <button onClick={() => { setShowModalEdit(false); setEditPrestation(null); }} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                <X size={20}/>
              </button>
            </div>

            {/* Corps scrollable */}
            <div className="overflow-y-auto flex-1 p-8 space-y-7">
              {/* Titre */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Titre de la prestation <span className="text-red-500">*</span></label>
                <input
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-slate-800 border-2 border-transparent focus:border-blue-300 transition-all text-base"
                  value={editTitre}
                  onChange={e => setEditTitre(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Documents requis */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest">
                    Documents requis
                  </label>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {editPieces.length} document{editPieces.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <PiecesManager
                  pieces={editPieces}
                  onAdd={ajouterPieceEdit}
                  onDelete={supprimerPieceEdit}
                  onStartEdit={startEditPieceEdit}
                  onSaveEdit={saveEditPieceEdit}
                  onCancelEdit={cancelEditPieceEdit}
                  onChangeTempNom={(id, val) => setEditPieces(prev => prev.map(p => p.id === id ? { ...p, tempNom: val } : p))}
                  inputValue={editPieceInput}
                  onInputChange={setEditPieceInput}
                  placeholder="Ajouter un document..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 pb-7 pt-4 border-t border-gray-100 flex gap-3 shrink-0">
              <button onClick={() => { setShowModalEdit(false); setEditPrestation(null); }} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-100 text-slate-500 font-black text-sm hover:bg-gray-50 transition-all">
                Annuler
              </button>
              <button onClick={sauvegarderModification} disabled={!editTitre.trim()} className="flex-1 py-3.5 rounded-2xl bg-blue-700 text-white font-black text-sm shadow-lg disabled:opacity-30 hover:bg-blue-800 transition-all flex items-center justify-center gap-2">
                <Check size={16}/> Sauvegarder les modifications
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}