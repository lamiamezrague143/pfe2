"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

function getUser() {
  const token = getCookie("token"); // ✅ lit le cookie au lieu de localStorage
  const role = localStorage.getItem("role");
  return { token, role };
}

export default function ProtectedRoutes({ children, roles = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { token, role } = getUser();

    if (!token) {
      router.replace("/");
      return;
    }

    if (roles.length > 0 && !roles.includes(role)) {
      router.replace("/");
      return;
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return children;
}