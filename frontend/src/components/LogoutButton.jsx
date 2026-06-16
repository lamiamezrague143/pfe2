// frontend/src/components/LogoutButton.jsx
"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
      document.cookie = "token=; path=/; max-age=0"; // ✅ vider le cookie
    router.push("/");
  };

  return (
    <button onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 border border-red-100 bg-red-50 hover:bg-red-100 text-xs font-bold transition-all">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 6a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      Déconnexion
    </button>
  );
}