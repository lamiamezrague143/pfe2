"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ChartBarIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon,
  BuildingStorefrontIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import LogoutButton from "../LogoutButton";
import { UserCircleIcon } from "@heroicons/react/24/outline";
function getNomFromToken() {
  try {
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      document.cookie.match(/token=([^;]+)/)?.[1];
    if (!token) return "Président";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.nomComplet || payload.nom || payload.name || "Président";
  } catch {
    return "Président";
  }
}

const NAV_GROUPS = [
  {
    group: "Principal",
    items: [
      { icon: HomeIcon,     label: "Acceuil", href: "/president" },
        { icon: ClipboardDocumentListIcon,     label: "Archive", href: "/president/pv" },
      
      { icon: ChartBarIcon, label: "Tableau Stats",   href: "/president/tableauDeBord" },
    ],
  },
  {
    group: "Prise en charge",
    items: [
      { icon: FolderIcon,                label: "Dossiers",         href: "/priseEnCharge/priseencharge" },
      { icon: PencilSquareIcon,          label: "Ajout Enseignant", href: "/priseEnCharge/AjoutEns" },
      { icon: BuildingStorefrontIcon,    label: "Ajout Établ.",     href: "/priseEnCharge/AjoutEtab" },
      { icon: ChatBubbleLeftRightIcon,   label: "Messages",         href: "/priseEnCharge/message" },
      { icon: ClipboardDocumentListIcon, label: "Notes",            href: "/priseEnCharge/note" },
    ],
  },
  {
    group: "Administration",
    items: [
      { icon: BuildingOfficeIcon,        label: "Cellule Info",    href: "/celluleInfo" },
      { icon: DocumentTextIcon,          label: "Secrétariat",     href: "/secretariat" },
      { icon: UsersIcon,                 label: "Comptes Util.",   href: "/secretariat/compteUtilisateur" },
      { icon: ClipboardDocumentListIcon, label: "Registre",        href: "/secretariat/registreGeneral" },
      { icon: AcademicCapIcon,           label: "Statut Dossiers", href: "/secretariat/statutDossiers" },
    ],
  },
  {
    group: "Paramètres",
    items: [
      { icon: Cog6ToothIcon,  label: "Paramètres",        href: "/president/Parametre" },
       { icon: Cog6ToothIcon,  label: "Prix Clinique",        href: "/president/Parametre/PrixClinique" },


{ icon: UserCircleIcon, label: "Profil", href: "/profile" }    ],
  },
];

function NavItem({ icon: Icon, label, href, active }) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
        active
          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
      }`}
    >
      <Icon
        className={`w-5 h-5 shrink-0 transition-all ${
          active ? "text-white" : "text-slate-400 group-hover:text-emerald-600"
        }`}
      />
      <span className="flex-1 truncate">{label}</span>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
    </Link>
  );
}

export default function PresidentSidebar() {
  const pathname = usePathname();
  const [nom, setNom] = useState("Président");

  useEffect(() => {
    setNom(getNomFromToken());
  }, []);

  return (
    <aside
      className="relative bg-white shadow-2xl shadow-slate-200 w-64 flex flex-col min-h-screen"
      style={{ borderRight: "1px solid rgba(0,0,0,0.05)" }}
    >
      {/* ── Logo / Brand ── */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl blur-md opacity-60" />
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <ShieldCheckIcon className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <h2 className="font-black text-slate-800 text-sm tracking-tight">SG/COS</h2>
          <p className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">
            Espace Président
          </p>
        </div>
      </div>

      {/* ── Profil ── */}
      <div className="mx-4 mt-5 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-bold">{nom?.[0] || "P"}</span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-700 truncate">{nom}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <ShieldCheckIcon className="w-3 h-3 text-emerald-600" />
            <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">
              Président
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.group}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  {...item}
                  active={
                    pathname === item.href ||
                    (item.href !== "/president" && pathname?.startsWith(item.href))
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Déconnexion ── */}
      <div className="p-3 border-t border-slate-100">
        <LogoutButton />
      </div>
    </aside>
  );
}