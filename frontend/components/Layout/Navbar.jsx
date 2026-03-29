"use client";

import { 
  UserPlus, 
  School, 
  LayoutDashboard, 
  FileCheck, 
  Home 
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Navbar() {
  const pathname = usePathname();

  const menu = [
    { 
      name: "Dashboard", 
      path: "/priseEnCharge/tableauDeBord", 
      icon: LayoutDashboard 
    },
    { 
      name: "Prise en charge", 
      path: "/priseEnCharge/priseencharge", 
      icon: FileCheck 
    },
    { 
      name: "Ajout Bénéficiaire", 
      path: "/priseEnCharge/AjoutEns", 
      icon: UserPlus 
    },
    { 
      name: "Établissement", 
      path: "/priseEnCharge/AjoutEtab", 
      icon: School 
    },
  ];

  return (
    <nav className="bg-green-900 w-full h-16 flex items-center px-6 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
        
        {/* Identité visuelle */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center shadow-inner">
            <Home className="text-white" size={20} />
          </div>
          <span className="text-white font-bold tracking-wide">SG/COS</span>
        </div>
        

        {/* Menu principal */}
        <div className="flex items-center gap-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.path;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                  active
                    ? "bg-white text-green-900 shadow-sm font-semibold"
                    : "text-green-100 hover:bg-green-800 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}