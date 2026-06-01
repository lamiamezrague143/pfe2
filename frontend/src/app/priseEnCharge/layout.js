"use client";
import ProtectedRoutes from "../../components/ProtectedRoutes";
import Agentsidebar from "../../components/sidebars/Agentsidebar";
import "../style.css";

export default function AppLayout({ children }) {
  return (
    <ProtectedRoutes roles={["agent", "president"]}>
      <div className="min-h-screen flex flex-row">
        <Agentsidebar />
        <main className="flex-1 bg-gray-50 p-8 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoutes>
  );
}