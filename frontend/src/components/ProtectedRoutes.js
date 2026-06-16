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
  const token = getCookie("token");
  let role = null;
  if (token) {
    try {
      role = JSON.parse(atob(token.split(".")[1])).role;
    } catch {}
  }
  return { token, role };
}

export default function ProtectedRoutes({ children, roles = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { token, role } = getUser();
    console.log("TOKEN:", token);
    console.log("ROLE:", role);
    console.log("ROLES ATTENDUS:", roles);

    if (!token) {
      console.log("→ pas de token, redirect");
      router.replace("/");
      return;
    }
    if (roles.length > 0 && !roles.includes(role)) {
      console.log("→ role non autorisé, redirect");
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