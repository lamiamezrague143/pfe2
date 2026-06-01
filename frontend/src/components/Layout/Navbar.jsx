"use client";

import {
  UserPlus, School, FileCheck, MessageSquare,
  FileText, Home, ChevronRight,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api"; // adapte le chemin
import LogoutButton from "../../components/LogoutButton";

const menu = [
  { name: "Prise en charge",    path: "/priseEnCharge/priseencharge", icon: FileCheck     },
  { name: "Ajout bénéficiaire", path: "/priseEnCharge/AjoutEns",      icon: UserPlus      },
  { name: "Établissement",      path: "/priseEnCharge/AjoutEtab",     icon: School        },
  { name: "Message",            path: "/priseEnCharge/message",       icon: MessageSquare },
  { name: "Note",               path: "/priseEnCharge/note",          icon: FileText      },
];

export default function Sidebar({ user: userProp }) {
  const pathname = usePathname();
  const router   = useRouter();

  // Si user vient des props mais est null/undefined, on essaie de le fetch localement
  const [user, setUser] = useState(userProp || null);

  useEffect(() => {
    if (userProp) { setUser(userProp); return; }
    // Fallback : charge depuis le token en localStorage
    const fetchUser = async () => {
      try {
        const data = await apiFetch("/users/me"); // ou ton endpoint profil
        if (data) setUser(data);
      } catch (e) { console.error("Sidebar: impossible de charger le profil", e); }
    };
    fetchUser();
  }, [userProp]);

  const initials = () => {
    const parts = [user?.nomComplet, user?.prenomComplet]
      .filter(Boolean).join(" ").trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts[0])          return parts[0][0].toUpperCase();
    return "?";
  };

  const fullName = user
    ? [user.nomComplet, user.prenomComplet].filter(Boolean).join(" ")
    : null;

  return (
    <aside
      className="relative bg-white shadow-2xl shadow-slate-200 flex flex-col w-64 min-h-screen"
      style={{ borderRight: "1px solid rgba(0,0,0,0.05)" }}
    >
      {/* ── BRAND ── */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl blur-md opacity-60" />
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Home size={18} color="#fff" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="font-black text-slate-800 text-sm tracking-tight">SG/COS</h2>
          <p className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">Gestion Intégrée</p>
        </div>
      </div>

      {/* ── PROFIL ── */}
      <div className="mx-4 mt-5 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            {user?.photo && user.photo !== "default.jpg" ? (
              <img
                src={`http://localhost:5001/uploads/${user.photo}`}
                alt="Profil"
                className="w-10 h-10 rounded-full object-cover shadow-md"
                style={{ border: "2px solid #10b981" }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-bold">{initials()}</span>
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            {/* ✅ ICI : affiche le nom ou un skeleton animé si pas encore chargé */}
            {fullName ? (
              <>
                <p className="text-xs font-black text-slate-700 truncate uppercase tracking-tight">
                  {fullName}
                </p>
                <p className="text-[9px] text-emerald-600 font-bold truncate mt-0.5">
                  {user?.roleSystem || user?.categorieRole || "Utilisateur"}
                </p>
              </>
            ) : (
              <div className="space-y-1.5">
                <div className="h-3 w-28 bg-slate-200 rounded animate-pulse" />
                <div className="h-2 w-16 bg-slate-100 rounded animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MENU ── */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-3">
          Navigation
        </p>
        {menu.map(({ name, path, icon: Icon }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              href={path}
              className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                active
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon
                size={18}
                className={`transition-all flex-shrink-0 ${
                  active ? "text-white" : "text-slate-400 group-hover:text-emerald-600"
                }`}
              />
              <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{name}</span>
              {active && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* ── FOOTER ── */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={() => router.push("/profile")}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-all duration-200"
        >
          {user?.photo && user.photo !== "default.jpg" ? (
            <img
              src={`http://localhost:5001/uploads/${user.photo}`}
              alt="Profil"
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              style={{ border: "1.5px solid #10b981" }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow">
              <span className="text-white text-xs font-bold">{initials()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            {fullName ? (
              <>
                <p className="text-xs font-semibold text-slate-700 truncate">{fullName}</p>
                <p className="text-[9px] text-slate-400 truncate">
                  {user?.roleSystem || user?.categorieRole || "Utilisateur"}
                </p>
              </>
            ) : (
              <div className="space-y-1">
                <div className="h-2.5 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-2 w-14 bg-slate-100 rounded animate-pulse" />
              </div>
            )}
          </div>
          <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
        </button>
      </div>

      {/* glow décoratif */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-16 h-24 bg-gradient-to-t from-emerald-500/5 to-transparent rounded-full blur-xl pointer-events-none" />
      <LogoutButton />
    </aside>
  );
}