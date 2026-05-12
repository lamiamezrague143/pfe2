"use client";
import ProtectedRoutes from "../../../components/ProtectedRoutes";
import { apiFetch } from "../../../lib/api";
import React, { useEffect, useState } from "react";
import { 
  Plus, Trash2, CheckCircle, Clock, User, StickyNote, 
  AlertCircle, Search, Filter, FileText, Archive, 
  TrendingUp, Calendar, Tag, Eye, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";



// Couleurs Post-it authentiques
const postItColors = [
  { bg: "#d4e6d4", dark: "#c0dcc0", border: "#b0d0b0", shadow: "rgba(0,0,0,0.1)" }, // Vert doux
  { bg: "#c8e6e0", dark: "#b2dfdb", border: "#a5d6d1", shadow: "rgba(0,0,0,0.1)" }, // Vert menthe
  { bg: "#ffccbc", dark: "#ffab91", border: "#ffab91", shadow: "rgba(0,0,0,0.1)" }, // Pêche
  { bg: "#b3e5fc", dark: "#81d4fa", border: "#81d4fa", shadow: "rgba(0,0,0,0.1)" }, // Bleu ciel
  { bg: "#e1bee7", dark: "#ce93d8", border: "#ce93d8", shadow: "rgba(0,0,0,0.1)" }, // Lavande
];

// Générer une rotation aléatoire entre -2 et 3 degrés
const randomRotation = () => {
  const rotations = [-1.5, -0.8, 0, 0.5, 1.2, 2, 2.5];
  return rotations[Math.floor(Math.random() * rotations.length)];
};

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState({ titre: "", contenu: "", agentNom: "" });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddingNote, setIsAddingNote] = useState(false);

// ✅ APRÈS
const fetchNotes = async () => {
  try {
    const data = await apiFetch("/notes");
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.notes)
      ? data.notes
      : Array.isArray(data?.data)
      ? data.data
      : [];

    if (list.length > 0) {
      const notesWithStyle = list.map((note, index) => ({
        ...note,
        colorIndex: note.colorIndex || index % postItColors.length,
        rotation: note.rotation || randomRotation(),
      }));
      setNotes(notesWithStyle);
    }
  } catch (err) {
    console.error("Erreur chargement notes", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchNotes(); }, []);

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!form.titre || !form.contenu) return;
  try {
    await apiFetch("/notes", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        categorie: "general",
        colorIndex: Math.floor(Math.random() * postItColors.length),
        rotation: randomRotation()
      })
    });
    setForm({ titre: "", contenu: "", agentNom: "" });
    setIsAddingNote(false);
    fetchNotes();
  } catch (err) { console.error("Erreur ajout", err); }
};
const updateStatus = async (id, statut) => {
  try {
    await apiFetch(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify({ statut })
    });
    fetchNotes();
  } catch (err) { console.error("Erreur update", err); }
};

