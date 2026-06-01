"use client";
import ProtectedRoutes from "../../components/ProtectedRoutes";
import SecretariatSidebar from "../../components/sidebars/SecretariatSidebar";

export default function SecretariatLayout({ children }) {
  return (
    <ProtectedRoutes roles={["secretariat", "president"]}>
      <div className="flex min-h-screen">
        <SecretariatSidebar />
        <main className="flex-1 bg-gray-50">
          {children}
        </main>
      </div>
    </ProtectedRoutes>
  );
}