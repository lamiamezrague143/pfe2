"use client";
import ProtectedRoutes from "../../components/ProtectedRoutes";
import Comptablesidebar from "../../components/sidebars/Comptablesidebar";

export default function ComptableLayout({ children }) {
  return (
    <ProtectedRoutes roles={["comptable", "president"]}>
      <div className="flex h-screen">
        <Comptablesidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ProtectedRoutes>
  );
}