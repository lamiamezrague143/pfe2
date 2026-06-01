"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, List, MapPin, Phone, Mail, Trash2, ShieldCheck } from "lucide-react";
import ProtectedRoutes from "../../../components/ProtectedRoutes";
import { apiFetch } from "../../../lib/api";

export default function AddClinicForm() {
  const [vueActive, setVueActive] = useState("formulaire");
  const [listeCliniques, setListeCliniques] = useState([]);
  const [formData, setFormData] = useState({
    nom: "", type: "Clinique", adresse: "", telephone: [""], email: "", services: []
  });

  const TYPES = ["Clinique", "Laboratoire d'analyse", "Centre d'imagerie", "Clinique dentaire", "Ophtalmologie"];
  const [servicesDisponibles, setServicesDisponibles] = useState([]);

  useEffect(() => {
    const chargerServices = async () => {
      try {
        const data = await apiFetch("/typesprestations");
        if (!data) return;
        const liste = Array.isArray(data) ? data : data.types || data.data || [];
        setServicesDisponibles(liste.map(t => t.nom));
      } catch (err) { console.error("Erreur chargement prestations", err); }
    };
    chargerServices();
  }, []);

  const chargerCliniques = async () => {
    try {
      const data = await apiFetch("/clinics/all");
      if (!data) return;
      const liste = Array.isArray(data) ? data : data?.data || data?.clinics || [];
      setListeCliniques(liste);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (vueActive === "liste") chargerCliniques();
  }, [vueActive]);

  const ajouterTel = () => setFormData({ ...formData, telephone: [...formData.telephone, ""] });

  const modifierTel = (index, value) => {
    const updated = [...formData.telephone];
    updated[index] = value;
    setFormData({ ...formData, telephone: updated });
  };

  const toggleService = (service) => {
    const updated = formData.services.includes(service)
      ? formData.services.filter(s => s !== service)
      : [...formData.services, service];
    setFormData({ ...formData, services: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEditing = !!formData.id;
    const endpoint = isEditing ? `/clinics/${formData.id}` : "/clinics/register";
    const method   = isEditing ? "PUT" : "POST";
    try {
      const data = await apiFetch(endpoint, { method, body: JSON.stringify(formData) });
      if (!data) return;
      alert(isEditing ? "Modification réussie !" : "Ajout réussi ! Numéro : " + data.numeroSequence);
      setFormData({ nom: "", type: "Clinique", adresse: "", telephone: [""], email: "", services: [] });
      setVueActive("liste");
      chargerCliniques();
    } catch (err) { alert("Erreur lors de l'envoi"); }
  };

  const supprimerClinique = async (id) => {
    if (!confirm("Supprimer cette clinique ?")) return;
    try {
      await apiFetch(`/clinics/${id}`, { method: "DELETE" });
      chargerCliniques();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 font-sans">

      {/* ── ONGLETS ── */}
      <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-xl shadow-sm border border-slate-100 w-fit">
        <button
          onClick={() => {
            setFormData({ nom: "", type: "Clinique", adresse: "", telephone: [""], email: "", services: [] });
            setVueActive("formulaire");
          }}
          className={`flex items-center gap-2 py-2 px-5 rounded-lg text-sm font-bold transition-all ${
            vueActive === "formulaire" && !formData.id
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          }`}
        >
          <PlusCircle size={16} /> Nouveau Partenaire
        </button>
        <button
          onClick={() => setVueActive("liste")}
          className={`flex items-center gap-2 py-2 px-5 rounded-lg text-sm font-bold transition-all ${
            vueActive === "liste"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          }`}
        >
          <List size={16} /> Liste des Conventions
        </button>
      </div>

      {/* ── FORMULAIRE ── */}
      {vueActive === "formulaire" ? (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-10 animate-in fade-in duration-500">

          {/* Header */}
          <div className="mb-8 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {formData.id ? "Modifier la Convention" : "Ajouter une Convention"}
              </h2>
              <p className="text-slate-400 text-sm mt-1 font-medium">Gestion des établissements de santé conventionnés</p>
            </div>
          </div>

          {/* Ligne décorative */}
          <div className="w-full h-px bg-gradient-to-r from-emerald-100 via-teal-100 to-transparent mb-8"></div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Colonne gauche */}
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                    Nom de l'établissement
                  </label>
                  <input
                    required
                    value={formData.nom}
                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition-all text-slate-800 font-medium"
                    placeholder="Ex: Clinique El Amen"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                    Type d'établissement
                  </label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-300 transition-all text-slate-700 font-medium"
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                    Adresse Complète
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                    <input
                      required
                      value={formData.adresse}
                      onChange={e => setFormData({ ...formData, adresse: e.target.value })}
                      className="w-full p-3.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-300 transition-all text-slate-800 font-medium"
                      placeholder="Rue, Ville, Wilaya"
                    />
                  </div>
                </div>
              </div>

              {/* Colonne droite */}
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                    Téléphone
                  </label>
                  <div className="space-y-2">
                    {formData.telephone.map((tel, index) => (
                      <div key={index} className="relative">
                        <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                        <input
                          value={tel}
                          onChange={(e) => modifierTel(index, e.target.value)}
                          className="w-full p-3.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-300 transition-all text-slate-800 font-medium"
                          placeholder="Numéro téléphone"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={ajouterTel}
                      className="text-emerald-600 font-bold text-sm hover:text-emerald-700 transition-colors flex items-center gap-1"
                    >
                      <PlusCircle size={14} /> Ajouter numéro
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5 ml-1">
                    Email professionnel
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-3.5 pl-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-300 transition-all text-slate-800 font-medium"
                      placeholder="contact@etablissement.dz"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="pt-6 border-t border-slate-100">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-4">
                Services Assurés
              </label>
              <div className="flex flex-wrap gap-2">
                {servicesDisponibles.map(service => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => toggleService(service)}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border ${
                      formData.services.includes(service)
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 border-transparent text-white shadow-md shadow-emerald-200"
                        : "bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-700"
                    }`}
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl shadow-lg shadow-emerald-200 hover:from-emerald-700 hover:to-teal-700 transition-all uppercase tracking-widest text-sm mt-4"
            >
              {formData.id ? "Mettre à jour la convention" : "Enregistrer la convention"}
            </button>
          </form>
        </div>

      ) : (
        /* ── LISTE ── */
        <div>
          {/* Header liste */}
          <div className="flex items-center gap-2 mb-6 p-5 bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100">
            <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">
              Conventions actives
            </h2>
            <span className="ml-auto bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
              {listeCliniques.length} établissement{listeCliniques.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in">
            {listeCliniques.map(clinic => (
              <div
                key={clinic.id}
                className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 group"
              >
                {/* Top badges */}
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {clinic.numeroSequence}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-full">
                    {clinic.type}
                  </span>
                </div>

                {/* Nom */}
                <h3 className="text-lg font-black text-slate-800 mb-3 group-hover:text-emerald-700 transition-colors">
                  {clinic.nom}
                </h3>

                {/* Infos */}
                <div className="space-y-1.5 text-sm text-slate-500 mb-5">
                  <p className="flex items-center gap-2">
                    <MapPin size={13} className="text-emerald-500 flex-shrink-0" />
                    <span className="truncate">{clinic.adresse}</span>
                  </p>
                  {(() => {
                    try {
                      const tels = typeof clinic.telephone === "string" ? JSON.parse(clinic.telephone) : clinic.telephone;
                      return Array.isArray(tels)
                        ? tels.map((tel, i) => (
                          <p key={i} className="flex items-center gap-2">
                            <Phone size={13} className="text-emerald-500 flex-shrink-0" />
                            {tel}
                          </p>
                        ))
                        : null;
                    } catch (e) { return null; }
                  })()}
                </div>

                {/* Services */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {clinic.services &&
                    (typeof clinic.services === "string" ? JSON.parse(clinic.services) : clinic.services).map(s => (
                      <span key={s} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-[9px] font-bold">
                        {s}
                      </span>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => supprimerClinique(clinic.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} /> Supprimer
                  </button>
                  <button
                    onClick={() => {
                      const safeParse = (data) => {
                        if (!data) return [];
                        if (typeof data !== "string") return data;
                        try { return JSON.parse(data); } catch (e) { return [data]; }
                      };
                      setFormData({ ...clinic, telephone: safeParse(clinic.telephone), services: safeParse(clinic.services) });
                      setVueActive("formulaire");
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors ml-auto"
                  >
                    ✏️ Modifier
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}