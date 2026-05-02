"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const redirectByRole = (role) => {
    switch (role) {
      case "president":
        router.push("/president");
        break;
      case "secretariat":
        router.push("/secretariat");
        break;
      case "comptable":
        router.push("/comptable");
        break;
      case "agent":
        router.push("/priseEnCharge/priseencharge");
        break;
      case "ingenieur":
        router.push("/cellule");
        break;
      case "beneficiaire":
        router.push("/client");
        break;
      default:
        router.push("/");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      // ❌ erreur backend
      if (!res.ok) {
        alert(data.message || "Erreur login");
        return;
      }

      // ✅ sécurité : vérifier existence
      if (!data.role) {
        alert("Rôle introuvable");
        return;
      }

      // 💾 stockage
      localStorage.setItem("token", data.token || "");
      localStorage.setItem("role", data.role);

      // 🔁 redirection logique
      if (data.firstLogin === true) {
        router.push("/change-password");
      } else {
        redirectByRole(data.role);
      }
    } catch (error) {
      console.error(error);
      alert("Erreur serveur");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white font-sans">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8 border border-gray-100">
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="w-7 h-7 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Connexion</h1>
          <p className="text-xs text-gray-500 mt-1">
            SG/COS - Plateforme de gestion
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-600">Email</label>
            <input
              type="email"
              className="w-full mt-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="exemple@gmail.com"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600">
              Mot de passe
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold shadow-md"
          >
            Se connecter
          </button>
        </form>

        <p className="text-center text-[10px] text-gray-400 mt-6">
          © 2026 SG/COS - Université Mouloud Mammeri
        </p>
      </div>
    </div>
  );
}