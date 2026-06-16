"use client";

import React, { useState, useRef, useEffect } from "react";
import { UserPlus, Camera, Trash2, PlusCircle, RotateCcw, List, Edit3 } from "lucide-react";
import ProtectedRoutes from "../../../components/ProtectedRoutes";
import { apiFetch } from "../../../lib/api";

export default function AddTeacherForm() {
  const SEXES_AD = ["Masculin", "Féminin"];
  const SITUATIONS = ["Célibataire", "Marié(e)"];
  const [vueActive, setVueActive] = useState("formulaire");
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [listeUsers, setListeUsers] = useState([]);
  const [formData, setFormData] = useState({
    nomComplet: "", prenomComplet: "", dateNaissance: "", lieuNaissance: "",
    sexe: "Homme", departement: "", numero: "", email: "",
    positionAdministrative: "En activité", categorieRole: "Enseignant", photo: null
  });
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [ayantDroits, setAyantDroits] = useState([]);
  const [newAyantDroit, setNewAyantDroit] = useState({
    nom: "", prenom: "", dateNaissance: "", lieuNaissance: "",
    lien: "", sexe: "Masculin", situationMatrimoniale: "Célibataire", photo: null
  });
  const [termeRecherche, setTermeRecherche] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("Tous");
  const [expandedUser, setExpandedUser] = useState(null);
  const fileInputRef = useRef(null);

  const SEXES = ["Homme", "Femme"];
  const LIENS = ["Époux", "Épouse", "Enfant", "Ascendant"];
  const POSITIONS = ["En activité", "Retraite", "Mise en disponibilité", "Détachement", "Congé maternité", "Conge maladie longue durée"];
  const CATEGORIES = ["Enseignant", "ATS", "Retraité"];

  const chargerUsers = async () => {
    try {
      const data = await apiFetch("/users/all");
      if (!data) return;
      setListeUsers(Array.isArray(data) ? data : data.users || data.data || []);
    } catch (err) { console.error("Erreur:", err); }
  };

  useEffect(() => {
    if (vueActive === "liste") chargerUsers();
  }, [vueActive]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setFormData({ ...formData, photo: file }); setPreview(URL.createObjectURL(file)); }
  };

  const handleAyantDroitPhoto = (e) => {
    const file = e.target.files[0];
    if (file) setNewAyantDroit({ ...newAyantDroit, photo: file });
  };

  const addAyantDroit = () => {
    if (!newAyantDroit.nom || !newAyantDroit.prenom || !newAyantDroit.dateNaissance || !newAyantDroit.lien) {
      alert("Veuillez remplir tous les champs de l'ayant droit."); return;
    }
    const dateNaissance = new Date(newAyantDroit.dateNaissance);
    const aujourdhui = new Date();
    let age = aujourdhui.getFullYear() - dateNaissance.getFullYear();
    const m = aujourdhui.getMonth() - dateNaissance.getMonth();
    if (m < 0 || (m === 0 && aujourdhui.getDate() < dateNaissance.getDate())) age--;
    if (newAyantDroit.lien === "Enfant" && newAyantDroit.sexe === "Masculin" && age >= 21) {
      alert("Erreur : Un enfant de sexe masculin doit avoir moins de 21 ans."); return;
    }
    if (newAyantDroit.lien === "Enfant" && newAyantDroit.sexe === "Féminin" && newAyantDroit.situationMatrimoniale === "Marié(e)") {
      alert("Erreur : Une fille mariée ne peut plus être déclarée comme ayant droit."); return;
    }
    if (newAyantDroit.lien === "Enfant" && newAyantDroit.sexe === "Masculin" && newAyantDroit.situationMatrimoniale === "Marié(e)") {
  setAyantDroitError("❌ Un fils marié ne peut pas être déclaré ayant droit.");
  return;
}
    setAyantDroits([...ayantDroits, newAyantDroit]);
    setNewAyantDroit({ nom: "", prenom: "", dateNaissance: "", lieuNaissance: "", lien: "", sexe: "Masculin", situationMatrimoniale: "Célibataire", photo: null });
  };

  const removeAyantDroit = (index) => setAyantDroits(ayantDroits.filter((_, i) => i !== index));

  const resetForm = () => {
    setFormData({ nomComplet: "", prenomComplet: "", dateNaissance: "", lieuNaissance: "", sexe: "Homme", departement: "", numero: "", email: "", positionAdministrative: "En activité", categorieRole: "Enseignant", photo: null });
    setPreview(null); setAyantDroits([]); setIsEditing(false); setEditingId(null);
    setStatus({ type: "", message: "" });
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce fonctionnaire ?")) return;
    try {
      await apiFetch(`/users/${id}`, { method: "DELETE" });
      setListeUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) { console.error("Erreur réseau:", err); }
  };

  const startEdit = (user) => {
    setIsEditing(true); setEditingId(user.id);
    setFormData({
      nomComplet: user.nomComplet || "", prenomComplet: user.prenomComplet || "",
      dateNaissance: user.dateNaissance || "", lieuNaissance: user.lieuNaissance || "",
      sexe: user.sexe || "Homme", departement: user.departement || "",
      numero: user.numero || "", email: user.email || "",
      positionAdministrative: user.positionAdministrative || "En activité",
      categorieRole: user.categorieRole || "Enseignant", photo: null
    });
    setPreview(user.photo); setAyantDroits(user.ayantDroits || []);
    setVueActive("formulaire");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "loading", message: isEditing ? "Mise à jour..." : "Enregistrement..." });
    try {
      const dataToSend = new FormData();
      Object.keys(formData).forEach(key => { if (key !== "photo") dataToSend.append(key, formData[key]); });
      if (formData.photo) dataToSend.append("photo", formData.photo);
      dataToSend.append("ayantDroits", JSON.stringify(ayantDroits));
      const token = localStorage.getItem("token");
      const url = isEditing
        ? `http://localhost:5001/api/users/${editingId}`
        : "http://localhost:5001/api/users/register";
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: dataToSend,
      });
      if (response.ok) {
        setStatus({ type: "success", message: isEditing ? "Modifié avec succès !" : "Enregistré avec succès !" });
        setTimeout(() => { resetForm(); setVueActive("liste"); }, 1500);
      } else {
        const errorData = await response.json();
        setStatus({ type: "error", message: errorData.message || "Erreur." });
      }
    } catch (err) { setStatus({ type: "error", message: "Erreur serveur réseau." }); }
  };

  const inputClass = "w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition-all text-slate-800 font-medium";
  const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 ml-1";

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10">

      {/* ── ONGLETS ── */}
      <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-xl shadow-sm border border-slate-100 w-fit">
        <button
          onClick={() => { setVueActive("formulaire"); if (!isEditing) resetForm(); }}
          className={`flex items-center gap-2 py-2 px-5 rounded-lg text-sm font-bold transition-all ${
            vueActive === "formulaire"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          }`}
        >
          <UserPlus size={16} /> {isEditing ? "Modifier" : "Ajouter"} Fonctionnaire
        </button>
        <button
          onClick={() => setVueActive("liste")}
          className={`flex items-center gap-2 py-2 px-5 rounded-lg text-sm font-bold transition-all ${
            vueActive === "liste"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          }`}
        >
          <List size={16} /> Consulter la Liste
        </button>
      </div>

      {/* ── FORMULAIRE ── */}
      {vueActive === "formulaire" ? (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-10 animate-in fade-in duration-500">

          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <UserPlus size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  {isEditing ? "Modifier le profil" : "Nouveau Fonctionnaire"}
                </h2>
                <p className="text-slate-400 text-sm mt-1 font-medium">Formulaire de gestion du personnel</p>
              </div>
            </div>

            {/* Photo upload */}
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 hover:border-emerald-400 transition-all group-hover:shadow-md">
                {preview
                  ? <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  : <div className="text-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                      <Camera size={22} className="mx-auto mb-1" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Photo</span>
                    </div>
                }
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>
          </div>

          {/* Ligne déco */}
          <div className="w-full h-px bg-gradient-to-r from-emerald-100 via-teal-100 to-transparent mb-8"></div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div><label className={labelClass}>Nom Complet</label><input required name="nomComplet" value={formData.nomComplet} onChange={handleChange} className={inputClass} /></div>
              <div><label className={labelClass}>Prénom Complet</label><input required name="prenomComplet" value={formData.prenomComplet} onChange={handleChange} className={inputClass} /></div>
              <div><label className={labelClass}>Date de Naissance</label><input required type="date" name="dateNaissance" value={formData.dateNaissance} onChange={handleChange} className={inputClass} /></div>
              <div><label className={labelClass}>Lieu de Naissance</label><input required name="lieuNaissance" value={formData.lieuNaissance} onChange={handleChange} className={inputClass} /></div>
              <div>
                <label className={labelClass}>Position Administrative</label>
                <select name="positionAdministrative" value={formData.positionAdministrative} onChange={handleChange} className={inputClass}>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-1.5 ml-1">Catégorie (Rôle)</label>
                <select name="categorieRole" value={formData.categorieRole} onChange={handleChange}
                  className="w-full p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-300 transition-all text-emerald-800 font-bold">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Sexe</label>
                <select name="sexe" value={formData.sexe} onChange={handleChange} className={inputClass}>
                  {SEXES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Département</label><input required name="departement" value={formData.departement} onChange={handleChange} className={inputClass} /></div>
            </div>

            <div className="pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className={labelClass}>Numéro</label><input required name="numero" value={formData.numero} onChange={handleChange} className={inputClass} /></div>
              <div><label className={labelClass}>Email</label><input required type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} /></div>
            </div>

            {/* ── SECTION AYANT DROIT ── */}
            <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/30 p-8 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <PlusCircle size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-slate-800 font-black text-sm uppercase tracking-tight">Membres de la Famille</h3>
                  <p className="text-slate-400 text-[10px] font-medium">Ajoutez les ayants droit (enfants, conjoint...)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className={labelClass}>Nom</label>
                  <input placeholder="Nom de famille" value={newAyantDroit.nom}
                    onChange={(e) => setNewAyantDroit({ ...newAyantDroit, nom: e.target.value })}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-300 outline-none transition-all text-slate-800 font-medium" />
                </div>
                <div>
                  <label className={labelClass}>Prénom</label>
                  <input placeholder="Prénom" value={newAyantDroit.prenom}
                    onChange={(e) => setNewAyantDroit({ ...newAyantDroit, prenom: e.target.value })}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-300 outline-none transition-all text-slate-800 font-medium" />
                </div>
                <div>
                  <label className={labelClass}>Date de Naissance</label>
                  <input type="date" value={newAyantDroit.dateNaissance}
                    onChange={(e) => setNewAyantDroit({ ...newAyantDroit, dateNaissance: e.target.value })}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-300 outline-none transition-all text-slate-600 font-medium" />
                </div>
                <div>
                  <label className={labelClass}>Lien de parenté</label>
                  <select value={newAyantDroit.lien}
                    onChange={(e) => setNewAyantDroit({ ...newAyantDroit, lien: e.target.value })}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-300 outline-none transition-all text-slate-600 font-medium">
                    <option value="">Sélectionner...</option>
                    {LIENS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Sexe</label>
                    <select value={newAyantDroit.sexe}
                      onChange={(e) => setNewAyantDroit({ ...newAyantDroit, sexe: e.target.value })}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-300 outline-none transition-all text-slate-600 font-medium">
                      {SEXES_AD.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>État Civil</label>
                    <select value={newAyantDroit.situationMatrimoniale}
                      onChange={(e) => setNewAyantDroit({ ...newAyantDroit, situationMatrimoniale: e.target.value })}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-300 outline-none transition-all text-slate-600 font-medium">
                      {SITUATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className={labelClass + " text-center"}>Photo</label>
                    <div className="flex items-center justify-center gap-3 bg-white border border-slate-200 p-2 rounded-xl h-[52px]">
                      <label className="cursor-pointer p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-dashed border-slate-200">
                        <Camera size={18} />
                        <input type="file" className="hidden" onChange={handleAyantDroitPhoto} />
                      </label>
                      {newAyantDroit.photo
                        ? <img src={URL.createObjectURL(newAyantDroit.photo)} className="w-9 h-9 rounded-full object-cover border-2 border-emerald-400 shadow-sm" />
                        : <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200" />
                      }
                    </div>
                  </div>
                  <button type="button" onClick={addAyantDroit}
                    className="h-[52px] px-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-200 active:scale-95 text-sm uppercase tracking-wider">
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Ayants droit ajoutés */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-emerald-100">
                {ayantDroits.length === 0 && (
                  <p className="text-slate-400 italic text-[11px] py-2">Aucun ayant droit ajouté pour le moment...</p>
                )}
                {ayantDroits.map((ad, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white pl-2 pr-4 py-2 rounded-xl border border-slate-100 shadow-sm group animate-in zoom-in-95 duration-200">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
                      <img src={ad.photo ? (ad.photo instanceof File ? URL.createObjectURL(ad.photo) : ad.photo) : `https://ui-avatars.com/api/?name=${ad.nom}+${ad.prenom}&background=random`}
                        className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-slate-800 uppercase leading-none">{ad.nom} {ad.prenom}</div>
                      <div className="text-[9px] font-bold text-emerald-600 uppercase mt-1">{ad.lien} • {ad.sexe}</div>
                    </div>
                    <button type="button" onClick={() => removeAyantDroit(i)}
                      className="ml-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Boutons submit */}
            <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-4">
              <button type="submit"
                className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl shadow-lg shadow-emerald-200 hover:from-emerald-700 hover:to-teal-700 transition-all uppercase tracking-widest text-sm">
                {isEditing ? "Mettre à jour" : "Soumettre"}
              </button>
              <button type="button" onClick={resetForm}
                className="py-4 px-8 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 uppercase text-sm">
                <RotateCcw size={18} /> Réinitialiser
              </button>
            </div>

            {status.message && (
              <p className={`text-center font-bold text-sm ${status.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                {status.message}
              </p>
            )}
          </form>
        </div>

      ) : (
        /* ── LISTE ── */
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-8 animate-in fade-in duration-500">

          {/* Header liste */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Registre Global</h2>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button onClick={chargerUsers}
                className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100"
                title="Actualiser la liste">
                <RotateCcw size={18} />
              </button>
              <input type="text" placeholder="Rechercher..."
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-300 transition-all w-full md:w-56 text-sm font-medium text-slate-700"
                onChange={(e) => setTermeRecherche(e.target.value)} />
              <select
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-300 font-bold text-emerald-700 text-sm"
                onChange={(e) => setFiltreCategorie(e.target.value)}>
                <option value="Tous">Toutes les Catégories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white text-[10px] uppercase tracking-wider">
                  <th className="px-5 py-4 rounded-l-xl">Nom & Prénom</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Département</th>
                  <th className="px-5 py-4">Statut</th>
                  <th className="px-5 py-4 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listeUsers
                  .filter(user =>
                    (filtreCategorie === "Tous" || user.categorieRole === filtreCategorie) &&
                    (user.nomComplet?.toLowerCase().includes(termeRecherche.toLowerCase()) || user.numero?.includes(termeRecherche))
                  )
                  .map((user) => (
                    <React.Fragment key={user.id}>
                      <tr className="hover:bg-emerald-50/30 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.photo || `https://ui-avatars.com/api/?name=${user.nomComplet}`}
                              className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-100"
                              alt=""
                            />
                            <div>
                              <div className="text-sm font-black text-slate-800 uppercase">{user.nomComplet}</div>
                              <div className="text-[11px] text-slate-400 font-medium">{user.prenomComplet}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">
                          <div>{user.email}</div>
                          <div className="text-[11px] text-slate-400">{user.numero}</div>
                        </td>
                        <td className="px-5 py-4 font-bold uppercase text-xs text-slate-600">{user.departement}</td>
                        <td className="px-5 py-4">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                            {user.positionAdministrative}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => startEdit(user)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Modifier">
                              <Edit3 size={16} />
                            </button>
                            <button onClick={() => deleteUser(user.id)}
                              className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                              <Trash2 size={16} />
                            </button>
                            <button
                              onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                              className={`p-2 rounded-lg transition-all ${expandedUser === user.id ? "rotate-45 text-emerald-600 bg-emerald-50" : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"}`}>
                              <PlusCircle size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandedUser === user.id && (
                        <tr>
                          <td colSpan="5" className="px-6 pb-4">
                            <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/30 border border-emerald-100 rounded-xl p-5 animate-in slide-in-from-top-2 duration-300">
                              <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4">
                                Membres de la famille
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {user.ayantDroits && Array.isArray(user.ayantDroits) && user.ayantDroits.length > 0
                                  ? user.ayantDroits.map((ad, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm relative">
                                      <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-emerald-100 shadow-sm flex-shrink-0">
                                        <img src={ad.photo || `https://ui-avatars.com/api/?name=${ad.nom}+${ad.prenom}&background=random`}
                                          className="w-full h-full object-cover" alt="" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold uppercase truncate text-slate-800">{ad.nom} {ad.prenom}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">Né(e) le {ad.dateNaissance}</div>
                                      </div>
                                      <span className="absolute top-2 right-2 text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold uppercase">
                                        {ad.lien}
                                      </span>
                                    </div>
                                  ))
                                  : <p className="text-xs italic text-slate-400">Aucun membre de la famille enregistré.</p>
                                }
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
        </div>
      )}
    </div>
  );
}