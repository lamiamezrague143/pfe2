"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from "next/navigation";
const API_URL = "http://localhost:5001/api/archives";

const ArchivePage = () => {
  const router = useRouter();
  const [archives, setArchives] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [files, setFiles] = useState([]);
  const [nomDossier, setNomDossier] = useState('');

  const [selectedArchive, setSelectedArchive] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editName, setEditName] = useState('');

  // 🔄 LOAD ARCHIVES
  const loadArchives = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?search=${searchTerm}`);
      setArchives(Array.isArray(res.data) ? res.data : res.data.archives || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => loadArchives(), 300);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  // 📤 UPLOAD MULTIPLE
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!files.length || !nomDossier) {
      alert("Remplissez tous les champs");
      return;
    }

    const formData = new FormData();
    formData.append("nomDossier", nomDossier);

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      await axios.post(`${API_URL}/upload`, formData);

      setNomDossier('');
      setFiles([]);
      loadArchives();

      alert("✅ Documents archivés !");
    } catch (err) {
      console.error(err);
      alert("❌ Erreur upload");
    }
  };

  // 🗑 DELETE
  const deleteArchive = async (id) => {
    if (!confirm("Supprimer ce dossier ?")) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      loadArchives();
    } catch (err) {
      alert("Erreur suppression");
    }
  };

  // ✏️ UPDATE
  const updateArchive = async () => {
    try {
      await axios.put(`${API_URL}/${selectedArchive.id}`, {
        nomDossier: editName
      });

      setShowModal(false);
      loadArchives();
    } catch (err) {
      alert("Erreur modification");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans">

      {/* HEADER WITH BACK BUTTON */}
      <div className="flex items-center gap-4 mb-6">
        <button
  onClick={() => router.push("/")}
  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg transition-colors"
>
  ← Retour
</button>
        <h1 className="text-2xl font-black text-gray-800">
          📁 Archivage des documents
        </h1>
      </div>

      {/* FORM */}
      <div className="bg-gray-50 p-5 rounded-xl border mb-6 shadow-sm">
        <h3 className="font-bold mb-3 text-gray-700">Nouveau dossier</h3>

        <form onSubmit={handleUpload} className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Nom du dossier"
            value={nomDossier}
            onChange={(e) => setNomDossier(e.target.value)}
            className="flex-1 p-2 border rounded-lg"
          />

          <input
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files))}
            className="text-sm"
          />

          <button className="bg-green-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-900">
            Enregistrer
          </button>
        </form>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="🔍 Rechercher..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-green-500"
      />

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-sm">

          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-3 text-left">Dossier</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="text-center p-6">
                  Chargement...
                </td>
              </tr>
            ) : archives.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center p-6 text-gray-400">
                  Aucun document
                </td>
              </tr>
            ) : (
              archives.map((arc) => (
                <tr key={arc.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-bold">{arc.nomDossier}</td>

                  <td className="p-3 text-gray-500">
                    {new Date(arc.createdAt).toLocaleDateString('fr-FR')}
                  </td>

                  <td className="p-3 text-right space-x-3">

                   {(Array.isArray(arc.fichiers) ? arc.fichiers : []).map((f, i) => (
  <a
    key={i}
    href={f.url}
    target="_blank"
    className="block text-blue-600 text-xs"
  >
    📄 {f.nom}
  </a>
))}

                    <button
                      onClick={() => {
                        setSelectedArchive(arc);
                        setEditName(arc.nomDossier);
                        setShowModal(true);
                      }}
                      className="text-green-700 font-bold"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => deleteArchive(arc.id)}
                      className="text-red-600 font-bold"
                    >
                      🗑
                    </button>

                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

            {/* HEADER */}
            <div className="bg-green-800 text-white p-4 font-bold flex justify-between">
              Modifier dossier
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* BODY */}
            <div className="p-5 space-y-4">

              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-3 border rounded-lg"
              />

              <div className="flex gap-3">

                <button
                  onClick={updateArchive}
                  className="flex-1 bg-green-800 text-white py-2 rounded-lg font-bold hover:bg-green-900"
                >
                  💾 Enregistrer
                </button>

                <button
                  onClick={() => deleteArchive(selectedArchive.id)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold"
                >
                  🗑 Supprimer
                </button>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ArchivePage;