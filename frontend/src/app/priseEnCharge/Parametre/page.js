"use client";

import React, { useState, useEffect } from "react";

export default function ParametresPage() {
  const [tab, setTab] = useState("prestations");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // ======================
  // TYPES PRESTATIONS
  // ======================
  const [types, setTypes] = useState([]);
  const [formType, setFormType] = useState({ nom: "", id: null });
  const [searchType, setSearchType] = useState("");

  // ======================
  // AGENTS
  // ======================
  const [agents, setAgents] = useState([]);
  const [formAgent, setFormAgent] = useState({ nom: "", id: null });
  const [searchAgent, setSearchAgent] = useState("");

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  const fetchTypes = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/typesprestations");
      const data = await res.json();
setTypes(Array.isArray(data) ? data : data.types || data.data || []);
    } catch (error) {
      showNotification("Erreur lors du chargement des prestations", "error");
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/agents");
const data = await res.json();

setAgents(Array.isArray(data) ? data : data.agents || []);
    } catch (error) {
      showNotification("Erreur lors du chargement des agents", "error");
    }
  };

  useEffect(() => {
    if (tab === "prestations") fetchTypes();
    if (tab === "agents") fetchAgents();
  }, [tab]);

  const saveType = async (e) => {
    e.preventDefault();
    setLoading(true);

    const isEdit = !!formType.id;

    try {
      await fetch(
        isEdit
          ? `http://localhost:5001/api/typesprestations/${formType.id}`
          : "http://localhost:5001/api/typesprestations",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formType)
        }
      );

      setFormType({ nom: "", id: null });
      await fetchTypes();
      showNotification(isEdit ? "Prestation modifiée avec succès" : "Prestation ajoutée avec succès");
    } catch (error) {
      showNotification("Erreur lors de l'enregistrement", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteType = async (id, nom) => {
    if (!confirm(`Supprimer la prestation "${nom}" ?`)) return;
    setLoading(true);

    try {
      await fetch(`http://localhost:5001/api/typesprestations/${id}`, {
        method: "DELETE"
      });
      await fetchTypes();
      showNotification("Prestation supprimée avec succès");
    } catch (error) {
      showNotification("Erreur lors de la suppression", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveAgent = async (e) => {
    e.preventDefault();
    setLoading(true);

    const isEdit = !!formAgent.id;

    try {
      await fetch(
        isEdit
          ? `http://localhost:5001/api/agents/${formAgent.id}`
          : "http://localhost:5001/api/agents",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formAgent)
        }
      );

      setFormAgent({ nom: "", id: null });
      await fetchAgents();
      showNotification(isEdit ? "Agent modifié avec succès" : "Agent ajouté avec succès");
    } catch (error) {
      showNotification("Erreur lors de l'enregistrement", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteAgent = async (id, nom) => {
    if (!confirm(`Supprimer l'agent "${nom}" ?`)) return;
    setLoading(true);

    try {
      await fetch(`http://localhost:5001/api/agents/${id}`, {
        method: "DELETE"
      });
      await fetchAgents();
      showNotification("Agent supprimé avec succès");
    } catch (error) {
      showNotification("Erreur lors de la suppression", "error");
    } finally {
      setLoading(false);
    }
  };

const filteredTypes = (types || []).filter(t =>
  t.nom?.toLowerCase().includes(searchType.toLowerCase())
);

  const filteredAgents = agents.filter(a => 
    a.nom.toLowerCase().includes(searchAgent.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Notification */}
        {notification.show && (
          <div className={`fixed top-4 right-4 z-50 animate-slide-in rounded-lg shadow-lg p-4 ${
            notification.type === "error" ? "bg-red-500" : "bg-green-500"
          } text-white`}>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{notification.message}</span>
              <button 
                onClick={() => setNotification({ show: false, message: "", type: "" })}
                className="text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Header avec statistiques */}
        <div className="mb-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Paramètres
              </h1>
              <p className="text-gray-500 mt-2">Configuration et gestion des données système</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">
                {tab === "prestations" ? (
                  <span>{types.length} prestation{types.length > 1 ? 's' : ''} enregistrée{types.length > 1 ? 's' : ''}</span>
                ) : (
                  <span>{agents.length} agent{agents.length > 1 ? 's' : ''} enregistré{agents.length > 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs modernes */}
        <div className="flex gap-1 mb-8 bg-white rounded-xl p-1 shadow-sm border border-gray-200 w-fit">
          <button
            onClick={() => setTab("prestations")}
            className={`px-8 py-2.5 rounded-lg font-medium text-sm transition-all ${
              tab === "prestations"
                ? "bg-green-800 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Prestations
          </button>
          <button
            onClick={() => setTab("agents")}
            className={`px-8 py-2.5 rounded-lg font-medium text-sm transition-all ${
              tab === "agents"
                ? "bg-green-800 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Agents
          </button>
        </div>

        {/* Contenu principal avec animation */}
        <div className="transition-all duration-300">
          {/* PRESTATIONS */}
          {tab === "prestations" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formulaire */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-8">
                  <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-800 text-sm font-bold">
                        {formType.id ? "✎" : "+"}
                      </span>
                    </div>
                    <h2 className="font-bold text-xl text-gray-800">
                      {formType.id ? "Modifier" : "Nouvelle"} prestation
                    </h2>
                  </div>

                  <form onSubmit={saveType}>
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Nom de la prestation
                      </label>
                      <input
                        value={formType.nom}
                        onChange={(e) =>
                          setFormType({ ...formType, nom: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-gray-50 hover:bg-white"
                        placeholder="Ex: Consultation, Chirurgie, ..."
                        required
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {loading ? "Traitement..." : (formType.id ? "Mettre à jour" : "Ajouter")}
                      </button>

                      {formType.id && (
                        <button
                          type="button"
                          onClick={() => setFormType({ nom: "", id: null })}
                          className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Liste avec recherche */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <h2 className="font-semibold text-gray-700">
                        Liste des prestations
                      </h2>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={searchType}
                          onChange={(e) => setSearchType(e.target.value)}
                          className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          🔍
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {filteredTypes.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="text-gray-300 text-5xl mb-3">📋</div>
                        <p className="text-gray-400">
                          {searchType ? "Aucun résultat trouvé" : "Aucune prestation enregistrée"}
                        </p>
                      </div>
                    ) : (
                      filteredTypes.map((t, index) => (
                        <div
                          key={t.id}
                          className="flex justify-between items-center p-5 hover:bg-gray-50 transition group"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <span className="font-medium text-gray-800 flex items-center gap-3">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {t.nom}
                          </span>

                          <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition">
                            <button
                              onClick={() => setFormType(t)}
                              className="text-green-600 hover:text-green-800 font-medium text-sm px-4 py-1.5 rounded-lg hover:bg-green-50 transition"
                            >
                              Modifier
                            </button>

                            <button
                              onClick={() => deleteType(t.id, t.nom)}
                              className="text-red-600 hover:text-red-800 font-medium text-sm px-4 py-1.5 rounded-lg hover:bg-red-50 transition"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AGENTS */}
          {tab === "agents" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Formulaire */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-8">
                  <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-sm font-bold">
                        {formAgent.id ? "✎" : "+"}
                      </span>
                    </div>
                    <h2 className="font-bold text-xl text-gray-800">
                      {formAgent.id ? "Modifier" : "Nouvel"} agent
                    </h2>
                  </div>

                  <form onSubmit={saveAgent}>
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Nom de l'agent
                      </label>
                      <input
                        value={formAgent.nom}
                        onChange={(e) =>
                          setFormAgent({ ...formAgent, nom: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-gray-50 hover:bg-white"
                        placeholder="Ex: Dupont, Martin, ..."
                        required
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {loading ? "Traitement..." : (formAgent.id ? "Mettre à jour" : "Ajouter")}
                      </button>

                      {formAgent.id && (
                        <button
                          type="button"
                          onClick={() => setFormAgent({ nom: "", id: null })}
                          className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Liste avec recherche */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <h2 className="font-semibold text-gray-700">
                        Liste des agents
                      </h2>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={searchAgent}
                          onChange={(e) => setSearchAgent(e.target.value)}
                          className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          🔍
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left p-5 font-semibold text-gray-600 text-sm">Nom</th>
                          <th className="text-right p-5 font-semibold text-gray-600 text-sm">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-50">
                        {filteredAgents.length === 0 ? (
                          <tr>
                            <td colSpan="2" className="p-12 text-center">
                              <div className="text-gray-300 text-5xl mb-3">👥</div>
                              <p className="text-gray-400">
                                {searchAgent ? "Aucun résultat trouvé" : "Aucun agent enregistré"}
                              </p>
                            </td>
                          </tr>
                        ) : (
                          filteredAgents.map((a, index) => (
                            <tr key={a.id} className="hover:bg-gray-50 transition group">
                              <td className="p-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 text-xs font-bold">
                                      {a.nom.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="font-medium text-gray-800">{a.nom}</span>
                                </div>
                              </td>
                              <td className="p-5 text-right">
                                <div className="flex gap-2 justify-end opacity-70 group-hover:opacity-100 transition">
                                  <button
                                    onClick={() => setFormAgent(a)}
                                    className="text-green-600 hover:text-green-800 font-medium text-sm px-4 py-1.5 rounded-lg hover:bg-green-50 transition"
                                  >
                                    Modifier
                                  </button>

                                  <button
                                    onClick={() => deleteAgent(a.id, a.nom)}
                                    className="text-red-600 hover:text-red-800 font-medium text-sm px-4 py-1.5 rounded-lg hover:bg-red-50 transition"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}