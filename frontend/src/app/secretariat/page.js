"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  UserCircleIcon, 
  ArrowLeftOnRectangleIcon, 
  DocumentDuplicateIcon
} from "@heroicons/react/24/outline";

export default function WelcomePage() {
  const router = useRouter();
  // Configuré par défaut sur secretariat pour un affichage visuel immédiat
  const [user, setUser] = useState({ name: "Utilisateur", role: "secretariat" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Erreur de lecture du profil", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    window.location.href = "/";
  };

  const formatRole = (role) => {
    const roles = {
      president: "Président",
      secretariat: "Secrétariat SG / COS",
      comptable: "Comptable / Gestionnaire Financier",
      agent: "Agent de Prise en Charge",
      ingenieur: "Ingénieur d'État en Informatique",
      beneficiaire: "Bénéficiaire",
    };
    return roles[role] || "Utilisateur";
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col antialiased font-sans w-full overflow-hidden">
      
      {/* BARRE DE NAVIGATION SUPÉRIEURE */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-30 w-full h-16 flex items-center">
        <div className="w-full px-6 md:px-12 flex items-center justify-between">
          
          {/* Logo / Système */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-500/20">
              S
            </div>
            <div>
              <span className="font-extrabold text-slate-800 tracking-tight text-base block">SG-COS</span>
              <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block -mt-1">UMMTO</span>
            </div>
          </div>

          {/* Profil & Déconnexion */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50 py-1.5 pl-3 pr-4 rounded-full border border-slate-100">
              <UserCircleIcon className="w-6 h-6 text-emerald-600" />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-700 leading-none">{user.email || "secretariat.cos@ummto.dz"}</p>
                <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider mt-0.5">{formatRole(user.role)}</p>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-100 transition-all shadow-sm"
              title="Se déconnecter"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* CONTENU PRINCIPAL (100% de la hauteur restante sous la barre de navigation) */}
      <main className="h-[calc(100vh-64px)] w-full px-6 md:px-12 py-8 flex flex-col justify-start">
        
        {/* SECTION BANNIÈRE DE BIENVENUE SECRÉTARIAT */}
        <section className="relative w-full rounded-3xl overflow-hidden shadow-xl shadow-slate-200/80 border border-slate-100 bg-white flex flex-col md:flex-row items-center justify-between p-8 md:p-16 flex-1">
          
          {/* Arrière-plan graphique abstrait fluide */}
          <div className="absolute inset-y-0 right-0 w-full md:w-[45%] bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 hidden md:block" style={{ clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)" }}>
            <div className="absolute top-[-20%] right-[-10%] w-[120%] h-[80%] bg-white/10 rounded-[100%] blur-3xl transform rotate-12"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[80%] h-[60%] bg-emerald-900/20 rounded-[100%] blur-2xl"></div>
          </div>

          {/* Textes de bienvenue administratifs */}
          <div className="relative z-10 space-y-5 text-center md:text-left max-w-2xl">
            <span className="inline-block px-3 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full uppercase tracking-widest">
              Gestion Administrative
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">
              Bienvenue sur votre <br />
              <span className="text-emerald-500">Espace Secrétariat SG/COS</span>
            </h1>
            <p className="text-slate-500 text-base md:text-lg leading-relaxed font-light max-w-xl">
              Bonjour, vous êtes connecté avec succès. Cet espace centralise la réception, la numérisation et la vérification de conformité des dossiers de demandes, ainsi que la coordination des courriers internes de la Commission des Œuvres Sociales.
            </p>
          </div>

          {/* Décoration d'ambiance à droite (Icône Dossiers/Documents en verre flouté) */}
          <div className="hidden md:flex relative z-10 w-44 h-44 mr-12 items-center justify-center bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <DocumentDuplicateIcon className="w-24 h-24 text-white opacity-90" />
          </div>

        </section>

      </main>
    </div>
  );
}