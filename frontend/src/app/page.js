"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheckIcon, 
  BanknotesIcon, 
  ClipboardDocumentCheckIcon, 
  UserGroupIcon, 
  CpuChipIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  UserCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const ADMIN_SERVICES = [
  {
    title: "Présidence",
    desc: "Validation des décisions stratégiques et signatures officielles.",
    icon: ShieldCheckIcon,
    href: "/president",
    color: "bg-blue-50 text-blue-600 group-hover:bg-blue-600",
    border: "group-hover:border-blue-200"
  },
  {
    title: "Comptabilité",
    desc: "Gestion budgétaire, paiements et bilans financiers.",
    icon: BanknotesIcon,
    href: "/comptabilite",
    color: "bg-amber-50 text-amber-600 group-hover:bg-amber-600",
    border: "group-hover:border-amber-200"
  },
  {
    title: "Prise En Charge",
    desc: "Gestion des formulaires médicaux et conventions.",
    icon: ClipboardDocumentCheckIcon,
    href: "/priseEnCharge/priseencharge",
    color: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600",
    border: "group-hover:border-emerald-200"
  },
  {
    title: "Secrétariat",
    desc: "Accueil, courrier et archivage administratif.",
    icon: UserGroupIcon,
    href: "/secretariat",
    color: "bg-purple-50 text-purple-600 group-hover:bg-purple-600",
    border: "group-hover:border-purple-200"
  },
  {
    title: "Cellule Info",
    desc: "Support technique et gestion de la base de données.",
    icon: CpuChipIcon,
    href: "/celluleInfo",
    color: "bg-slate-100 text-slate-600 group-hover:bg-slate-600",
    border: "group-hover:border-slate-300"
  }
];

const CLIENT_SERVICE = {
  title: "Demande de prise en charge",
  desc: "Soumettez et suivez vos demandes de prise en charge médicale.",
  icon: SparklesIcon,
  href: "/client",
  color: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600",
  border: "group-hover:border-emerald-200"
};

// ─── Composant Carte Module (Utilisé après sélection) ──────────────────────────
const ServiceCard = ({ title, desc, icon: Icon, href, color, border }) => (
  <Link
    href={href}
    className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col h-full ${border}`}
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${color} group-hover:text-white`}>
      <Icon className="w-5 h-5" />
    </div>
    <h3 className="text-sm font-bold mb-1 text-gray-900">{title}</h3>
    <p className="text-gray-500 text-[11px] leading-relaxed flex-grow">{desc}</p>
    <div className="mt-3 flex items-center text-[9px] font-bold uppercase tracking-widest text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
      Lancer <ArrowRightIcon className="ml-1 w-3 h-3" />
    </div>
  </Link>
);

// ─── Bloc Administration (Design Créatif) ───────────────────────────────
const AdminBlock = ({ onClick }) => (
  <div
    onClick={onClick}
    className="group relative overflow-hidden rounded-3xl p-8 transition-all cursor-pointer min-h-[320px] flex flex-col justify-between border border-gray-100 bg-white shadow-xl shadow-gray-100 hover:shadow-blue-100 hover:-translate-y-2"
  >
    {/* Dégradé de fond discret au hover */}
    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl"></div>
    
    <div className="relative z-10">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-8 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-500">
        <BuildingOfficeIcon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Administration</h3>
      <p className="text-slate-500 text-sm leading-relaxed max-w-[240px]">
        Outils de pilotage, gestion budgétaire et supervision du comité.
      </p>
    </div>

    <div className="relative z-10 flex items-center justify-between">
      <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
        Espace Gestionnaire
      </span>
      <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all">
        <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
      </div>
    </div>
  </div>
);

