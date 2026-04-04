"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { RefreshCw, Eye } from "lucide-react";
import StatusBadge from "./StatusBadge";
import PiecesModal from "./PiecesModal";

const API_BASE = "http://localhost:5001/api";

export default function DemandeList() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPieces, setSelectedPieces] = useState(null);

  // 📥 fetch
  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/demandes`);
      setDemandes(res.data);
    } catch (err) {
      console.error("Erreur fetch demandes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  // 📊 stats
  const nbEnAttente = demandes.filter((d) => d.statut === "En attente").length;
  const nbValidees  = demandes.filter((d) => d.statut === "Validée").length;
  const nbRejetees  = demandes.filter((d) => d.statut === "Rejetée").length;

  return (
    <div>
      {/* 📊 STATS */}
      {demandes.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "En attente", val: nbEnAttente },
            { label: "Validées", val: nbValidees },
            { label: "Refusées", val: nbRejetees },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white p-4 rounded shadow border text-center">
              <p className="text-xl font-bold">{val}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold">Mes demandes</h2>
        <button
          onClick={fetchDemandes}
          className="flex items-center gap-1 text-sm text-green-700"
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* LOADING */}
      {loading ? (
        <p className="text-gray-400 text-center">Chargement...</p>
      ) : demandes.length === 0 ? (
        <p className="text-gray-400 text-center">Aucune demande</p>
      ) : (
        <div className="bg-white border rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th>#</th>
                <th>Bénéficiaire</th>
                <th>Décision</th>
                <th>Pièces</th>
                <th>Statut</th>
              </tr>
            </thead>

            <tbody>
              {demandes.map((d) => {
                const pieces = d.pieces || [];
                const isValidee = d.statut === "Validée";
                const isRejetee = d.statut === "Rejetée";

                return (
                  <tr key={d.id} className="border-t">
                    <td className="p-2">#{d.id}</td>

                    <td className="p-2">
                      <p className="font-semibold">{d.nom_beneficiaire}</p>
                      <p className="text-xs text-gray-400">{d.type_prestation}</p>
                    </td>

                    {/* décision */}
                    <td className="p-2">
                      {d.statut !== "En attente" ? (
                        <div className="text-xs">
                          <p className="font-bold">
                            {isValidee ? "✅ Acceptée" : "❌ Refusée"}
                          </p>
                          <p className="italic text-gray-500">
                            {d.message_admin || "—"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400">En cours...</span>
                      )}
                    </td>

                    {/* pièces */}
                    <td className="p-2 text-center">
                      {pieces.length > 0 ? (
                        <button
                          onClick={() => setSelectedPieces(pieces)}
                          className="flex items-center gap-1 text-blue-600"
                        >
                          <Eye size={14} /> {pieces.length}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* statut */}
                    <td className="p-2 text-center">
                      <StatusBadge status={d.statut} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* modal */}
      {selectedPieces && (
        <PiecesModal
          pieces={selectedPieces}
          onClose={() => setSelectedPieces(null)}
        />
      )}
    </div>
  );
}