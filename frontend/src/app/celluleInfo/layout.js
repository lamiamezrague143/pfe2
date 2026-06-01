"use client";
import ProtectedRoutes from "../../components/ProtectedRoutes";
import Celluleinfosidebar from "../../components/sidebars/Celluleinfosidebar";

export default function CelluleInfoLayout({ children }) {
  return (
    <ProtectedRoutes roles={["ingenieur","president"]}>
      <div className="flex h-screen">
        <Celluleinfosidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ProtectedRoutes>
  );
}