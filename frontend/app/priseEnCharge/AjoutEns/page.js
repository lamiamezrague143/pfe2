"use client";

import React, { useState, useRef, useEffect } from "react";
import { UserPlus, Camera, Trash2, PlusCircle, RotateCcw, List, Edit3 } from "lucide-react";

export default function AddTeacherForm() {
  // --- ÉTATS ---
  // Dans tes constantes (en haut du fichier)
const SEXES_AD = ["Masculin", "Féminin"];
const SITUATIONS = ["Célibataire", "Marié(e)"];
  const [vueActive, setVueActive] = useState("formulaire");
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [listeUsers, setListeUsers] = useState([]);
  const [formData, setFormData] = useState({
    nomComplet: "",
    prenomComplet: "",
    dateNaissance: "",
    lieuNaissance: "",
    sexe: "Homme",
    departement: "",
    numero: "",
    email: "",
    positionAdministrative: "En activité",
    categorieRole: "Enseignant",
    photo: null
  });
 
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [ayantDroits, setAyantDroits] = useState([]);
const [newAyantDroit, setNewAyantDroit] = useState({
  nom: "", 
  prenom: "", 
  dateNaissance: "", 
  lieuNaissance: "", 
  lien: "", 
  sexe: "Masculin", // Ajout du sexe
  situationMatrimoniale: "Célibataire", // Ajout situation
  photo: null
});
  
  const [termeRecherche, setTermeRecherche] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("Tous");
  const [expandedUser, setExpandedUser] = useState(null);
  const fileInputRef = useRef(null);
  
  // --- OPTIONS ---
  const SEXES = ["Homme", "Femme"];
  const LIENS = ["Époux", "Épouse", "Enfant", "Ascendant"];
  const POSITIONS = ["En activité", "Retraite", "Mise en disponibilité", "Détachement", "Congé maternité", "Conge maladie longue durée"];
  const CATEGORIES = ["Enseignant", "ATS", "Retraité"];

  // --- LOGIQUE BACKEND ---
  const chargerUsers = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/users/all");
      const data = await res.json();
      setListeUsers(data);
    } catch (err) { console.error("Erreur:", err); }
  };

  useEffect(() => {
    if (vueActive === "liste") chargerUsers();
  }, [vueActive]);
  
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleAyantDroitPhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAyantDroit({ ...newAyantDroit, photo: file });
    }
  };

