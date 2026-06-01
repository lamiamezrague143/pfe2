"use client";
import ProtectedRoutes from "../../components/ProtectedRoutes";
import Presidentsidebar from "../../components/sidebars/Presidentsidebar";

export default function PresidentLayout({ children }) {
  return (
    <ProtectedRoutes roles={["president"]}>
      <div className="flex h-screen">
        <Presidentsidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ProtectedRoutes>
  );
}