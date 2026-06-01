"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import ProtectedRoutes from "../../components/ProtectedRoutes";
import ClientSidebar from "../../components/sidebars/Clientsidebar";
import {
  HomeIcon,
  DocumentTextIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  CalendarIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const BOTTOM_NAV = [
  { icon: HomeIcon,                label: "Accueil",    href: "/client" },
  { icon: DocumentTextIcon,        label: "Demandes",   href: "/client/demande" },
  { icon: ClockIcon,               label: "Dossiers",   href: "/client/monDossiers" },
  { icon: ChatBubbleLeftRightIcon, label: "Messages",   href: "/client/chat" },
  { icon: UserCircleIcon,          label: "Profil",     href: "/client/profil" },
];

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ProtectedRoutes roles={["beneficiaire", "president"]}>
      <div
        className="flex min-h-screen"
        style={{ background: "linear-gradient(135deg,#f0fdf4 0%,#f8f9fc 60%,#eff6ff 100%)" }}
      >
        <style jsx global>{`
          body { background: linear-gradient(135deg,#f0fdf4 0%,#f8f9fc 60%,#eff6ff 100%); }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        {/* ══ SIDEBAR DESKTOP ══ */}
        <div className="hidden md:block flex-shrink-0">
          <ClientSidebar />
        </div>

        {/* ══ OVERLAY MOBILE ══ */}
        {mobileOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* ══ DRAWER MOBILE ══ */}
        <div
          className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
          <ClientSidebar />
        </div>

        {/* ══ MAIN ══ */}
        <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">

          {/* Topbar */}
          <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 sm:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo visible uniquement sur mobile quand drawer fermé */}
                <div className="flex md:hidden items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow">
                    <ShieldCheckIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-black text-slate-800 text-sm">SG/COS</span>
                </div>
                <button
                  className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition text-slate-500"
                  onClick={() => setMobileOpen(true)}
                >
                  <Bars3Icon className="w-5 h-5" />
                </button>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
                  <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
                    Espace Bénéficiaire
                  </span>
                </div>
                <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>
                    {new Date().toLocaleDateString("fr-FR", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="relative p-2 rounded-full hover:bg-slate-100 transition">
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                  <BellIcon className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
          </nav>

          {/* Contenu */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </div>

          {/* Footer desktop */}
          <footer className="hidden md:block mt-auto border-t border-slate-100 py-6 bg-white">
            <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-400 text-[10px] tracking-widest uppercase font-medium">
                © 2026 SG/COS-UMMTO • Université Mouloud Mammeri Tizi-Ouzou
              </p>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
            </div>
          </footer>
        </main>

        {/* ══ BOTTOM NAV MOBILE ══ */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl flex items-stretch safe-area-inset-bottom">
          {BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/client" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-all ${
                  active ? "text-emerald-600" : "text-slate-400 active:text-slate-600"
                }`}
              >
                <div className={`p-1 rounded-lg transition-all ${active ? "bg-emerald-50" : ""}`}>
                  <Icon className={`w-5 h-5 transition-all ${active ? "scale-110" : ""}`} />
                </div>
                <span className={`text-[9px] font-bold ${active ? "text-emerald-600" : "text-slate-400"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </ProtectedRoutes>
  );
}