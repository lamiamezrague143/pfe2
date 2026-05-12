"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedRoutes({ children, roles = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { token, role } = getUser();

    // pas connecté
    if (!token) {
      router.replace("/login");
      return;
    }

    // check roles seulement si roles est défini
    if (roles.length > 0 && !roles.includes(role)) {
      router.replace("/unauthorized");
      return;
    }

    setLoading(false);
  }, [router, roles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return children;
}