const deleteNote = async (id) => {
  if (confirm("🗑️ Supprimer cette note ?")) {
    try {
      await apiFetch(`/notes/${id}`, { method: "DELETE" });
      fetchNotes();
    } catch (err) { console.error("Erreur delete", err); }
  }
};
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.contenu.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (note.agentNom && note.agentNom.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === "all" || note.statut === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: notes.length,
    completed: notes.filter(n => n.statut === "termine").length,
    pending: notes.filter(n => n.statut !== "termine").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Style Tableau Blanc */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-md mb-4">
            <StickyNote className="text-green-600" size={28} />
            <h1 className="text-3xl font-handwriting text-gray-700">
              Mon Tableau Post-it
            </h1>
          </div>
          <p className="text-gray-600 font-handwriting text-lg">
            Les notes
          </p>
        </div>

        {/* Stats & Search Bar */}
        <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
          <div className="flex gap-3">
            <div className="bg-white px-5 py-2 rounded-lg shadow-sm border-l-8 border-green-400">
              <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
              <div className="text-xs text-gray-500">📝 Notes</div>
            </div>
            <div className="bg-white px-5 py-2 rounded-lg shadow-sm border-l-8 border-emerald-400">
              <div className="text-2xl font-bold text-gray-700">{stats.pending}</div>
              <div className="text-xs text-gray-500">🔄 En cours</div>
            </div>
            <div className="bg-white px-5 py-2 rounded-lg shadow-sm border-l-8 border-teal-400">
              <div className="text-2xl font-bold text-gray-700">{stats.completed}</div>
              <div className="text-xs text-gray-500">✅ Terminées</div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="🔍 Chercher une note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border-2 border-green-200 focus:border-green-400 focus:outline-none bg-white/80 font-handwriting"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border-2 border-green-200 bg-white/80 font-handwriting text-gray-600"
            >
              <option value="all">📋 Toutes</option>
              <option value="encours">🔄 En cours</option>
              <option value="termine">✅ Terminées</option>
            </select>

            <button
              onClick={() => setIsAddingNote(true)}
              className="bg-green-700 hover:bg-green-600 text-white font-handwriting px-5 py-2 rounded-lg shadow-md transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <Plus size={18} /> Nouvelle note
            </button>
          </div>
        </div>

        {/* Grille de Post-it */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-400 border-t-transparent"></div>
              <p className="mt-4 text-gray-500 font-handwriting">📌 Chargement des notes...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredNotes.map((note, index) => {
                const colors = postItColors[note.colorIndex || index % postItColors.length];
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: note.rotation }}
                    exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    key={note.id}
                    style={{
                      backgroundColor: colors.bg,
                      boxShadow: `4px 4px 8px ${colors.shadow}, inset 0 1px 0 rgba(255,255,255,0.5)`,
                      transform: `rotate(${note.rotation}deg)`
                    }}
                    className="relative rounded-sm p-5 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer group"
                  >
                    {/* Pliage effet Post-it */}
                    <div 
                      className="absolute top-0 right-0 w-8 h-8"
                      style={{
                        background: `linear-gradient(135deg, transparent 50%, ${colors.dark} 50%)`,
                        borderBottomLeftRadius: '4px'
                      }}
                    />
                    
                    {/* Header de la note */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            note.statut === "termine" 
                              ? "bg-green-200 text-green-800" 
                              : "bg-emerald-200 text-emerald-800"
                          }`}>
                            {note.statut === "termine" ? "✓ Terminé" : "⟳ En cours"}
                          </span>
                          {note.agentNom && (
                            <span className="text-xs text-gray-600 flex items-center gap-1">
                              <User size={12} /> {note.agentNom}
                            </span>
                          )}
                        </div>
                        
                        <h3 className={`font-bold text-gray-800 text-lg mb-2 break-words font-handwriting ${
                          note.statut === "termine" ? "line-through opacity-60" : ""
                        }`}>
                          {note.titre}
                        </h3>
                        <p className="text-gray-700 text-sm leading-relaxed break-words font-handwriting line-clamp-4">
                          {note.contenu}
                        </p>
                      </div>
                    </div>
                    
                    {/* Footer avec date et actions */}
                    <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-300/30">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>{new Date().toLocaleDateString('fr-FR')}</span>
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {note.statut !== "termine" && (
                          <button
                            onClick={() => updateStatus(note.id, "termine")}
                            className="p-1.5 hover:bg-white/50 rounded transition-colors"
                            title="Terminer"
                          >
                            <CheckCircle size={16} className="text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="p-1.5 hover:bg-white/50 rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Bouton Ajouter (style Post-it vide) */}
            {!isAddingNote && (
              <motion.button
                whileHover={{ scale: 1.02, rotate: 1 }}
                onClick={() => setIsAddingNote(true)}
                className="bg-gray-100 rounded-sm p-5 border-2 border-dashed border-green-300 flex flex-col items-center justify-center gap-3 hover:bg-green-50 transition-all min-h-[280px]"
                style={{ boxShadow: '2px 2px 6px rgba(0,0,0,0.05)' }}
              >
                <Plus size={40} className="text-green-500" />
                <span className="text-green-600 font-handwriting">Ajouter une note</span>
              </motion.button>
            )}

            {/* Modal d'ajout style Post-it */}
            <AnimatePresence>
              {isAddingNote && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  onClick={() => setIsAddingNote(false)}
                >
                  <motion.div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      backgroundColor: '#d4e6d4',
                      boxShadow: '8px 8px 20px rgba(0,0,0,0.2)',
                      transform: 'rotate(0.5deg)'
                    }}
                    className="relative rounded-sm w-full max-w-md p-6"
                  >
                    <div 
                      className="absolute top-0 right-0 w-10 h-10"
                      style={{
                        background: 'linear-gradient(135deg, transparent 50%, #c0dcc0 50%)',
                        borderBottomLeftRadius: '4px'
                      }}
                    />
                    
                    <button
                      onClick={() => setIsAddingNote(false)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10"
                    >
                      <X size={20} />
                    </button>
                    
                    <h2 className="text-2xl font-handwriting text-gray-800 mb-4 text-center">
                      📝 Nouvelle note
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <input
                        type="text"
                        placeholder="Titre..."
                        value={form.titre}
                        onChange={(e) => setForm({ ...form, titre: e.target.value })}
                        className="w-full p-3 bg-white/80 border border-green-300 rounded font-handwriting focus:outline-none focus:border-green-500"
                        autoFocus
                      />
                      
                      <textarea
                        placeholder="Votre note..."
                        rows={5}
                        value={form.contenu}
                        onChange={(e) => setForm({ ...form, contenu: e.target.value })}
                        className="w-full p-3 bg-white/80 border border-green-300 rounded font-handwriting focus:outline-none focus:border-green-500 resize-none"
                      />
                      
                      <input
                        type="text"
                        placeholder="Agent (optionnel)"
                        value={form.agentNom}
                        onChange={(e) => setForm({ ...form, agentNom: e.target.value })}
                        className="w-full p-3 bg-white/80 border border-green-300 rounded font-handwriting focus:outline-none focus:border-green-500"
                      />
                      
                      <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-handwriting py-3 rounded transition-colors"
                      >
                        📌 Épingler la note
                      </button>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Aucun résultat */}
        {!loading && filteredNotes.length === 0 && !isAddingNote && (
          <div className="text-center py-20">
            <Archive size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-handwriting text-lg">
              Aucune note trouvée
            </p>
            <button
              onClick={() => setIsAddingNote(true)}
              className="mt-4 text-green-600 hover:text-green-700 font-handwriting"
            >
              ✨ Créer votre première note
            </button>
          </div>
        )}

        {/* Footer */}
        
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap');
        
        .font-handwriting {
          font-family: 'Kalam', cursive;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}