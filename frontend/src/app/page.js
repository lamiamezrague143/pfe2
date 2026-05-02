"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheckIcon, 
  BanknotesIcon, 
  ClipboardDocumentCheckIcon, 
  UserGroupIcon, 
  CpuChipIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';

const SERVICES = [
  {
    title: "Présidence",
    desc: "Validation des décisions stratégiques et signatures officielles du comité.",
    icon: ShieldCheckIcon,
    href: "/president",
    color: "bg-blue-50 text-blue-600 group-hover:bg-blue-600",
    border: "group-hover:border-blue-200"
  },
  {
    title: "Comptabilité",
    desc: "Gestion budgétaire, paiements des prestataires et bilans financiers.",
    icon: BanknotesIcon,
    href: "/comptabilite",
    color: "bg-amber-50 text-amber-600 group-hover:bg-amber-600",
    border: "group-hover:border-amber-200"
  },
  {
    title: "agent",
    desc: "Gestion des formulaires médicaux, cliniques et laboratoires conventionnés.",
    icon: ClipboardDocumentCheckIcon,
    href:"/priseEnCharge/priseencharge",
    color: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600",
    border: "group-hover:border-emerald-200"
  },
  {
    title: "Secrétariat",
    desc: "Accueil des adhérents, gestion du courrier et archivage administratif.",
    icon: UserGroupIcon,
    href: "/secretariat/avenantMedical",
    color: "bg-purple-50 text-purple-600 group-hover:bg-purple-600",
    border: "group-hover:border-purple-200"
  },
  {
    title: "Cellule Info",
    desc: "Support technique, maintenance du portail et gestion de la base de données.",
    icon: CpuChipIcon,
    href: "/celluleInfo",
    color: "bg-slate-100 text-slate-600 group-hover:bg-slate-600",
    border: "group-hover:border-slate-300"
  },
  {
    title: "Demande",
    desc: "Demande des prises en charge.",
    icon: CpuChipIcon,
    href: "/client",
    color: "bg-slate-100 text-slate-600 group-hover:bg-slate-600",
    border: "group-hover:border-slate-300"
  },
];

const ServiceCard = ({ title, desc, icon: Icon, href, color, border }) => (
  <Link href={href} className={`bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col h-full ${border}`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 ${color} group-hover:text-white`}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-lg font-bold mb-2 text-gray-900 leading-tight">{title}</h3>
    <p className="text-gray-500 text-xs leading-relaxed flex-grow">{desc}</p>
    <div className="mt-4 flex items-center text-[10px] font-bold uppercase tracking-widest text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
      Ouvrir le module <ArrowRightIcon className="ml-2 w-3 h-3" />
    </div>
  </Link>
);

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-white font-sans text-gray-900">
      
      {/* Note : Si tu as une Sidebar, elle doit être placée ici. 
          Le 'ml-20' sur le <main> laisse de la place pour une sidebar rétractée.
      */}

      {/* Ajoute ml-16 ou ml-20 selon la largeur de ta sidebar */}
        <main className="flex-1 ml-16 flex flex-col min-w-0">
        
        {/* --- NAVBAR --- */}
        <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-gray-50 bg-white/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <img src="../../image2.png" alt="Logo sg" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-lg font-black text-emerald-900 leading-none uppercase">SG/COS-UMMTO</h1>
              <p className="text-[8px] text-gray-400 uppercase tracking-[0.2em] font-bold">Système de Gestion Intégré</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-6 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <a href="#" className="hover:text-emerald-600 transition-colors">Documentation</a>
              <a href="#" className="hover:text-emerald-600 transition-colors">Support</a>
            </div>
            <Link href="/login" className="bg-gray-900 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md">
              Déconnexion
            </Link>
          </div>
        </nav>

        {/* --- HERO SECTION --- */}
        <section className="relative px-6 py-12 lg:py-20 bg-gradient-to-b from-emerald-50/50 to-white overflow-hidden">
          <div className="max-w-7xl mx-auto text-center z-10 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-widest mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Session Administrateur Active
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Bienvenue sur votre <span className="text-emerald-600">Espace Travail</span>
            </h2>
            <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              Sélectionnez votre pôle d'activité pour accéder aux outils de gestion, 
              aux dossiers en attente et aux rapports statistiques.
            </p>
          </div>
        </section>

        {/* --- GRILLE DES PÔLES --- */}
        <section className="max-w-[1400px] mx-auto px-6 -mt-10 mb-16 relative z-20 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {SERVICES.map((service, index) => (
              <ServiceCard key={index} {...service} />
            ))}
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="mt-auto border-t border-gray-100 py-8 text-center">
          <p className="text-gray-400 text-[9px] tracking-[0.3em] uppercase font-medium">
            © 2026 Université Mouloud Mammeri Tizi-Ouzou • Plateforme SG/COS-Digitale
          </p>
        </footer>

      </main>
    </div>
  );
}