"use client";

import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { apiFetch } from "../../../../lib/api";

// ─── COLONNES ATTENDUES DANS LE FICHIER ──────────────────────────────────────
// | nom_analyse | prix |
// Exemple : | Numération formule sanguine | 1200 |

export default function ImportPrixClinique() {
  const [cliniques, setCliniques]         = useState([]);
  const [cliniqueId, setCliniqueId]       = useState("");
  const [rows, setRows]                   = useState([]);        // lignes parsées
  const [errors, setErrors]               = useState([]);        // lignes invalides
  const [fileName, setFileName]           = useState("");
  const [drag, setDrag]                   = useState(false);
  const [step, setStep]                   = useState("upload");  // upload | preview | done
  const [loading, setLoading]             = useState(false);
  const [result, setResult]               = useState(null);      // { inserted, updated, skipped }
  const fileInputRef                      = useRef(null);

  // ── Chargement des cliniques ─────────────────────────────────────────────
  useEffect(() => {
    apiFetch("/clinics/all")
      .then(data => setCliniques(Array.isArray(data) ? data : []))
      .catch(() => setCliniques([]));
  }, []);

  // ── Parsing du fichier Excel / CSV ───────────────────────────────────────
 const parseFile = (file) => {
  if (!file) return;

  const ext = file.name.split(".").pop().toLowerCase();
  const validExt = ["xlsx", "xls", "csv"];

  if (!validExt.includes(ext)) {
    alert("Format non supporté. Utilise un fichier .xlsx, .xls ou .csv");
    return;
  }

  setFileName(file.name);

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
console.log("EXCEL RAW JSON =>", json);
      const validRows = [];
      const invalidRows = [];

json.forEach((row, i) => {
  // Normaliser toutes les clés : lowercase + trim
  const normalized = {};
  Object.keys(row).forEach(k => {
    normalized[k.toLowerCase().trim()] = row[k];
  });

  const nom = String(normalized.nom_analyse || "").trim();

  const prixRaw = String(normalized.prix || "")
    .replace(/\s/g, "")
    .replace(",", ".");

  const prix = parseFloat(prixRaw);

  if (!nom || isNaN(prix) || prix <= 0) {
    invalidRows.push({ ligne: i + 2, nom, prix: normalized.prix });
  } else {
    validRows.push({ nom, prix });
  }
});

      setRows(validRows);
      setErrors(invalidRows);

      if (validRows.length > 0) {
        setStep("preview");
      } else {
        alert("Aucune ligne valide trouvée. Vérifie le format du fichier.");
      }

    } catch (err) {
      alert("Erreur lors de la lecture du fichier : " + err.message);
    }
  };

  reader.readAsArrayBuffer(file);
};

  const handleFileInput = (e) => parseFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    parseFile(e.dataTransfer.files[0]);
  };

  // ── Envoi vers le backend ────────────────────────────────────────────────
  const handleImport = async () => {
    if (!cliniqueId) { alert("Sélectionne une clinique avant d'importer."); return; }
    if (rows.length === 0) { alert("Aucune donnée à importer."); return; }

    setLoading(true);
    try {
      const res = await apiFetch("/prix-prestations/import", {
        method: "POST",
        body: JSON.stringify({ cliniqueId, prestations: rows }),
      });

      if (!res) throw new Error("Réponse serveur invalide");
      setResult(res);
      setStep("done");
    } catch (err) {
      alert("❌ Erreur lors de l'import : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setRows([]); setErrors([]); setFileName("");
    setStep("upload"); setResult(null); setCliniqueId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Télécharger le modèle Excel ──────────────────────────────────────────
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["nom_analyse", "prix"],
      ["Numération formule sanguine", 1200],
      ["Glycémie à jeun", 800],
      ["Bilan lipidique", 2500],
    ]);
    ws["!cols"] = [{ wch: 40 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, "Prix");
    XLSX.writeFile(wb, "modele_prix_clinique.xlsx");
  };

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Import des Prix</h1>
            <p className="text-sm text-gray-500 mt-1">
              Importe les analyses et leurs tarifs pour une clinique depuis un fichier Excel ou CSV.
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition"
          >
            ⬇️ Modèle Excel
          </button>
        </div>

        {/* ── Sélection de la clinique ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <label className="text-xs font-bold text-gray-400 uppercase block mb-2">
            Clinique / Laboratoire concerné(e)
          </label>
          <select
            value={cliniqueId}
            onChange={e => setCliniqueId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          >
            <option value="">-- Sélectionner une clinique --</option>
            {cliniques.map(c => (
              <option key={c.id} value={String(c.id)}>{c.nom || c.nom_clinique}</option>
            ))}
          </select>
        </div>

        {/* ── ÉTAPE 1 : Upload ── */}
        {step === "upload" && (
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`bg-white rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all shadow-sm
              ${drag ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="text-5xl mb-4">📂</div>
            <p className="text-base font-bold text-gray-700">
              Glisse ton fichier ici ou <span className="text-blue-600 underline">clique pour parcourir</span>
            </p>
            <p className="text-xs text-gray-400 mt-2">Formats acceptés : .xlsx, .xls, .csv</p>
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left max-w-sm mx-auto">
              <p className="text-xs font-bold text-amber-700 mb-1">Format attendu :</p>
              <table className="w-full text-xs text-amber-800">
                <thead><tr className="border-b border-amber-200"><th className="pb-1 font-bold">nom_analyse</th><th className="pb-1 font-bold text-right">prix</th></tr></thead>
                <tbody>
                  <tr><td className="py-0.5">Glycémie à jeun</td><td className="text-right">800</td></tr>
                  <tr><td className="py-0.5">Bilan lipidique</td><td className="text-right">2500</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 : Prévisualisation ── */}
        {step === "preview" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-800 text-sm">📄 {fileName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className="text-green-600 font-bold">{rows.length} ligne{rows.length > 1 ? "s" : ""} valide{rows.length > 1 ? "s" : ""}</span>
                  {errors.length > 0 && <span className="text-red-500 font-bold ml-3">{errors.length} ignorée{errors.length > 1 ? "s" : ""}</span>}
                </p>
              </div>
              <button onClick={handleReset} className="text-xs text-gray-400 underline hover:text-gray-600">
                Changer de fichier
              </button>
            </div>

            {/* Erreurs */}
            {errors.length > 0 && (
              <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs font-bold text-red-700 mb-2">⚠️ Lignes ignorées (données manquantes ou invalides) :</p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {errors.map((e, i) => (
                    <p key={i} className="text-[11px] text-red-600">
                      Ligne {e.ligne} — nom: "{e.nom || "vide"}" | prix: "{e.prix || "vide"}"
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Tableau de prévisualisation */}
            <div className="overflow-y-auto max-h-72 mx-6 my-4 rounded-xl border border-gray-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-[11px] uppercase text-gray-400 font-bold sticky top-0">
                  <tr>
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Analyse / Prestation</th>
                    <th className="px-4 py-2 text-right">Prix (DA)</th>
                    <th className="px-4 py-2 text-right">Part OS 70%</th>
                    <th className="px-4 py-2 text-right">Part Perso 30%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-2 font-medium text-gray-800">{r.nom}</td>
                      <td className="px-4 py-2 text-right font-bold text-gray-900">{r.prix.toLocaleString("fr-FR")}</td>
                      <td className="px-4 py-2 text-right text-green-700 font-medium">{Math.round(r.prix * 0.7).toLocaleString("fr-FR")}</td>
                      <td className="px-4 py-2 text-right text-orange-600 font-medium">{Math.round(r.prix * 0.3).toLocaleString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            <div className="mx-6 mb-4 bg-gray-50 rounded-xl px-4 py-3 flex gap-6 text-xs">
              <div>
                <span className="text-gray-400 uppercase font-bold">Total analyses</span>
                <p className="font-black text-gray-900 text-base">{rows.length}</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-bold">Montant cumulé</span>
                <p className="font-black text-blue-800 text-base">
                  {rows.reduce((s, r) => s + r.prix, 0).toLocaleString("fr-FR")} DA
                </p>
              </div>
            </div>

            {/* Bouton import */}
            <div className="px-6 pb-6">
              <button
                onClick={handleImport}
                disabled={loading || !cliniqueId}
                className={`w-full py-3.5 rounded-xl font-black text-white text-sm transition-all shadow-lg
                  ${loading || !cliniqueId
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-700 hover:bg-blue-800 shadow-blue-200 hover:scale-[1.01]"}`}
              >
                {loading
                  ? "Import en cours..."
                  : !cliniqueId
                    ? "⚠️ Sélectionne une clinique d'abord"
                    : `✅ Importer ${rows.length} analyse${rows.length > 1 ? "s" : ""} pour cette clinique`}
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : Résultat ── */}
        {step === "done" && result && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Import terminé !</h2>
            <p className="text-sm text-gray-500 mb-6">Les prix ont bien été enregistrés pour la clinique sélectionnée.</p>

            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs font-bold text-green-500 uppercase">Ajoutés</p>
                <p className="text-2xl font-black text-green-700">{result.inserted ?? "—"}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs font-bold text-blue-500 uppercase">Mis à jour</p>
                <p className="text-2xl font-black text-blue-700">{result.updated ?? "—"}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-400 uppercase">Ignorés</p>
                <p className="text-2xl font-black text-gray-500">{result.skipped ?? "—"}</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition"
            >
              Importer un autre fichier
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
