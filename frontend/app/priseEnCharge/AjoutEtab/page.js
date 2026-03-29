"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, List, MapPin, Phone, Mail, Stethoscope, Trash2, ShieldCheck, Activity } from "lucide-react";

export default function AddClinicForm() {
  const [vueActive, setVueActive] = useState("formulaire");
  const [listeCliniques, setListeCliniques] = useState([]);
  const [formData, setFormData] = useState({
    nom: "",
    type: "Clinique",
    adresse: "",
    telephone: [""],
    email: "",
    services: []
  });

  const TYPES = ["Clinique", "Laboratoire d'analyse", "Centre d'imagerie" , "Clinique dentaire","Ophtalmologie"];
  const SERVICES_DISPONIBLES = [
    "Radiologie", "Soins dentaires", "Interventions chirurgicales", 
    "Analyses medicales", "Soins ophtalmologiques" , "Circoncision"
  ];

  const chargerCliniques = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/clinics/all");
      const data = await res.json();
      setListeCliniques(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (vueActive === "liste") chargerCliniques(); }, [vueActive]);

  const ajouterTel = () => {
    setFormData({ ...formData, telephone: [...formData.telephone, ""] });
  };

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

  // --- LOGIQUE DE SOUMISSION CORRIGÉE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Si formData.id existe, on fait un PUT, sinon un POST
    const isEditing = !!formData.id;
    const url = isEditing 
      ? `http://localhost:5001/api/clinics/${formData.id}` 
      : "http://localhost:5001/api/clinics/register";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        alert(isEditing ? "Modification réussie !" : "Ajout réussi ! Numéro : " + data.numeroSequence);

        // Réinitialisation complète
        setFormData({
          nom: "",
          type: "Clinique",
          adresse: "",
          telephone: [""],
          email: "",
          services: []
        });

        setVueActive("liste");
        chargerCliniques();
      }
    } catch (err) {
      alert("Erreur lors de l'envoi");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 font-sans">
      <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-2xl w-fit">
        <button onClick={() => {
            // Reset du formulaire si on clique sur "Nouveau" après une modif
            setFormData({ nom: "", type: "Clinique", adresse: "", telephone: [""], email: "", services: [] });
            setVueActive("formulaire");
        }} className={`flex items-center gap-2 py-3 px-6 rounded-xl font-bold transition-all ${vueActive === "formulaire" && !formData.id ? "bg-white text-green-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <PlusCircle size={18}/> Nouveau Partenaire
        </button>
        <button onClick={() => setVueActive("liste")} className={`flex items-center gap-2 py-3 px-6 rounded-xl font-bold transition-all ${vueActive === "liste" ? "bg-white text-green-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <List size={18}/> Liste des Conventions
        </button>
      </div>

      {vueActive === "formulaire" ? (
        <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100 animate-in fade-in duration-500">
          <div className="mb-10">
            <h2 className="text-4xl font-black text-slate-800 flex items-center gap-3">
              {formData.id ? "Modifier la Convention" : "Ajouter une Convention"} <ShieldCheck size={32} className="text-green-700" />
            </h2>
            <p className="text-gray-400 mt-2 font-medium">Gestion des établissements de santé conventionnés</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700 ml-1">Nom de l'établissement</label>
                  <input required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 ring-green-100" placeholder="Ex: Clinique El Amen" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700 ml-1">Type d'établissement</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none">
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700 ml-1">Adresse Complète</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-gray-400" size={20} />
                    <input required value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})} className="w-full p-4 pl-12 bg-gray-50 border-none rounded-2xl outline-none" placeholder="Rue, Ville, Wilaya" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700 ml-1">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-4 text-gray-400" size={20} />
                    <div className="pl-12">
                      {formData.telephone.map((tel, index) => (
                        <input
                          key={index}
                          value={tel}
                          onChange={(e) => modifierTel(index, e.target.value)}
                          className="w-full p-4 bg-gray-50 rounded-2xl mb-2 outline-none"
                          placeholder="Numéro téléphone"
                        />
                      ))}
                      <button type="button" onClick={ajouterTel} className="text-green-700 font-bold text-sm">
                        + Ajouter numéro
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700 ml-1">Email professionnel</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-4 text-gray-400" size={20} />
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 pl-12 bg-gray-50 border-none rounded-2xl outline-none" placeholder="contact@etablissement.dz" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <label className="text-sm font-black text-green-900 uppercase tracking-widest mb-4 block">Services Assurés</label>
              <div className="flex flex-wrap gap-3">
                {SERVICES_DISPONIBLES.map(service => (
                  <button key={service} type="button" onClick={() => toggleService(service)} 
                    className={`px-6 py-3 rounded-2xl font-bold transition-all border-2 ${formData.services.includes(service) ? "bg-green-900 border-green-900 text-white shadow-md" : "bg-white border-gray-100 text-gray-500 hover:border-green-200"}`}>
                    {service}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full py-5 bg-green-900 text-white font-black rounded-2xl shadow-lg hover:bg-green-800 transition-all uppercase tracking-widest text-lg mt-8">
              {formData.id ? "Mettre à jour la convention" : "Enregistrer la convention"}
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
          {listeCliniques.map(clinic => (
            <div key={clinic.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                  {clinic.numeroSequence}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{clinic.type}</span>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">{clinic.nom}</h3>
              <div className="space-y-2 text-sm text-gray-500 mb-6">
                <p className="flex items-center gap-2"><MapPin size={14}/> {clinic.adresse}</p>
                {(() => {
                  try {
                    const tels = typeof clinic.telephone === 'string' ? JSON.parse(clinic.telephone) : clinic.telephone;
                    return Array.isArray(tels) ? tels.map((tel, i) => (
                      <p key={i} className="flex items-center gap-2"><Phone size={14}/> {tel}</p>
                    )) : null;
                  } catch (e) { return null; }
                })()}
              </div>
              <div className="flex flex-wrap gap-1">
                {clinic.services && (typeof clinic.services === 'string' ? JSON.parse(clinic.services) : clinic.services).map(s => (
                  <span key={s} className="bg-slate-50 text-slate-600 px-2 py-1 rounded-md text-[9px] font-bold border border-slate-100">
                    {s}
                  </span>
                ))}
              </div>
              <div className="flex gap-4 mt-4 pt-4 border-t border-gray-50">
                <button
                  onClick={async () => {
                    if(confirm("Supprimer cette clinique ?")) {
                      await fetch(`http://localhost:5001/api/clinics/${clinic.id}`, { method: "DELETE" });
                      chargerCliniques();
                    }
                  }}
                  className="text-red-500 flex items-center gap-1 text-sm font-bold"
                >
                  <Trash2 size={16}/> Supprimer
                </button>
                <button
                  onClick={() => {
                    const safeParse = (data) => {
                      if (!data) return [];
                      if (typeof data !== 'string') return data;
                      try { return JSON.parse(data); } catch (e) { return [data]; }
                    };

                    setFormData({
                      ...clinic,
                      telephone: safeParse(clinic.telephone),
                      services: safeParse(clinic.services)
                    });
                    setVueActive("formulaire");
                  }}
                  className="text-blue-500 text-sm font-bold"
                >
                  Modifier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}