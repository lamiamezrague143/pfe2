"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  HomeIcon,
  ChartBarIcon,
  FolderIcon,
  BellIcon,
  CalendarIcon,
  UserGroupIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { apiFetch } from "../../../lib/api";

const MenuItem = ({ icon: Icon, label, href, active, badge }) => (
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
    {badge && (
      <span className={`text-xs px-2 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-emerald-100 text-emerald-600"}`}>
        {badge}
      </span>
    )}
    {active && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
  </Link>
);

/* ─── Impression du bon de mot de passe ─── */
const printPasswordSlip = (user) => {
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Bon d'accès – ${user.prenomComplet + " " + user.nomComplet}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Inter', sans-serif;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
        }

        .slip {
          background: white;
          width: 420px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.12);
        }

        /* En-tête */
        .header {
          background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
          padding: 24px 28px 20px;
          color: white;
        }
        .header-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .logo-box {
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 900;
          flex-shrink: 0;
        }
        .org-name { font-size: 13px; font-weight: 700; }
        .org-sub  { font-size: 10px; opacity: 0.75; margin-top: 2px; letter-spacing: 0.08em; text-transform: uppercase; }

        .title-row { display: flex; align-items: center; gap: 8px; }
        .title-icon {
          width: 28px; height: 28px;
          background: rgba(255,255,255,0.15);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
        }
        .title-text { font-size: 16px; font-weight: 900; }
        .title-sub  { font-size: 10px; opacity: 0.75; margin-top: 2px; }

        /* Corps */
        .body { padding: 24px 28px; }

        /* Bloc utilisateur */
        .user-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: linear-gradient(135deg, #ecfdf5, #f0fdfa);
          border: 1px solid #a7f3d0;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 20px;
        }
        .avatar {
          width: 44px; height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #059669, #0d9488);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 18px; font-weight: 900;
          flex-shrink: 0;
        }
        .user-name  { font-size: 15px; font-weight: 800; color: #1e293b; }
        .user-role  {
          display: inline-block;
          margin-top: 4px;
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          background: #d1fae5; color: #065f46;
          padding: 2px 8px; border-radius: 20px;
        }

        /* Ligne séparatrice */
        .divider {
          border: none;
          border-top: 1px dashed #e2e8f0;
          margin: 0 0 20px;
        }

        /* Bloc mot de passe */
        .pwd-label {
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: #64748b;
          margin-bottom: 8px;
        }
        .pwd-box {
          background: #1e293b;
          border-radius: 10px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .pwd-value {
          font-family: 'Courier New', monospace;
          font-size: 20px;
          font-weight: 700;
          color: #34d399;
          letter-spacing: 0.15em;
        }
        .pwd-badge {
          background: rgba(52,211,153,0.15);
          color: #34d399;
          font-size: 9px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* Infos */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }
        .info-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
        }
        .info-lbl { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 3px; }
        .info-val { font-size: 12px; font-weight: 700; color: #334155; }

        /* Message d'avertissement */
        .warning {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .warning-icon { font-size: 16px; flex-shrink: 0; }
        .warning-text { font-size: 11px; color: #92400e; line-height: 1.5; }
        .warning-text strong { font-weight: 700; }

        /* Pied */
        .footer {
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          padding: 14px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .footer-left { font-size: 10px; color: #94a3b8; }
        .footer-right {
          font-size: 10px; font-weight: 700;
          color: #059669;
          background: #ecfdf5;
          padding: 3px 10px;
          border-radius: 20px;
        }

        @media print {
          body { background: white; padding: 0; }
          .slip { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="slip">

        <div class="header">
          <div class="header-top">
            <div class="logo-box">S</div>
            <div>
              <div class="org-name">SG/COS – UMMTO</div>
              <div class="org-sub">Université Mouloud Mammeri · Tizi-Ouzou</div>
            </div>
          </div>
          <div class="title-row">
            <div class="title-icon">🔐</div>
            <div>
              <div class="title-text">Bon d'accès au système</div>
              <div class="title-sub">Remis en main propre – document confidentiel</div>
            </div>
          </div>
        </div>

        <div class="body">

          <div class="user-card">
            <div class="avatar">${(user.prenomComplet + " " + user.nomComplet|| "?").charAt(0).toUpperCase()}</div>
            <div>
              <div class="user-name">${user.prenomComplet + " " + user.nomComplet || "—"}</div>
              <span class="user-role">${user.roleSystem || "Utilisateur"}</span>
            </div>
          </div>

          <hr class="divider" />

          <div class="pwd-label">🔑 &nbsp;Mot de passe provisoire</div>
          <div class="pwd-box">
            <div class="pwd-value">${user.generatedPassword}</div>
            <div class="pwd-badge">Provisoire</div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-lbl">📧 Identifiant</div>
              <div class="info-val">${user.email || "—"}</div>
            </div>
            <div class="info-item">
              <div class="info-lbl">📅 Date de remise</div>
              <div class="info-val">${date}</div>
            </div>
          </div>

          <div class="warning">
            <div class="warning-icon">⚠️</div>
            <div class="warning-text">
              <strong>Important :</strong> Ce mot de passe est <strong>provisoire</strong>.
              Veuillez le modifier dès votre première connexion.<br/>
              Ne le communiquez à <strong>personne</strong> et conservez ce document en lieu sûr.
            </div>
          </div>

        </div>

        <div class="footer">
          <div class="footer-left">SG/COS · Secrétariat Général © 2026</div>
          <div class="footer-right">✅ Document officiel</div>
        </div>

      </div>

      <script>window.onload = () => { window.print(); }</script>
    </body>
    </html>
  `;

  const win = window.open("", "_blank", "width=520,height=720");
  win.document.write(html);
  win.document.close();
};

export default function UsersPasswords() {
  const [users, setUsers] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState("");
const [visibleId, setVisibleId] = useState(null);
  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    const data = await apiFetch("/users/all");
    if (data) setUsers(Array.isArray(data) ? data : []);
  };

  const copyPassword = (id, password) => {
    navigator.clipboard.writeText(password);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

const resetPassword = async (id, nom) => {
  if (!confirm(`Réinitialiser le mot de passe de ${nom} ?`)) return;
  const data = await apiFetch(`/users/reset-password/${id}`, { method: "POST" });
  if (data?.generatedPassword) {
    // Met à jour localement sans recharger toute la liste
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, generatedPassword: data.generatedPassword } : u
    ));
  }
};


  const filtered = users.filter(u =>
    (u.prenomComplet + " " + u.nomComplet || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const avecMotDePasse = users.filter(u => u.generatedPassword).length;

  return (
    <div  style={{ background: "linear-gradient(135deg,#f5f7fa 0%,#f8f9fc 100%)" }}>



      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* NAVBAR */}
        <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Secrétariat / COS</span>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>{new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></div>
                <BellIcon className="w-5 h-5 text-slate-500" />
              </button>
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-700">Secrétariat COS</p>
                  <p className="text-[9px] text-slate-400">secretariat@sgcos.com</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">SC</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <header className="relative px-8 pt-10 pb-6 overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-transparent"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500 rounded-full blur-[100px] opacity-10"></div>
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-[0.2em] mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              Gestion des comptes
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
              Comptes <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Utilisateurs</span>
            </h2>
            <p className="text-slate-500 text-sm">Consultez et copiez les mots de passe générés pour les bénéficiaires.</p>
          </div>
        </header>

        {/* CONTENT */}
        <section className="px-8 pb-16">
          <div className="max-w-6xl mx-auto">

            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {[
                { num: users.length,                  label: "Total utilisateurs",       icon: "👥", color: "from-emerald-500 to-teal-600",   bg: "bg-emerald-50" },
                { num: avecMotDePasse,                 label: "Avec mot de passe généré", icon: "🔑", color: "from-amber-500 to-orange-500",   bg: "bg-amber-50" },
                { num: users.length - avecMotDePasse, label: "Sans mot de passe",        icon: "🔒", color: "from-slate-500 to-slate-700",    bg: "bg-slate-100" },
              ].map((s) => (
                <div key={s.label} className="group relative overflow-hidden rounded-2xl p-6 bg-white shadow-xl shadow-slate-100 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${s.color} rounded-full blur-2xl opacity-0 group-hover:opacity-15 transition-opacity duration-500`}></div>
                  <div className="relative z-10 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}>
                      <span className="text-2xl">{s.icon}</span>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-slate-800">{s.num}</div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">{s.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-black text-slate-700 text-sm uppercase tracking-wider">Liste des comptes</h3>
                </div>
                <div className="relative max-w-xs w-full">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-4 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <tr>
                      {["Utilisateur", "Email", "Rôle", "Mot de passe", "Actions"].map(h => (
                        <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-16 text-slate-400">
                          <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                          <span className="text-sm">Aucun utilisateur trouvé</span>
                        </td>
                      </tr>
                    ) : filtered.map((u) => (
                      <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                              <span className="text-emerald-600 text-xs font-black">
                                {(u.prenomComplet + " " + u.nomComplet || "?").charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-bold text-slate-800">{u.prenomComplet + " " + u.nomComplet}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                            {u.roleSystem}
                          </span>
                        </td>

                     
{/* Colonne Mot de passe */}
{/* Colonne Mot de passe */}
<td className="px-6 py-4">
  {u.hasPassword ? (
    <span className="flex items-center gap-2">
      <code className="bg-slate-900 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-widest">
        ••••••••
      </code>
      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
        Défini
      </span>
    </span>
  ) : (
    <span className="text-xs text-slate-300 italic">Non généré</span>
  )}
</td>
                        {/* Colonne Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {/* Réinitialiser */}
                            <button
                              onClick={() => resetPassword(u.id, u.prenomComplet + " " + u.nomComplet)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-500 hover:text-white transition-all"
                            >
                              🔄 Réinitialiser
                            </button>

                            {/* Imprimer le bon – uniquement si mot de passe disponible */}
                            {u.generatedPassword && (
                              <button
                                onClick={() => printPasswordSlip(u)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all"
                                title="Imprimer le bon d'accès"
                              >
                                <PrinterIcon className="w-3.5 h-3.5" />
                                Imprimer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-auto border-t border-slate-100 py-6 bg-white">
          <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-[10px] tracking-widest uppercase font-medium">
              © 2026 SG/COS-UMMTO • Université Mouloud Mammeri Tizi-Ouzou
            </p>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}