"use client";

import React, { useState, useEffect } from "react";

const PieChart = ({ title, data, colors }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center flex-1 border-t-4 border-blue-600 transition-all hover:shadow-lg">
      <h3 className="text-xs font-black uppercase text-gray-400 mb-6 tracking-widest">{title}</h3>
      <div className="relative w-48 h-48 mb-6">
        <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
          {total === 0 ? (
            <circle cx="0" cy="0" r="1" fill="#f3f4f6" />
          ) : (
            Object.entries(data).map(([label, value], idx) => {
              const percent = value / total;
              if (percent === 0) return null;
              const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
              cumulativePercent += percent;
              const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
              const largeArcFlag = percent > 0.5 ? 1 : 0;
              const pathData = [
                `M ${startX} ${startY}`,
                `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                `L 0 0`,
              ].join(' ');
              return (
                <path key={idx} d={pathData} fill={colors[idx % colors.length]}
                  className="hover:opacity-80 transition-opacity cursor-pointer">
                  <title>{label}: {value}</title>
                </path>
              );
            })
          )}
          <circle cx="0" cy="0" r="0.6" fill="white" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-black text-gray-800">{total}</span>
            <span className="text-[10px] uppercase text-gray-400 font-bold">Total</span>
        </div>
      </div>
      <div className="w-full grid grid-cols-1 gap-2 border-t pt-4">
        {Object.entries(data).map(([label, value], idx) => (
          <div key={label} className="flex justify-between items-center text-[10px] font-bold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: colors[idx % colors.length] }}></div>
              <span className="uppercase text-gray-600">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">({value})</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded text-blue-800">
                {total > 0 ? ((value / total) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function TableauDeBord() {
  const [history, setHistory]       = useState([]);
  const [dossiers, setDossiers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [plafondGeneral,  setPlafondGeneral]  = useState(130000);
  const [plafondDentaire, setPlafondDentaire] = useState(50000);
  const [plafondOphta,    setPlafondOphta]    = useState(50000);

const fetchData = async () => {
      try {
        const resSet = await fetch("http://localhost:5001/api/settings");
        if (resSet.ok) {
          const settings = await resSet.json();
          if (settings.plafond_general)  setPlafondGeneral(Number(settings.plafond_general));
          if (settings.plafond_dentaire) setPlafondDentaire(Number(settings.plafond_dentaire));
          if (settings.plafond_ophta)    setPlafondOphta(Number(settings.plafond_ophta));
        }

        const resHis = await fetch("http://localhost:5001/api/prise-en-charge/all");
        if (resHis.ok) {
          const allData = await resHis.json();
          const currentYear = new Date().getFullYear();
          setHistory(allData.filter(item => new Date(item.createdAt).getFullYear() === currentYear));
        }

        const resDos = await fetch("http://localhost:5001/api/dossiers/liste-generale");
        if (resDos.ok) {
          const allDos = await resDos.json();
          const currentYear = new Date().getFullYear();
          setDossiers(
            allDos.filter(d =>
              new Date(d.createdAt).getFullYear() === currentYear &&
              parseFloat(d.montant_avenant || 0) > 0
            )
          );
        }
      } catch (err) {
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };

useEffect(() => {
  fetchData();
}, []);

  const updatePlafondDB = async (key, value) => {
    const val = Number(value);
    if (key === 'plafond_general')  setPlafondGeneral(val);
    if (key === 'plafond_dentaire') setPlafondDentaire(val);
    if (key === 'plafond_ophta')    setPlafondOphta(val);
    try {
      await fetch("http://localhost:5001/api/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: String(val) })
      });
    } catch (err) { console.error("Erreur de sauvegarde:", err); }
  };

const statsGrades = history.reduce((acc, curr) => {
  const fonctionRaw = 
    curr.pieces?.fonction || 
    curr.fFonction || 
    curr.fonction || 
    "";
    
  const f = String(fonctionRaw).toUpperCase().trim();

  if (f.includes("ATS") || f.includes("ADMINISTRATIF") || f.includes("TECHNIQUE")) {
    acc["ATS"]++;
  } 
  else if (f.includes("ENS") || f.includes("PROF") || f.includes("DOCTEUR") || f.includes("MAITRE") || f.includes("MCTA") || f.includes("MCA")) {
    acc["ENSEIGNANT"]++;
  } 
  else if (f.includes("RETRAITE") || f.includes("RETR")) {
    acc["RETRAITE"]++;
  } 
  else if (f !== "") {
    acc["AUTRES"] = (acc["AUTRES"] || 0) + 1;
  }
  
  return acc;
}, { "ATS": 0, "ENSEIGNANT": 0, "RETRAITE": 0, "AUTRES": 0 });

const statsPrestations = history.reduce((acc, curr) => {
  const status = (curr.status || "").toLowerCase().trim();

if (
  status.includes("annul") ||
  status.includes("cancel") ||
  status.includes("refus")
)
    return acc;

  const p = curr.titre || curr.prestation;
  if (!p) return acc;

  acc[p] = (acc[p] || 0) + 1;
  return acc;
}, {});

  const avenantsByClient = dossiers.reduce((acc, d) => {
    const key = (d.nom_beneficiaire || "").toUpperCase().trim();
    if (!acc[key]) acc[key] = { parts: d.nom_beneficiaire || "", avenants: [] };
    acc[key].avenants.push({
      montant:     parseFloat(d.montant_avenant || 0),
      prestation: d.type_prestation || "",
      category: (() => {
        const p = (d.type_prestation || "").toUpperCase();
        if (p.includes("DENT")) return "dentaire";
        if (p.includes("OPHTA") || p.includes("OEIL")) return "ophtalmique";
        return "general";
      })(),
    });
    return acc;
  }, {});

const clientsRegroupes = history.reduce((acc, curr) => {
  // On récupère le nom du patient (pNom + pPrenom)
  const clientKey = `${curr.pNom || ''} ${curr.pPrenom || ''}`.toUpperCase().trim() || "INCONNU";
  
  // On utilise montantTotal car c'est ce qui est défini dans ton modèle
  const montant = parseFloat(curr.montantTotal || 0);
  const titrePrest = curr.prestation || "Sans titre";
  const prestUpper = titrePrest.toUpperCase();

  // 1. Déterminer la catégorie
  let category = "general";
  if (prestUpper.includes("DENT")) category = "dentaire";
  else if (prestUpper.includes("OPHTA") || prestUpper.includes("OEIL")) category = "ophtalmique";

  const target = acc[category];
  if (!target[clientKey]) {
    target[clientKey] = {
      nom: clientKey,
      prises: [],
      prisesAnnulees: [],
      avenants: [],
      totalConsomme: 0,
    };
  }

  // 2. Vérification du statut (on utilise soit le Boolean 'annule', soit le texte 'Annulée')
  const estAnnulee = curr.annule === true || curr.statut === 'Annulée';

  if (estAnnulee) {
    // AJOUT DANS LE TABLEAU (Colonnes rouges) MAIS PAS DANS LE TOTAL
    target[clientKey].prisesAnnulees.push({
      montant,
      prestation: titrePrest,
      status: 'Annulée'
    });
  } else {
    // AJOUT DANS LE TABLEAU (Colonnes bleues) ET DANS LE TOTAL
    target[clientKey].prises.push({
      montant,
      prestation: titrePrest,
      status: 'Active'
    });
    target[clientKey].totalConsomme += montant;
  }

  return acc;
}, { general: {}, dentaire: {}, ophtalmique: {} });
  Object.entries(avenantsByClient).forEach(([clientKey, data]) => {
    data.avenants.forEach(av => {
      const cat    = av.category;
      const target = clientsRegroupes[cat];
      if (!target[clientKey]) {
        target[clientKey] = {
          nom: clientKey,
          prenom: "",
          prises: [],
          prisesAnnulees: [],
          avenants: [],
          totalConsomme: 0,
        };
      }
      target[clientKey].avenants.push(av);
      target[clientKey].totalConsomme += av.montant;
    });
  });

  const getStatus = (consomme, max) => {
    const ratio = (consomme / max) * 100;
    if (ratio >= 100) return { color: "bg-red-600", text: "PLAFOND ATTEINT", zone: "text-red-700", row: "bg-red-50" };
    if (ratio >= 70)  return { color: "bg-orange-500", text: "ATTENTION", zone: "text-orange-700", row: "bg-orange-50" };
    return { color: "bg-green-600", text: "DISPONIBLE", zone: "text-green-700", row: "bg-white" };
  };

  const renderTable = (data, title, plafondMax, colorBorder) => {
  const clients  = Object.values(data);

  const filtered = clients.filter(client =>
    (client.nom || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maxPrises = clients.reduce((max, c) => Math.max(max, c.prises.length), 0) || 1;
  const maxAvenants = clients.reduce((max, c) => Math.max(max, c.avenants.length), 0);

  const maxAnnulees = clients.reduce(
    (max, c) => Math.max(max, (c.prisesAnnulees || []).length),
    0
  );

  const priseColumns   = Array.from({ length: maxPrises }, (_, i) => i + 1);
  const avenantColumns = Array.from({ length: maxAvenants }, (_, i) => i + 1);
  const annuleeColumns = Array.from({ length: maxAnnulees }, (_, i) => i + 1);

  const hasAnyAvenant = maxAvenants > 0;
  const hasAnyAnnulee = maxAnnulees > 0;

  return (
    <div className="mb-12">
      <div className={`flex justify-between items-center mb-4 border-l-8 ${colorBorder} pl-4`}>
        <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">{title}</h2>
        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border">
          PLAFOND {new Date().getFullYear()}: {plafondMax.toLocaleString()} DA
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-xl overflow-x-auto border border-gray-200">
        <table className="w-full text-left min-w-[1000px]">
          <thead>
            <tr className="bg-blue-900 text-white text-[10px] uppercase tracking-widest">
              <th className="p-4 sticky left-0 bg-blue-900 z-10 shadow-md">Bénéficiaire</th>

              {priseColumns.map(num => (
                <th key={`ph-${num}`} className="p-4 border-l border-blue-800 text-center">
                  Prise {num}
                </th>
              ))}

              {hasAnyAvenant && avenantColumns.map(num => (
                <th key={`ah-${num}`} className="p-4 border-l border-amber-500 text-center bg-amber-800/30 text-amber-200">
                  Avenant {num}
                </th>
              ))}

              {hasAnyAnnulee && annuleeColumns.map(num => (
                <th key={`xh-${num}`} className="p-4 border-l border-red-400 text-center bg-red-900/30 text-red-200">
                  Prise Annulée {num}
                </th>
              ))}

              <th className="p-4 text-center border-l border-blue-800 bg-blue-950">Consommé</th>
              <th className="p-4 text-center border-l border-blue-800">Reste</th>
              <th className="p-4 text-center border-l border-blue-800">Statut</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    1 +
                    priseColumns.length +
                    (hasAnyAvenant ? avenantColumns.length : 0) +
                    (hasAnyAnnulee ? annuleeColumns.length : 0) +
                    3
                  }
                  className="p-10 text-center text-gray-400 italic"
                >
                  Aucune donnée trouvée.
                </td>
              </tr>
            ) : (
              filtered.map((client, idx) => {
                const status = getStatus(client.totalConsomme, plafondMax);
                const reste  = Math.max(0, plafondMax - client.totalConsomme);

                return (
                  <tr key={idx} className={`border-b border-gray-50 ${status.row} transition-colors hover:bg-blue-50/30`}>
                    <td className="p-4 sticky left-0 bg-inherit z-10 font-black text-gray-800 uppercase text-[11px] border-r">
                      {client.nom}
                    </td>

                    {/* PRISES */}
                    {priseColumns.map((_, i) => {
                      const prise = client.prises[i];
                      return (
                        <td key={`pc-${i}`} className="p-4 text-center border-l border-gray-100 min-w-[130px]">
                          {prise ? (
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] font-bold text-gray-400 uppercase leading-tight">
                                {prise.prestation}
                              </span>

                              <span className={`text-[11px] font-black ${prise.status.toLowerCase().includes("annul") ? "text-red-500 line-through" : "text-blue-700"}`}>
                                {prise.montant.toLocaleString()} DA
                              </span>

                              {prise.status.toLowerCase().includes("annul") && (
  <span className="text-[8px] text-red-500 font-bold">ANNULÉ</span>
)}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-[10px]">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* AVENANTS */}
                    {hasAnyAvenant && avenantColumns.map((_, i) => {
                      const av = client.avenants[i];
                      return (
                        <td key={`ac-${i}`} className={`p-4 text-center border-l border-amber-100 min-w-[120px] ${av ? 'bg-amber-50' : ''}`}>
                          {av ? (
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] font-bold text-amber-400 uppercase leading-tight">
                                {av.prestation}
                              </span>
                              <span className="text-[11px] font-black text-amber-700">
                                +{av.montant.toLocaleString()} DA
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-[10px]">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* ANNULÉES */}
                    {hasAnyAnnulee && annuleeColumns.map((_, i) => {
                      const ann = (client.prisesAnnulees || [])[i];
                      return (
                        <td key={`xc-${i}`} className={`p-4 text-center border-l border-red-100 min-w-[130px] ${ann ? 'bg-red-50' : ''}`}>
                          {ann ? (
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] font-bold text-red-300 uppercase leading-tight">
                                {ann.prestation}
                              </span>
                              <span className="text-[11px] font-black text-red-500 line-through">
                                {ann.montant.toLocaleString()} DA
                              </span>
                              <span className="text-[8px] text-red-400 font-black">
                                ANNULÉ
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-[10px]">—</span>
                          )}
                        </td>
                      );
                    })}

                    <td className={`p-4 text-center font-black border-l border-gray-200 ${status.zone}`}>
                      {client.totalConsomme.toLocaleString()} DA
                    </td>

                    <td className="p-4 text-center font-bold text-gray-400">
                      {reste.toLocaleString()} DA
                    </td>

                    <td className="p-4 text-center">
                      <span className={`${status.color} text-white text-[8px] px-2 py-0.5 rounded-full font-black`}>
                        {status.text}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

  if (loading) return <div className="p-10 text-center font-bold text-gray-400 animate-pulse">Chargement des données...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-blue-900 uppercase">Tableau de Bord</h1>
            <p className="text-gray-500 font-bold">Exercice Annuel {new Date().getFullYear()}</p>
          </div>
          <div className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Université Mouloud Mammeri <br/> Commission des Œuvres Sociales
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-8 mb-10">
          <PieChart title="Répartition par Prestations" data={statsPrestations} colors={["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"]} />
          <PieChart title="Répartition par Grades" data={statsGrades} colors={["#0f172a", "#3b82f6", "#94a3b8"]} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md mb-8 border-l-8 border-blue-900 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Plafond Général (DA)</label>
            <input type="number" value={plafondGeneral} onChange={(e) => updatePlafondDB('plafond_general', e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-bold text-blue-900 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Plafond Dentaire (DA)</label>
            <input type="number" value={plafondDentaire} onChange={(e) => updatePlafondDB('plafond_dentaire', e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-bold text-teal-700 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Plafond Ophtalmique (DA)</label>
            <input type="number" value={plafondOphta} onChange={(e) => updatePlafondDB('plafond_ophta', e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg font-bold text-purple-700 outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Filtrer la liste</label>
            <input type="text" placeholder="Chercher un nom..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg shadow-sm outline-none font-bold" />
          </div>
        </div>

        {renderTable(clientsRegroupes.general,     "Consommation Médicale Générale",      plafondGeneral,  "border-blue-600")}
        {renderTable(clientsRegroupes.dentaire,    "Consommation Soins Dentaires",         plafondDentaire, "border-teal-500")}
        {renderTable(clientsRegroupes.ophtalmique, "Consommation Soins Ophtalmologiques",  plafondOphta,    "border-purple-600")}
      </div>
    </div>
  );
}