import Navbar from "../../components/Layout/Navbar";
import "../style.css";


export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* La barre est maintenant en haut */}
      <Navbar /> 

      {/* Le contenu principal occupe le reste de l'espace */}
      <main className="flex-1 bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}