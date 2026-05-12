"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Logique de connexion (inchangée mais intégrée)
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5001/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur d'authentification");
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      router.push(data.user.firstLogin ? "/change-password" : `/${data.user.role}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f7f6] relative font-sans antialiased overflow-hidden">
      
      {/* Background Decor - Formes géométriques M2 Style */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-emerald-200 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-emerald-100 rounded-full blur-[100px]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex w-full max-w-[1150px] h-[700px] bg-white rounded-[32px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-white overflow-hidden">
        
        {/* LEFT SIDE: Branding & Presentation */}
        <div className="hidden lg:flex w-[42%] bg-[#064e3b] p-16 flex-col justify-between relative">
          {/* Subtle Overlay Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
                <ShieldCheckIcon className="w-7 h-7 text-white" />
              </div>
              <span className="text-white font-bold text-xl tracking-tight">SG-COS</span>
            </div>
            
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
              Système de <br/> <span className="text-emerald-400">Gestion Intégré</span>
            </h1>
            <p className="text-emerald-100/60 text-lg leading-relaxed max-w-xs">
              Plateforme centralisée pour la gestion des œuvres sociales de l'université l'UMMTO.
            </p>
          </div>

          <div className="relative z-10 border-t border-emerald-800/50 pt-8">
            <p className="text-emerald-200/40 text-[11px] uppercase tracking-[0.3em] font-bold">
              SG/COS 2026
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: Login Form */}
        <div className="flex-1 flex flex-col justify-center px-16 md:px-24 py-12 bg-white">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-12 text-center lg:text-left">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Authentification</h2>
              <p className="text-slate-400 text-sm">Veuillez saisir vos identifiants académiques.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-7">
              {/* Email Field */}
              <div className="space-y-2 group">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-emerald-600">
                  Adresse de messagerie
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="prenom.nom@ummto.dz"
                    required
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 font-medium outline-none transition-all focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2 group">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors group-focus-within:text-emerald-600">
                    Mot de passe
                  </label>
                  <button type="button" className="text-[10px] font-bold text-emerald-600 hover:underline">OUBLIÉ ?</button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 font-medium outline-none transition-all focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-600 transition-colors"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full h-14 mt-4 bg-slate-900 rounded-2xl text-white font-bold tracking-widest text-[11px] uppercase shadow-xl shadow-slate-200 transition-all hover:bg-emerald-600 hover:shadow-emerald-200 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? "Vérification..." : "Se connecter au portail"}
              </button>
            </form>

            <div className="mt-16 text-center">
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">
                UMMTO • 2026
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}