const addAyantDroit = () => {
  // 1. Vérification des champs vides
  if (!newAyantDroit.nom || !newAyantDroit.prenom || !newAyantDroit.dateNaissance || !newAyantDroit.lien) {
    alert("Veuillez remplir tous les champs de l'ayant droit.");
    return;
  }

  // 2. Calcul de l'âge
  const dateNaissance = new Date(newAyantDroit.dateNaissance);
  const aujourdhui = new Date();
  let age = aujourdhui.getFullYear() - dateNaissance.getFullYear();
  const m = aujourdhui.getMonth() - dateNaissance.getMonth();
  if (m < 0 || (m === 0 && aujourdhui.getDate() < dateNaissance.getDate())) {
    age--;
  }

  // 3. Règle pour les GARÇONS (Enfant de sexe Masculin)
  if (newAyantDroit.lien === "Enfant" && newAyantDroit.sexe === "Masculin") {
    if (age >= 18) {
      alert("Erreur : Un enfant de sexe masculin doit avoir moins de 18 ans pour être pris en charge.");
      return;
    }
  }

  // 4. Règle pour les FILLES (Enfant de sexe Féminin)
  if (newAyantDroit.lien === "Enfant" && newAyantDroit.sexe === "Féminin") {
    if (newAyantDroit.situationMatrimoniale === "Marié(e)") {
      alert("Erreur : Une fille mariée ne peut plus être déclarée comme ayant droit.");
      return;
    }
  }

  // Si tout est OK
  setAyantDroits([...ayantDroits, newAyantDroit]);
  setNewAyantDroit({ nom: "", prenom: "", dateNaissance: "", lieuNaissance: "", lien: "", sexe: "Masculin", situationMatrimoniale: "Célibataire", photo: null });
};
  const removeAyantDroit = (index) => setAyantDroits(ayantDroits.filter((_, i) => i !== index));

  const resetForm = () => {
    setFormData({ nomComplet: "", prenomComplet: "", dateNaissance: "", lieuNaissance: "", sexe: "Homme", departement: "", numero: "", email: "", positionAdministrative: "En activité", categorieRole: "Enseignant", photo: null });
    setPreview(null);
    setAyantDroits([]);
    setIsEditing(false);
    setEditingId(null);
    setStatus({ type: "", message: "" });
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce fonctionnaire ?")) return;
    try {
      const res = await fetch(`http://localhost:5001/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setListeUsers(prev => prev.filter(u => u.id !== id));
      }
    } catch (err) { console.error("Erreur réseau:", err); }
  };

  const startEdit = (user) => {
    setIsEditing(true);
    setEditingId(user.id);
    setFormData({
      nomComplet: user.nomComplet || "",
      prenomComplet: user.prenomComplet|| "",
      dateNaissance: user.dateNaissance || "",
      lieuNaissance: user.lieuNaissance || "",
      sexe: user.sexe || "Homme",
      departement: user.departement || "",
      numero: user.numero || "",
      email: user.email || "",
      positionAdministrative: user.positionAdministrative || "En activité",
      categorieRole: user.categorieRole || "Enseignant",
      photo: null
    });
    setPreview(user.photo);
    setAyantDroits(user.ayantDroits || []);
    setVueActive("formulaire");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", message: isEditing ? "Mise à jour..." : "Enregistrement..." });

    try {
      const dataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'photo') dataToSend.append(key, formData[key]);
      });
      if (formData.photo) dataToSend.append("photo", formData.photo);
      dataToSend.append('ayantDroits', JSON.stringify(ayantDroits));

      const url = isEditing 
        ? `http://localhost:5001/api/users/${editingId}` 
        : "http://localhost:5001/api/users/register";
      
      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, { method, body: dataToSend });

      if (response.ok) {
        setStatus({ type: "success", message: isEditing ? "Modifié avec succès !" : "Enregistré avec succès !" });
        setTimeout(() => { resetForm(); setVueActive("liste"); }, 1500);
      } else {
        const errorData = await response.json();
        setStatus({ type: "error", message: errorData.message || "Erreur." });
      }
    } catch (err) { setStatus({ type: "error", message: "Erreur serveur réseau." }); }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10">
      
      {/* 1. NAVIGATION */}
      <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-2xl w-fit">
        <button onClick={() => { setVueActive("formulaire"); if(!isEditing) resetForm(); }} className={`flex items-center gap-2 py-3 px-6 rounded-xl font-bold transition-all ${vueActive === "formulaire" ? "bg-white text-green-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <UserPlus size={18}/> {isEditing ? "Modifier" : "Ajouter"} Enseignant
        </button>
        <button onClick={() => setVueActive("liste")} className={`flex items-center gap-2 py-3 px-6 rounded-xl font-bold transition-all ${vueActive === "liste" ? "bg-white text-green-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <List size={18}/> Consulter la Liste
        </button>
      </div>

      {vueActive === "formulaire" ? (
        <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100 animate-in fade-in duration-500">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-4xl font-black text-slate-800 flex items-center gap-3">
                {isEditing ? "Modifier le profil" : "Nouveau Fonctionnaire"} <UserPlus size={32} className="text-green-900" />
              </h2>
              <p className="text-gray-400 mt-2 font-medium">Formulaire de gestion du personnel</p>
            </div>
            <div className="relative group" onClick={() => fileInputRef.current.click()}>
              <div className="w-28 h-28 rounded-2xl border-4 border-dashed border-gray-200 overflow-hidden cursor-pointer flex items-center justify-center bg-gray-50 hover:border-green-700 transition-all">
                {preview ? <img src={preview} alt="Preview" className="w-full h-full object-cover" /> : <div className="text-center text-gray-400"><Camera size={24} className="mx-auto" /><span className="text-[10px] font-bold uppercase">Photo</span></div>}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1"><label className="text-sm font-bold text-gray-700 ml-1">Nom Complet</label><input required name="nomComplet" value={formData.nomComplet} onChange={handleChange} className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none" /></div>
              <div className="space-y-1"><label className="text-sm font-bold text-gray-700 ml-1">Prénom Complet</label><input required name="prenomComplet" value={formData.prenomComplet} onChange={handleChange} className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none" /></div>
              <div className="space-y-1"><label className="text-sm font-bold text-gray-700 ml-1">Date de Naissance</label><input required type="date" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange} className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none" /></div>
              <div className="space-y-1"><label className="text-sm font-bold text-gray-700 ml-1">Lieu de Naissance</label><input required name="lieuNaissance" value={formData.lieuNaissance} onChange={handleChange} className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none" /></div>
              
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700 ml-1 uppercase">Position Administrative</label>
                <select name="positionAdministrative" value={formData.positionAdministrative} onChange={handleChange} className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none">
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700 ml-1 uppercase text-green-700">Catégorie (Rôle)</label>
                <select name="categorieRole" value={formData.categorieRole} onChange={handleChange} className="w-full p-4 bg-gray-50 border-2 border-green-100 rounded-2xl outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1"><label className="text-sm font-bold text-gray-700 ml-1">Sexe</label><select name="sexe" value={formData.sexe} onChange={handleChange} className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none">{SEXES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="space-y-1"><label className="text-sm font-bold text-gray-700 ml-1">Département</label><input required name="departement" value={formData.departement} onChange={handleChange} className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none" /></div>
            </div>

            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1"><label className="text-sm font-bold text-gray-700 ml-1">Numéro</label><input required name="numero" value={formData.numero} onChange={handleChange} className="w-full p-4 bg-gray-50 border-none rounded-2xl" /></div>
              <div className="space-y-1"><label className="text-sm font-bold text-gray-700 ml-1">Email</label><input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-4 bg-gray-50 border-none rounded-2xl" /></div>
            </div>

            {/* SECTION AYANT DROIT */}
            {/* SECTION AYANT DROIT */}
<div className="bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h3 className="text-slate-800 font-black flex items-center gap-2 text-lg uppercase tracking-tight">
        <PlusCircle size={22} className="text-green-800" /> 
        Membres de la Famille
      </h3>
      <p className="text-gray-400 text-xs font-medium ml-8">Ajoutez les ayants droit (enfants, conjoint...)</p>
    </div>
  </div>

  {/* Formulaire d'ajout rapide */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nom</label>
      <input 
        placeholder="Nom de famille" 
        value={newAyantDroit.nom} 
        onChange={(e) => setNewAyantDroit({...newAyantDroit, nom: e.target.value})} 
        className="w-full p-3.5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-green-100 outline-none transition-all" 
      />
    </div>

    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Prénom</label>
      <input 
        placeholder="Prénom" 
        value={newAyantDroit.prenom} 
        onChange={(e) => setNewAyantDroit({...newAyantDroit, prenom: e.target.value})} 
        className="w-full p-3.5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-green-100 outline-none transition-all" 
      />
    </div>

    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Date de Naissance</label>
      <input 
        type="date" 
        value={newAyantDroit.dateNaissance} 
        onChange={(e) => setNewAyantDroit({...newAyantDroit, dateNaissance: e.target.value})} 
        className="w-full p-3.5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-green-100 outline-none transition-all text-gray-600" 
      />
    </div>

    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Lien de parenté</label>
      <select 
        value={newAyantDroit.lien} 
        onChange={(e) => setNewAyantDroit({...newAyantDroit, lien: e.target.value})} 
        className="w-full p-3.5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-green-100 outline-none transition-all text-gray-600"
      >
        <option value="">Sélectionner...</option>
        {LIENS.map(l => <option key={l} value={l}>{l}</option>)}
      </select>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Sexe</label>
        <select 
          value={newAyantDroit.sexe} 
          onChange={(e) => setNewAyantDroit({...newAyantDroit, sexe: e.target.value})}
          className="w-full p-3.5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-green-100 outline-none transition-all text-gray-600"
        >
          {SEXES_AD.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">État Civil</label>
        <select 
          value={newAyantDroit.situationMatrimoniale} 
          onChange={(e) => setNewAyantDroit({...newAyantDroit, situationMatrimoniale: e.target.value})}
          className="w-full p-3.5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-green-100 outline-none transition-all text-gray-600"
        >
          {SITUATIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>

    <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 text-center block">Photo</label>
            <div className="flex items-center justify-center gap-3 bg-white p-2 rounded-2xl shadow-sm h-[52px]">
                <label className="cursor-pointer p-2 bg-gray-50 text-gray-500 rounded-xl hover:bg-green-50 hover:text-green-700 transition-all border border-dashed border-gray-200">
                    <Camera size={20} />
                    <input type="file" className="hidden" onChange={handleAyantDroitPhoto} />
                </label>
                {newAyantDroit.photo ? (
                    <img src={URL.createObjectURL(newAyantDroit.photo)} className="w-9 h-9 rounded-full object-cover border-2 border-green-500 shadow-sm" />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200" />
                )}
            </div>
        </div>
        <button 
          type="button" 
          onClick={addAyantDroit} 
          className="h-[52px] px-6 bg-green-900 text-white rounded-2xl font-black hover:bg-green-800 transition-all shadow-md active:scale-95"
        >
          AJOUTER
        </button>
    </div>
  </div>

  {/* Liste des ayants droits ajoutés */}
  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
    {ayantDroits.length === 0 && <p className="text-gray-400 italic text-[11px] py-2">Aucun ayant droit ajouté pour le moment...</p>}
    {ayantDroits.map((ad, i) => (
      <div key={i} className="flex items-center gap-3 bg-white pl-2 pr-4 py-2 rounded-2xl border border-gray-100 shadow-sm group animate-in zoom-in-95 duration-200">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
          <img 
            src={ad.photo ? (ad.photo instanceof File ? URL.createObjectURL(ad.photo) : ad.photo) : `https://ui-avatars.com/api/?name=${ad.nom}+${ad.prenom}&background=random`} 
            className="w-full h-full object-cover" 
          />
        </div>
        <div>
            <div className="text-[11px] font-black text-slate-800 uppercase leading-none">{ad.nom} {ad.prenom}</div>
            <div className="text-[9px] font-bold text-green-700 uppercase mt-1">{ad.lien} • {ad.sexe}</div>
        </div>
        <button 
          type="button"
          onClick={() => removeAyantDroit(i)}
          className="ml-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>
    ))}
  </div>
</div>

            <div className="pt-6 border-t flex flex-col md:flex-row gap-4">
              <button type="submit" className="flex-1 py-5 bg-green-900 text-white font-black rounded-2xl shadow-lg hover:bg-green-800 transition-all uppercase tracking-widest text-lg">
                {isEditing ? "Mettre à jour" : "Soumettre"}
              </button>
              <button type="button" onClick={resetForm} className="py-5 px-8 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 uppercase text-sm">
                <RotateCcw size={20} /> Réinitialiser
              </button>
            </div>
            {status.message && <p className={`text-center font-bold ${status.type === "success" ? "text-green-600" : "text-red-600"}`}>{status.message}</p>}
          </form>
        </div>
      ) : (
        <section className="bg-white rounded-3xl shadow-xl p-8 animate-in fade-in duration-500 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-3xl font-black text-slate-800">Registre Global</h2>
            <div className="flex gap-3 w-full md:w-auto">
              {/* BOUTON REFRESH AJOUTÉ ICI */}
              <button 
                onClick={chargerUsers} 
                className="p-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors border border-green-100"
                title="Actualiser la liste"
              >
                <RotateCcw size={20} />
              </button>
              <input type="text" placeholder="Rechercher..." className="p-3 bg-gray-50 border-none rounded-xl outline-none w-full md:w-64" onChange={(e) => setTermeRecherche(e.target.value)} />
              <select className="p-3 bg-gray-100 border-none rounded-xl font-bold text-green-900" onChange={(e) => setFiltreCategorie(e.target.value)}>
                <option value="Tous">Toutes les Catégories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="text-gray-400 uppercase text-[11px] font-black">
                  <th className="px-6 py-2">Profil</th>
                  <th className="px-6 py-2">Contact</th>
                  <th className="px-6 py-2">Département</th>
                  <th className="px-6 py-2">Statut</th>
                  <th className="px-6 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {listeUsers
                  .filter(user => (filtreCategorie === "Tous" || user.categorieRole === filtreCategorie) && (user.nomComplet?.toLowerCase().includes(termeRecherche.toLowerCase()) || user.numero?.includes(termeRecherche)))
                  .map((user) => (
                    <React.Fragment key={user.id}>
                      <tr className="bg-gray-50 hover:bg-green-50 transition-all rounded-2xl">
                        <td className="px-6 py-4 rounded-l-2xl font-bold">
                          <div className="flex items-center gap-3">
                            <img src={user.photo || `https://ui-avatars.com/api/?name=${user.nomComplet}`} className="w-10 h-10 rounded-lg object-cover" alt="" />
                            {user.nomComplet}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email} <br/> {user.numero}</td>
                        <td className="px-6 py-4 font-bold uppercase text-xs">{user.departement}</td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">{user.positionAdministrative}</span>
                        </td>
                        <td className="px-6 py-4 rounded-r-2xl text-right flex items-center justify-end gap-2">
                          <button onClick={() => startEdit(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Modifier">
                            <Edit3 size={18} />
                          </button>
                          <button onClick={() => deleteUser(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer">
                            <Trash2 size={18} />
                          </button>
                          <button onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)} className={`p-2 transition-transform ${expandedUser === user.id ? "rotate-45 text-green-700" : "text-slate-400 hover:text-green-700"}`}>
                            <PlusCircle size={20} />
                          </button>
                        </td>
                      </tr>

                      {expandedUser === user.id && (
                        <tr>
                          <td colSpan="5" className="px-8 pb-4">
                            <div className="bg-white border-2 border-green-50 rounded-2xl p-6 shadow-inner animate-in slide-in-from-top-2 duration-300">
                              <h4 className="text-[10px] font-black text-green-900 uppercase mb-4 tracking-widest">Membres de la famille</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {user.ayantDroits && Array.isArray(user.ayantDroits) && user.ayantDroits.length > 0 ? user.ayantDroits.map((ad, idx) => (
                                  <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 relative group overflow-hidden">
                                    {/* Avatar Ayant Droit dans la liste */}
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white border-2 border-white shadow-sm flex-shrink-0">
                                       <img src={ad.photo || `https://ui-avatars.com/api/?name=${ad.nom}+${ad.prenom}&background=random`} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-bold uppercase truncate">{ad.nom} {ad.prenom}</div>
                                      <div className="text-[10px] text-gray-500 font-medium">Né(e) le {ad.dateNaissance} à {ad.lieuNaissance}</div>
                                    </div>
                                    <span className="absolute top-2 right-2 text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">{ad.lien}</span>
                                  </div>
                                )) : <p className="text-xs italic text-gray-400">Aucun membre de la famille enregistré.</p>}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}