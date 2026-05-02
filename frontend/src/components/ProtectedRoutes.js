"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "../utils/auth";

export default function ProtectedRoute({ children, roles }) {
  const router = useRouter();

  useEffect(() => {
    const { token, role } = getUser();

    if (!token) {
      router.push("/login");
      return;
    }

    if (!roles.includes(role)) {
      router.push("/unauthorized");
    }
  }, []);

  return children;
}