"use client";
import React, { useEffect, useState } from "react";
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { apiFetch } from "../../../lib/api";

const STATUTS = {
  en_attente: {
    label: "En attente",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    bar: "bg-amber-400",
    icon: ClockIcon,
    step: 1,
    desc: "Votre dossier a bien été reçu. Il est en attente de traitement par le secrétariat.",
  },
  en_cours: {
    label: "En cours d'étude",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    bar: "bg-blue-500",
    icon: ArrowPathIcon,
    step: 2,
    desc: "Votre dossier est actuellement en cours d'examen par nos services.",
  },
  valide: {
    label: "Validé ✓",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
    icon: CheckCircleIcon,
    step: 3,
    desc: "Félicitations ! Votre dossier a été approuvé. Vous serez contacté prochainement.",
  },
  refuse: {
    label: "Refusé",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    bar: "bg-red-400",
    icon: ExclamationCircleIcon,
    step: 0,
    desc: "Votre dossier a été refusé. Consultez le motif ci-dessous.",
  },
};

// Normalise les valeurs de statut venant du backend (casse, accents, etc.)
function normaliserStatut(statut) {
  if (!statut) return "en_attente";
  const s = String(statut).toLowerCase().trim();
  if (s === "refuse" || s === "refusé" || s === "rejeté" || s === "rejete") return "refuse";
  if (s === "valide" || s === "validé" || s === "validée" || s === "validee") return "valide";
  if (s === "en_cours" || s === "en cours" || s === "en_cours_etude") return "en_cours";
  return "en_attente";
}

const STEPS = [
  { key: "en_attente", label: "Déposé",   icon: DocumentTextIcon },
  { key: "en_cours",   label: "En étude", icon: ArrowPathIcon },
  { key: "valide",     label: "Validé",   icon: CheckCircleIcon },
];

const FILTRES = [
  { key: "tous",       label: "Tous",       color: "from-slate-600 to-slate-700",  lightBg: "bg-slate-50",   lightBorder: "border-slate-200",   textColor: "text-slate-700" },
  { key: "en_attente", label: "En attente", color: "from-amber-500 to-orange-500", lightBg: "bg-amber-50",   lightBorder: "border-amber-200",   textColor: "text-amber-700" },
  { key: "en_cours",   label: "En cours",   color: "from-blue-500 to-blue-600",    lightBg: "bg-blue-50",    lightBorder: "border-blue-200",    textColor: "text-blue-700" },
  { key: "valide",     label: "Validés",    color: "from-emerald-500 to-teal-600", lightBg: "bg-emerald-50", lightBorder: "border-emerald-200", textColor: "text-emerald-700" },
  { key: "refuse",     label: "Refusés",    color: "from-red-500 to-red-600",      lightBg: "bg-red-50",     lightBorder: "border-red-200",     textColor: "text-red-700" },
];

