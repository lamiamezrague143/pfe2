"use client";
import ProtectedRoutes from "../../components/ProtectedRoutes";

export default function PresidentLayout({ children }) {
  return (
    <ProtectedRoutes roles={[]}>
      {children}
    </ProtectedRoutes>
  );
}