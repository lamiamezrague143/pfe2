"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ChartBarIcon,
  FolderIcon,
  UserGroupIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/outline";
import LogoutButton from "../LogoutButton";
import { UserCircleIcon } from "@heroicons/react/24/outline";
const menuItems = [
  { icon: HomeIcon, label: "Accueil", href: "/secretariat" },
  { icon: DocumentCheckIcon, label: "Prestations", href: "/secretariat/prestation" },
  { icon: ChartBarIcon, label: "Registre General", href: "/secretariat/registreGeneral" },
  { icon: UserGroupIcon, label: "Compte Utilisateur", href: "/secretariat/compteUtilisateur" },
  { icon: DocumentCheckIcon, label: "Statut Dossiers", href: "/secretariat/statutDossiers" },

  { icon: UserCircleIcon, label: "Profil", href: "/profile" },
];

const MenuItem = ({ icon: Icon, label, href, active }) => (
  <Link
    href={href}
    className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
      active
        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
        : "text-slate-600 hover:bg-slate-100"
    }`}
  >
    <Icon className={`w-5 h-5 transition-all ${active ? "text-white" : "text-slate-400 group-hover:text-emerald-600"}`} />
    <span className="flex-1">{label}</span>
    {active && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
  </Link>
);

export default function SecretariatSidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative bg-white shadow-2xl shadow-slate-200 w-64 flex flex-col min-h-screen"
      style={{ borderRight: "1px solid rgba(0,0,0,0.05)" }}>

      {/* Logo */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl blur-md opacity-60"></div>
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">S</span>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="font-black text-slate-800 text-sm tracking-tight">SG/COS</h2>
          <p className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">Gestion Intégrée</p>
        </div>
      </div>

      {/* User info */}
      <div className="mx-4 mt-6 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">SC</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-700">Secrétariat COS</p>
            <p className="text-[9px] text-slate-500">Gestionnaire</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        {menuItems.map((item, idx) => (
          <MenuItem
            key={idx}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}
      </nav>

      <LogoutButton />
    </aside>
  );
}