"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const router = useRouter();

  const toggle = (field) => setShow((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5001/api/users/change-password",
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Mot de passe changé avec succès");
      router.push("/");
    } catch (err) {
      alert(err.response?.data?.message || "Erreur serveur");
    }
  };

  const PasswordField = ({ label, placeholder, value, onChange, field }) => (
    <div className="relative group">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1 group-focus-within:text-emerald-500 transition-colors">
        {label}
      </label>
      <div className="relative">
        <input
          type={show[field] ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          className="w-full border-b-2 border-slate-100 focus:border-emerald-500 outline-none py-2 pr-10 text-sm text-slate-700 bg-transparent transition-all placeholder:text-slate-200"
        />
        <button
          type="button"
          onClick={() => toggle(field)}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500 transition-colors"
        >
          {show[field] ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0fdf4] p-4">
      <div className="flex w-full max-w-[980px] min-h-[600px] bg-white rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)]">

        {/* PANNEAU GAUCHE */}
        <div className="hidden md:flex relative w-[45%] flex-col items-center justify-center overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600">
            <div className="absolute top-[-10%] left-[-20%] w-[120%] h-[60%] bg-white/20 rounded-[100%] blur-3xl transform rotate-12"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[50%] bg-emerald-900/20 rounded-[100%] blur-2xl"></div>
          </div>

          <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-gradient-to-tr from-emerald-200 to-teal-400 rounded-full shadow-inner opacity-60"></div>
          <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-emerald-300 to-emerald-500 rounded-full shadow-2xl opacity-80"></div>

          <div className="relative z-10 text-center px-8">
            {/* Lock icon */}
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7a4.5 4.5 0 10-9 0v3.5M5 10.5h14a1 1 0 011 1V20a1 1 0 01-1 1H5a1 1 0 01-1-1v-8.5a1 1 0 011-1z"/>
              </svg>
            </div>
            <h2 className="text-white font-bold text-4xl mb-4 tracking-tight">Sécurité</h2>
            <p className="text-emerald-50/80 text-sm font-medium tracking-wide">Mettez à jour votre mot de passe</p>
            <p className="text-emerald-50/50 text-xs mt-3 leading-relaxed">Choisissez un mot de passe fort<br/>pour sécuriser votre compte.</p>
          </div>

          <div className="absolute bottom-8 z-10">
            <p className="text-white/40 text-[11px] tracking-[0.2em] uppercase font-bold">sg-cos.ummto.dz</p>
          </div>
        </div>

        {/* PANNEAU DROIT */}
        <div className="flex-1 flex flex-col justify-center px-10 md:px-20 py-12 relative">

          <div className="mb-10">
            <p className="text-slate-400 text-sm font-medium">Sécurité du compte</p>
            <p className="text-emerald-500 font-bold text-xl mb-2">Changement requis</p>
            <h3 className="text-slate-800 font-bold text-2xl">
              Nouveau <span className="text-emerald-500">Mot de Passe</span>
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            <PasswordField
              label="Ancien mot de passe"
              placeholder="Votre mot de passe actuel"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              field="old"
            />
            <PasswordField
              label="Nouveau mot de passe"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              field="new"
            />
            <PasswordField
              label="Confirmer le mot de passe"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              field="confirm"
            />

            {/* Indicateur correspondance */}
            {confirmPassword && (
              <p className={`text-xs font-bold ml-1 transition-all ${newPassword === confirmPassword ? "text-emerald-500" : "text-red-400"}`}>
                {newPassword === confirmPassword ? "✓ Les mots de passe correspondent" : "✗ Les mots de passe ne correspondent pas"}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-4 rounded-xl text-white text-xs font-bold tracking-[0.2em] shadow-lg hover:shadow-emerald-200 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase"
              style={{ background: "linear-gradient(90deg, #10b981 0%, #059669 50%, #0d9488 100%)" }}
            >
              Valider
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="w-full py-3 text-slate-300 text-xs font-bold tracking-widest uppercase hover:text-slate-500 transition-colors"
            >
              ← Retour
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}