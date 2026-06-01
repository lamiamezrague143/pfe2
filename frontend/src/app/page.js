"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5001/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.message || "Échec de la connexion. Veuillez vérifier vos identifiants."); 
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Stockage du cookie avant la redirection pour le middleware
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

      const routes = {
        president: "/president",
        secretariat: "/secretariat",
        comptable: "/comptable",
        agent: "/priseEnCharge",
        ingenieur: "/celluleInfo",
        beneficiaire: "/client",
      };

      const destination = data.user.firstLogin
        ? "/change-password"
        : (routes[data.user.role] || "/");

      // Force un rechargement complet pour que le middleware lise immédiatement le cookie
      window.location.href = destination;

    } catch (err) {
      alert("Erreur serveur. Veuillez réessayer plus tard.");
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bon matin";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      {/* Container Principal */}
      <div className="flex w-full max-w-[1000px] min-h-[620px] bg-white rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/80 border border-slate-100">
        
        {/* PANNEAU GAUCHE - Effet Visuel Liquide */}
        <div className="hidden md:flex relative w-[42%] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 p-8">
          {/* Formes floues d'ambiance */}
          <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[70%] bg-white/10 rounded-[100%] blur-3xl transform rotate-12"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[50%] bg-emerald-900/20 rounded-[100%] blur-2xl"></div>

          {/* Sphères flottantes effet verre liquide */}
          <div className="absolute top-1/4 left-1/3 w-24 h-24 bg-gradient-to-tr from-white/20 to-white/5 rounded-full blur-[1px] backdrop-blur-sm shadow-xl border border-white/10"></div>
          <div className="absolute bottom-1/4 right-1/4 w-36 h-36 bg-gradient-to-br from-emerald-400/30 to-emerald-600/10 rounded-full blur-[2px] shadow-2xl"></div>

          <div className="relative z-10 text-center">
            <h2 className="text-white font-extrabold text-4xl mb-3 tracking-tight">Ravi de vous revoir</h2>
            <p className="text-emerald-100/80 text-sm font-light tracking-wide max-w-[220px] mx-auto">
              Accédez à votre espace et gérez vos activités en toute simplicité.
            </p>
          </div>

          <div className="absolute bottom-8 z-10">
            <p className="text-white/40 text-[10px] tracking-[0.25em] uppercase font-bold">
              sg-cos.ummto.dz
            </p>
          </div>
        </div>

        {/* PANNEAU DROIT - Formulaire Épuré */}
        <div className="flex-1 flex flex-col justify-center px-10 sm:px-16 md:px-20 py-12 relative bg-white">
          
          <div className="mb-10">
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Bonjour !</p>
            <p className="text-emerald-600 font-bold text-xl mb-6">{getGreeting()}</p>
            <h3 className="text-slate-800 font-extrabold text-3xl tracking-tight">
              Connectez-vous à votre <span className="text-emerald-500">Compte</span>
            </h3>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Champ Email */}
            <div className="relative group">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1 group-focus-within:text-emerald-600 transition-colors">
                Adresse Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom.prenom@ummto.dz"
                required
                className="w-full border-b-2 border-slate-100 focus:border-emerald-500 outline-none py-2.5 text-sm text-slate-700 bg-transparent transition-all placeholder:text-slate-300"
              />
            </div>

            {/* Champ Mot de passe */}
            <div className="relative group">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1 group-focus-within:text-emerald-600 transition-colors">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border-b-2 border-slate-100 focus:border-emerald-500 outline-none py-2.5 pr-10 text-sm text-slate-700 bg-transparent transition-all placeholder:text-slate-300"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Options Additionnelles */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none font-medium hover:text-slate-500 transition-colors">
                <input 
                  type="checkbox" 
                  checked={remember} 
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-500 accent-emerald-500 cursor-pointer" 
                />
                Se souvenir de moi
              </label>
              <button type="button" className="text-xs text-slate-400 font-medium hover:text-emerald-600 transition-colors">
                Mot de passe oublié ?
              </button>
            </div>

            {/* Bouton de Soumission */}
            <div className="pt-4">
              <button 
                type="submit"
                className="w-full py-4 rounded-xl text-white text-xs font-bold tracking-[0.2em] uppercase shadow-lg shadow-emerald-600/20 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                Se connecter
              </button>
            </div>
          </form>

          
        </div>
      </div>
    </div>
  );
}