// ─── Bloc Espace Client (Design Créatif) ────────────────────────────────
const ClientBlock = ({ onClick }) => (
  <div
    onClick={onClick}
    className="group relative overflow-hidden rounded-3xl p-8 transition-all cursor-pointer min-h-[320px] flex flex-col justify-between border border-gray-100 bg-white shadow-xl shadow-gray-100 hover:shadow-emerald-100 hover:-translate-y-2"
  >
    {/* Dégradé de fond discret au hover */}
    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl"></div>

    <div className="relative z-10">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mb-8 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform duration-500">
        <UserCircleIcon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Espace Client</h3>
      <p className="text-slate-500 text-sm leading-relaxed max-w-[240px]">
        Suivi de vos remboursements et nouvelles demandes de prise en charge.
      </p>
    </div>

    <div className="relative z-10 flex items-center justify-between">
      <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
        Espace Adhérent
      </span>
      <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:border-emerald-600 transition-all">
        <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
      </div>
    </div>
  </div>
);

export default function HomePage() {
  const [selectedSpace, setSelectedSpace] = useState('home');

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans text-slate-900">
      {/* SIDEBAR PLACEHOLDER (ml-16) */}
      <main className="flex-1 ml-16 flex flex-col min-w-0 bg-white">
        
        {/* NAVBAR */}
        <nav className="flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
          <button onClick={() => setSelectedSpace('home')} className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg">
                <img src="/Image2.png" alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <div className="text-left">
              <h1 className="text-md font-black text-slate-800 leading-none">SG/COS-UMMTO</h1>
              <p className="text-[7px] text-slate-400 uppercase tracking-[0.3em] font-bold">Digital Platform 2026</p>
            </div>
          </button>

          <div className="flex items-center gap-6">
            <Link href="/login" className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-slate-200">
              About Us
            </Link>
          </div>
        </nav>

        {/* HERO SECTION DYNAMIQUE */}
        <header className="relative px-8 pt-16 pb-12 overflow-hidden bg-white">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-[0.2em] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Portail Universitaire
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
              {selectedSpace === 'home' && <>Bienvenue sur votre 

 <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600"> Espace Travail</span></>}
              {selectedSpace === 'admin' && <>Pôle <span className="text-blue-600">Administratif</span></>}
              {selectedSpace === 'client' && <> Votre Espace <span className="text-emerald-600">Adhérent</span></>}
            </h2>
            <p className="text-slate-500 text-base md:text-lg max-w-2xl leading-relaxed">
              {selectedSpace === 'home' && "Sélectionnez votre pôle d'activité pour accéder aux outils de gestion."}
              {selectedSpace === 'admin' && "Accès sécurisé aux outils de décision et de suivi financier."}
              {selectedSpace === 'client' && "Consultez vos droits et effectuez vos demandes en quelques clics."}
            </p>
          </div>
        </header>

        {/* CONTENU PRINCIPAL */}
        <section className="px-8 pb-20">
          <div className="max-w-6xl mx-auto">
            
            {selectedSpace === 'home' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <AdminBlock onClick={() => setSelectedSpace('admin')} />
                <ClientBlock onClick={() => setSelectedSpace('client')} />
              </div>
            )}

            {selectedSpace === 'admin' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button onClick={() => setSelectedSpace('home')} className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
                  <ArrowRightIcon className="w-4 h-4 rotate-180" /> Retour
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ADMIN_SERVICES.map((s, i) => <ServiceCard key={i} {...s} />)}
                </div>
              </div>
            )}

            {selectedSpace === 'client' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button onClick={() => setSelectedSpace('home')} className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors">
                  <ArrowRightIcon className="w-4 h-4 rotate-180" /> Retour
                </button>
                <div className="max-w-md">
                  <ServiceCard {...CLIENT_SERVICE} />
                </div>
              </div>
            )}

          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-auto border-t border-slate-100 py-10 bg-slate-50/50">
          <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-[10px] tracking-widest uppercase font-bold">
              © 2026 SG/COS-UMMTO • Tizi-Ouzou
            </p>
            <div className="flex gap-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}