function ProgressBar({ statut }) {
  // statut est déjà normalisé ici
  const isRefuse = statut === "refuse";
  const step = isRefuse ? -1 : (STATUTS[statut]?.step ?? 1);

  return (
    <div className="flex items-center w-full mt-5 mb-1">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        // done = étapes complétées AVANT l'étape courante
        // step 1 = en_attente => aucun done
        // step 2 = en_cours   => i=0 (déposé) done
        // step 3 = valide     => i=0 et i=1 done, i=2 = active (dernier = vert plein)
        const done   = !isRefuse && step > i + 1;
        const active = !isRefuse && step === i + 1;
        // Pour "valide" (step=3), i=2 → step > i+1 = 3 > 3 = false, step === i+1 = 3===3 = true (active)
        // On veut que "valide" soit plein vert sur le dernier cercle aussi
        const isLastAndValide = !isRefuse && statut === "valide" && i === STEPS.length - 1;

        return (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 transition-all
                ${done || isLastAndValide
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : active && !isLastAndValide
                  ? "bg-white border-emerald-500 text-emerald-600 shadow-md shadow-emerald-200"
                  : isRefuse
                  ? "bg-red-100 border-red-300 text-red-400"
                  : "bg-slate-100 border-slate-200 text-slate-400"}`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wide ${
                done || active || isLastAndValide
                  ? "text-emerald-600"
                  : isRefuse
                  ? "text-red-400"
                  : "text-slate-400"
              }`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1.5 sm:mx-2 rounded-full mb-4 transition-all ${
                (done || (isLastAndValide && i < 2)) ? "bg-emerald-400" : "bg-slate-200"
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function DossierCard({ dossier }) {
  // Normalise le statut pour éviter les bugs de casse / valeurs inattendues
  const statutNorm = normaliserStatut(dossier.statut);
  const s    = STATUTS[statutNorm];
  const Icon = s.icon;

  const dateDepot  = dossier.dateDepot ? new Date(dossier.dateDepot).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : null;
  const dateUpdate = dossier.updatedAt ? new Date(dossier.updatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : null;

  return (
    <div className={`bg-white rounded-2xl border-2 ${s.border} shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg`}>
      <div className={`h-1 w-full ${s.bar}`} />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-800 text-sm leading-tight truncate">{dossier.typePret}</h3>
              {dossier.dossierRef && (
                <p className="text-slate-400 text-[10px] font-mono mt-0.5">Réf : {dossier.dossierRef}</p>
              )}
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-[10px] font-black border flex-shrink-0 ${s.bg} ${s.color} ${s.border}`}>
            {s.label}
          </span>
        </div>

        <ProgressBar statut={statutNorm} />

        <p className={`text-xs sm:text-sm mt-3 leading-relaxed font-medium ${s.color}`}>{s.desc}</p>

        {statutNorm === "refuse" && dossier.motifRefus && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ExclamationCircleIcon className="w-3.5 h-3.5 text-red-600" />
              <p className="text-[9px] font-black text-red-700 uppercase tracking-widest">Motif du refus</p>
            </div>
            <p className="text-xs text-red-800 leading-relaxed">{dossier.motifRefus}</p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-400">
          {dateDepot  && <div className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /><span>Déposé le <strong className="text-slate-600">{dateDepot}</strong></span></div>}
          {dateUpdate && <div className="flex items-center gap-1"><ArrowPathIcon className="w-3 h-3" /><span>Mis à jour le <strong className="text-slate-600">{dateUpdate}</strong></span></div>}
        </div>
      </div>
    </div>
  );
}

export default function MesDossiers() {
  const [dossiers, setDossiers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("tous");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/statut-dossiers/mes-dossiers");
      setDossiers(Array.isArray(data) ? data : []);
    } catch {
      setDossiers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Compte avec statut normalisé
  const counts = {
    tous:       dossiers.length,
    en_attente: dossiers.filter((d) => normaliserStatut(d.statut) === "en_attente").length,
    en_cours:   dossiers.filter((d) => normaliserStatut(d.statut) === "en_cours").length,
    valide:     dossiers.filter((d) => normaliserStatut(d.statut) === "valide").length,
    refuse:     dossiers.filter((d) => normaliserStatut(d.statut) === "refuse").length,
  };

  const filtered = filter === "tous"
    ? dossiers
    : dossiers.filter((d) => normaliserStatut(d.statut) === filter);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-5 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-[0.15em] mb-3 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Suivi en temps réel
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-1.5 tracking-tight">
          Mes{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Dossiers</span>
        </h2>
        <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
          Consultez l'état de vos dossiers et suivez leur avancement en temps réel.
        </p>
      </div>

      {/* Filtres — chips scrollables sur mobile, grille sur desktop */}
      <div className="mb-5 sm:mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 sm:hidden snap-x snap-mandatory scrollbar-hide">
          {FILTRES.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`snap-start flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                filter === f.key
                  ? `bg-gradient-to-br ${f.color} text-white border-transparent shadow-md`
                  : `bg-white ${f.lightBorder} ${f.textColor}`
              }`}
            >
              <span className="font-black">{counts[f.key]}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        <div className="hidden sm:grid sm:grid-cols-5 gap-3">
          {FILTRES.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-2xl p-4 text-left border-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                filter === f.key
                  ? `bg-gradient-to-br ${f.color} text-white border-transparent shadow-lg`
                  : `bg-white ${f.lightBg} ${f.lightBorder}`
              }`}
            >
              <div className={`text-2xl font-black ${filter === f.key ? "text-white" : "text-slate-800"}`}>
                {counts[f.key]}
              </div>
              <div className={`text-[10px] font-bold uppercase tracking-wide mt-1 ${filter === f.key ? "text-white/80" : "text-slate-400"}`}>
                {f.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-medium">Chargement de vos dossiers...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm text-center py-20">
          <DocumentTextIcon className="w-14 h-14 mx-auto mb-4 text-slate-200" />
          <p className="text-slate-500 font-bold text-sm">
            Aucun dossier {filter !== "tous" ? `"${STATUTS[filter]?.label}"` : "enregistré"}
          </p>
          <p className="text-slate-300 text-xs mt-1">Vos dossiers de prêt apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {filtered.map((d) => <DossierCard key={d.id} dossier={d} />)}
        </div>
      )}
    </div>
  );
}