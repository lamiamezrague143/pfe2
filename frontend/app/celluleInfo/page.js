"use client";
import { useState, useEffect } from "react";

const API = "http://localhost:5001/api";

const fmt = (n) =>
  Number(n || 0).toLocaleString("fr-DZ", { minimumFractionDigits: 2 }) + " DA";

const MOIS_OPTIONS = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
];

const MODE_PAIEMENT_OPTIONS = ["CCP"];
const CATEGORIE_OPTIONS     = ["ATS", "ENS"];

// ── Nombre → lettres (français, dinars algériens) ─────────────────────────────
const UNITES  = ["","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"];
const DIZAINES = ["","","vingt","trente","quarante","cinquante","soixante","soixante","quatre-vingt","quatre-vingt"];

function centLettres(n) {
  if (n === 0) return "";
  if (n < 20) return UNITES[n];
  if (n < 100) {
    const d = Math.floor(n / 10), u = n % 10;
    if (d === 7 || d === 9) return DIZAINES[d] + (u > 0 ? "-" + UNITES[10 + u] : (d === 8 ? "s" : ""));
    return DIZAINES[d] + (d === 8 && u === 0 ? "s" : "") + (u > 0 ? (u === 1 && d !== 8 ? "-et-un" : "-" + UNITES[u]) : "");
  }
  const c = Math.floor(n / 100), r = n % 100;
  return (c === 1 ? "cent" : UNITES[c] + "-cent" + (r === 0 && c > 1 ? "s" : "")) + (r > 0 ? "-" + centLettres(r) : "");
}
function convertir(nb) {
  if (nb === 0) return "";
  if (nb < 1000) return centLettres(nb);
  if (nb < 1_000_000) { const m = Math.floor(nb/1000), r = nb%1000; return (m===1?"mille":centLettres(m)+"-mille")+(r>0?"-"+convertir(r):""); }
  if (nb < 1_000_000_000) { const m = Math.floor(nb/1_000_000), r = nb%1_000_000; return centLettres(m)+"-million"+(m>1?"s":"")+(r>0?"-"+convertir(r):""); }
  return nb.toString();
}
function nombreLettres(n) {
  if (!n || n === 0) return "";
  const entier = Math.floor(Math.abs(n));
  const cents  = Math.round((Math.abs(n) - entier) * 100);
  let res = convertir(entier);
  res = res.charAt(0).toUpperCase() + res.slice(1);
  res += entier > 1 ? " dinars" : " dinar";
  if (cents > 0) res += " et " + convertir(cents) + (cents > 1 ? " centimes" : " centime");
  return res;
}

// ── Ligne vide ────────────────────────────────────────────────────────────────
const emptyLigne = (cols) => ({
  designation: "",
  numero_compte: "",
  montants: Object.fromEntries(cols.map(c => [c.id, ""])),
});

export default function App() {
  const [view, setView]       = useState("list");
  const [etats, setEtats]     = useState([]);
  const [selectedEtat, setSelectedEtat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState(null);

  // En-tête
  const [formData, setFormData] = useState({
    num_etat: "", gestion: new Date().getFullYear().toString(),
    section: "", num_mandat: "",
    date_doc: new Date().toISOString().split("T")[0], mois: "",
    // ── NOUVEAUX CHAMPS ──
    mode_paiement: "CCP",
    categorie_personnel: "",
    etablissement: "",
  });

  // Colonnes dynamiques
  const [colonnes, setColonnes] = useState([
    { id: "base", label: "Net à Payer" },
  ]);
  const [newColLabel, setNewColLabel] = useState("");

  // Lignes
  const [lignes, setLignes] = useState([emptyLigne([{ id: "base" }])]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { fetchEtats(); }, []);

  const fetchEtats = async () => {
    try {
      const r = await fetch(`${API}/etats`);
      if (r.ok) {
        const data = await r.json();
        setEtats(data);
        setFormData(prev => ({ ...prev, num_etat: data.length + 1 }));
      }
    } catch (e) { console.error(e); }
  };

  // ── Colonnes ──────────────────────────────────────────────────────────────
  const ajouterColonne = () => {
    const label = newColLabel.trim();
    if (!label) return;
    const id = "col_" + Date.now();
    const newCol = { id, label };
    setColonnes(prev => [...prev, newCol]);
    setLignes(prev => prev.map(l => ({ ...l, montants: { ...l.montants, [id]: "" } })));
    setNewColLabel("");
  };

  const supprimerColonne = (colId) => {
    if (colonnes.length <= 1) return;
    setColonnes(prev => prev.filter(c => c.id !== colId));
    setLignes(prev => prev.map(l => { const m = { ...l.montants }; delete m[colId]; return { ...l, montants: m }; }));
  };

  const ajouterLigne    = () => setLignes(prev => [...prev, emptyLigne(colonnes)]);
  const supprimerLigne  = (i) => setLignes(prev => prev.filter((_, idx) => idx !== i));

  const updateLigne = (i, key, val) => {
    setLignes(prev => { const c = [...prev]; c[i] = { ...c[i], [key]: val }; return c; });
  };
  const updateMontant = (i, colId, val) => {
    setLignes(prev => {
      const c = [...prev];
      c[i] = { ...c[i], montants: { ...c[i].montants, [colId]: val } };
      return c;
    });
  };

  // ── Calculs ───────────────────────────────────────────────────────────────
  const totalLigne    = (l) => colonnes.reduce((s, c) => s + (parseFloat(l.montants?.[c.id]) || 0), 0);
  const totalColonne  = (colId) => lignes.reduce((s, l) => s + (parseFloat(l.montants?.[colId]) || 0), 0);
  const totalGeneral  = colonnes.reduce((s, c) => s + totalColonne(c.id), 0);

  // ── Enregistrer ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.section || !formData.mois) {
      showToast("Veuillez remplir Section et Mois", "error"); return;
    }
    setLoading(true);
    try {
      const method = selectedEtat ? "PUT" : "POST";
      const url    = selectedEtat ? `${API}/etats/${selectedEtat.id}` : `${API}/etats`;
      const r = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, colonnes, lignes }),
      });
      if (r.ok) { showToast(selectedEtat ? "Mis à jour ✓" : "Enregistré ✓"); fetchEtats(); setView("list"); resetForm(); }
      else showToast("Erreur serveur", "error");
    } catch { showToast("Erreur réseau", "error"); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setSelectedEtat(null);
    setFormData({
      num_etat: "", gestion: new Date().getFullYear().toString(),
      section: "", num_mandat: "",
      date_doc: new Date().toISOString().split("T")[0], mois: "",
      mode_paiement: "CCP", categorie_personnel: "", etablissement: "",
    });
    setColonnes([{ id: "base", label: "Net à Payer" }]);
    setLignes([emptyLigne([{ id: "base" }])]);
    setNewColLabel("");
  };

  const openEdit = async (e) => {
    setSelectedEtat(e);
    setFormData({
      num_etat: e.num_etat || e.id, gestion: e.gestion,
      section: e.section, num_mandat: e.num_mandat || "",
      date_doc: e.date_doc?.substring(0,10) || "", mois: e.mois,
      mode_paiement: e.mode_paiement || "CCP",
      categorie_personnel: e.categorie_personnel || "",
      etablissement: e.etablissement || "",
    });
    const r  = await fetch(`${API}/etats/${e.id}/lignes`);
    const ls = await r.json();
    const cols = e.colonnes || [{ id: "base", label: "Net à Payer" }];
    setColonnes(cols);
    setLignes(ls.length ? ls : [emptyLigne(cols)]);
    setView("form");
  };

  const deleteEtat = async (id) => {
    if (!confirm("Supprimer cet état ?")) return;
    await fetch(`${API}/etats/${id}`, { method: "DELETE" });
    showToast("Supprimé"); fetchEtats();
  };

  // ── Champs helper ─────────────────────────────────────────────────────────
  const F = ({ label, value, onChange, type = "text", placeholder = "" }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="border border-slate-300 rounded px-2 py-1.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 bg-white transition-all" />
    </div>
  );
  const Sel = ({ label, value, onChange, options }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="border border-slate-300 rounded px-2 py-1.5 text-sm font-medium outline-none focus:border-emerald-500 bg-white">
        <option value="">--</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  // ── Badge Mode Paiement ───────────────────────────────────────────────────
  const ModeBadge = ({ mode }) => {
    const isCCP = mode === "CCP";
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
        isCCP ? "bg-blue-100 text-blue-800 border border-blue-300" : "bg-amber-100 text-amber-800 border border-amber-300"
      }`}>
        {isCCP ? "📮" : "🏦"} {mode}
      </span>
    );
  };

  // ── En-tête officielle ────────────────────────────────────────────────────
  const OfficialHeader = () => (
    <div className="border-b-2 border-slate-800 pb-3 mb-5">
      <div className="text-center mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">République Algérienne Démocratique et Populaire</p>
        <p className="text-[9px] text-slate-600">Ministère de l'Enseignement Supérieur et de la Recherche Scientifique</p>
        <p className="text-[9px] font-bold text-slate-700">Université Mouloud Mammeri — Tizi-Ouzou</p>
        <p className="text-[9px] text-slate-600">Direction des Œuvres Sociales</p>
      </div>

      {/* Première ligne d'identifiants */}
      <div className="flex justify-between items-start gap-4 mt-3">
        <div className="flex gap-2 items-end flex-wrap">
          {[
            { l: "N° ÉTAT",   v: formData.num_etat,   big: true },
            { l: "GESTION",   v: formData.gestion },
            { l: "SECTION",   v: formData.section || "—",   w: true },
            { l: "N° MANDAT", v: formData.num_mandat || "—" },
          ].map(({ l, v, big, w }) => (
            <div key={l} className={`border border-slate-400 px-2 py-1 text-center ${w ? "min-w-[100px]" : "min-w-[60px]"}`}>
              <div className="text-[7px] uppercase font-black text-slate-500">{l}</div>
              <div className={`font-black ${big ? "text-lg text-emerald-800" : "text-sm"}`}>{v}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 text-center px-4">
          <h1 className="text-sm font-black uppercase tracking-wider text-slate-800 leading-snug">
            ÉTAT DE PAIEMENT<br/>DES PRESTATIONS ŒUVRES SOCIALES
          </h1>
        </div>

        {/* Côté droit : Date + Mois + (nouveaux champs) */}
        <div className="flex flex-col gap-2 items-end">
          {/* Ligne : Date & Mois */}
          <div className="flex gap-2">
            {[
              { l: "DATE",    v: formData.date_doc ? new Date(formData.date_doc).toLocaleDateString("fr-FR") : "—" },
              { l: "MOIS DE", v: formData.mois || "—" },
            ].map(({ l, v }) => (
              <div key={l} className="border border-slate-400 px-2 py-1 min-w-[100px] text-center">
                <div className="text-[7px] uppercase font-black text-slate-500">{l}</div>
                <div className="font-bold text-sm">{v}</div>
              </div>
            ))}
          </div>

          {/* Ligne : Mode Paiement & Catégorie */}
          <div className="flex gap-2">
            <div className="border border-slate-400 px-2 py-1 min-w-[100px] text-center">
              <div className="text-[7px] uppercase font-black text-slate-500">Mode Paiement</div>
              <div className="font-black text-[11px] text-blue-800 mt-0.5">
                {formData.mode_paiement || "—"}
              </div>
            </div>
            <div className="border border-slate-400 px-2 py-1 min-w-[100px] text-center">
              <div className="text-[7px] uppercase font-black text-slate-500">Catégorie</div>
              <div className="font-black text-[11px] text-slate-800 mt-0.5">
                {formData.categorie_personnel || "—"}
              </div>
            </div>
          </div>

          {/* Établissement / Teneur des comptes */}
          {formData.etablissement && (
            <div className="border border-slate-400 px-2 py-1 w-full text-center">
              <div className="text-[7px] uppercase font-black text-slate-500">Établissement / Teneur des comptes</div>
              <div className="font-bold text-[11px] text-slate-800 mt-0.5">{formData.etablissement}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl font-bold text-white shadow-xl ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="bg-emerald-800 text-white shadow-lg px-6 py-3 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏛️</span>
          <div>
            <h1 className="font-black text-base uppercase tracking-wider">COS UMMTO — État de Paiement</h1>
            <p className="text-[10px] text-emerald-200">Université Mouloud Mammeri de Tizi-Ouzou</p>
          </div>
        </div>
        <div className="flex gap-3">
          {view === "form" && (
            <button onClick={() => window.print()}
              className="bg-white/10 border border-white/30 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/20 transition-all">
              🖨 Imprimer
            </button>
          )}
          <button onClick={() => { if (view !== "list") { setView("list"); resetForm(); } else setView("form"); }}
            className="bg-white text-emerald-800 px-5 py-2 rounded-lg font-bold hover:bg-emerald-50 transition-all shadow-sm text-sm">
            {view === "list" ? "+ Créer État" : "← Retour Liste"}
          </button>
        </div>
      </header>

      <main className="mx-auto p-4 print:p-0" style={{ maxWidth: "100%" }}>

        {/* ══ VUE FORMULAIRE ══ */}
        {view === "form" && (
          <div className="space-y-4">

            {/* Infos de l'état */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 print:hidden">
              <h3 className="text-xs font-black uppercase text-emerald-700 tracking-widest mb-4 border-b border-slate-100 pb-2">
                Informations de l'État
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <F label="N° État"    value={formData.num_etat}   onChange={v => setFormData({...formData, num_etat: v})} />
                <F label="Gestion"    value={formData.gestion}    onChange={v => setFormData({...formData, gestion: v})} />
                <F label="Section"    value={formData.section}    onChange={v => setFormData({...formData, section: v})}    placeholder="Ex: EM/A" />
                <F label="N° Mandat"  value={formData.num_mandat} onChange={v => setFormData({...formData, num_mandat: v})} />
                <F label="Date" type="date" value={formData.date_doc} onChange={v => setFormData({...formData, date_doc: v})} />
                <Sel label="Mois"     value={formData.mois}       onChange={v => setFormData({...formData, mois: v})}       options={MOIS_OPTIONS} />
              </div>

              {/* ── NOUVEAUX CHAMPS ── */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Mode de paiement */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-black text-blue-700 uppercase tracking-wider">Mode de Paiement</span>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {MODE_PAIEMENT_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData({...formData, mode_paiement: opt})}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${
                          formData.mode_paiement === opt
                            ? "bg-blue-700 text-white border-blue-700 shadow-md"
                            : "bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-700"
                        }`}
                      >
                        {opt === "CCP" ? "📮 " : opt === "Virement bancaire" ? "🏦 " : opt === "Espèces" ? "💵 " : "🧾 "}
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catégorie de personnel */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-black text-purple-700 uppercase tracking-wider">Catégorie de Personnel</span>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {CATEGORIE_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData({...formData, categorie_personnel: opt})}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${
                          formData.categorie_personnel === opt
                            ? "bg-purple-700 text-white border-purple-700 shadow-md"
                            : "bg-white text-slate-600 border-slate-300 hover:border-purple-400 hover:text-purple-700"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Établissement / Teneur des comptes */}
                <F
                  label="Établissement / Teneur des comptes"
                  value={formData.etablissement}
                  onChange={v => setFormData({...formData, etablissement: v})}
                  placeholder="Ex: CPA, BNA, Algérie Poste…"
                />
              </div>
            </div>

            {/* Ajouter colonne */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 print:hidden">
              <h3 className="text-xs font-black uppercase text-emerald-700 tracking-widest mb-3">
                Colonnes de montants — <span className="text-slate-400 font-medium normal-case">Ajoutez autant de types de prestations que nécessaire</span>
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {colonnes.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                    <span className="text-xs font-bold text-emerald-800">{c.label}</span>
                    {colonnes.length > 1 && (
                      <button onClick={() => supprimerColonne(c.id)}
                        className="text-red-400 hover:text-red-600 text-xs font-black transition-all leading-none">✕</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 max-w-md">
                <input
                  value={newColLabel}
                  onChange={e => setNewColLabel(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && ajouterColonne()}
                  placeholder="Ex: Mariage, Naissance, Scolarité…"
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200"
                />
                <button onClick={ajouterColonne}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all whitespace-nowrap">
                  + Ajouter colonne
                </button>
              </div>
            </div>

            {/* ── DOCUMENT OFFICIEL ── */}
            <div className="bg-white shadow-md border border-slate-300 p-6 print:shadow-none print:border-none print:p-4"
              style={{ fontFamily: "'Times New Roman', serif" }}>

              <OfficialHeader />

              {/* TABLEAU DYNAMIQUE */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[10px]" style={{ borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      <th className="border-2 border-slate-500 px-1 py-2 text-center font-black bg-slate-100 w-8 text-[9px]">N°</th>
                      <th className="border-2 border-slate-500 px-2 py-2 text-center font-black bg-slate-100 min-w-[160px] text-[10px]">
                        DÉSIGNATION DU BÉNÉFICIAIRE
                      </th>
                      <th className="border-2 border-slate-500 px-2 py-2 text-center font-black bg-slate-100 w-28 text-[10px]">
                        N° COMPTE<br/>
                        <span className="text-[8px] font-normal normal-case text-slate-500">
                          {formData.mode_paiement === "CCP" ? "(CCP)" : formData.mode_paiement ? `(${formData.mode_paiement})` : ""}
                        </span>
                      </th>
                      {colonnes.map(c => (
                        <th key={c.id} className="border-2 border-slate-500 px-2 py-2 text-center font-black bg-emerald-50 min-w-[100px] text-[10px] uppercase">
                          {c.label}
                        </th>
                      ))}
                      <th className="border-2 border-slate-500 px-2 py-2 text-center font-black bg-slate-200 w-32 text-[10px]">
                        TOTAL<br/>LIGNE
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {lignes.map((l, i) => {
                      const tl = totalLigne(l);
                      return (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                          <td className="border border-slate-400 px-1 py-1 text-center font-bold text-slate-400 text-[9px]">
                            {i + 1}
                          </td>
                          <td className="border border-slate-400 p-0.5">
                            <input value={l.designation}
                              onChange={e => updateLigne(i, "designation", e.target.value)}
                              className="w-full px-2 py-1 text-[10px] font-medium outline-none focus:bg-emerald-50 rounded transition-all"
                              placeholder="Nom et Prénom" />
                          </td>
                          <td className="border border-slate-400 p-0.5">
                            <input value={l.numero_compte}
                              onChange={e => updateLigne(i, "numero_compte", e.target.value)}
                              className="w-full px-1 py-1 text-[9px] font-mono outline-none focus:bg-emerald-50 rounded transition-all text-center"
                              placeholder={formData.mode_paiement === "CCP" ? "N° CCP" : "N° Compte"} />
                          </td>
                          {colonnes.map(c => (
                            <td key={c.id} className="border border-slate-400 p-0.5">
                              <input type="number"
                                value={l.montants?.[c.id] || ""}
                                onChange={e => updateMontant(i, c.id, e.target.value)}
                                className="w-full px-1 py-1 text-[10px] font-bold text-right text-emerald-800 outline-none focus:bg-emerald-50 rounded transition-all"
                                placeholder="0" />
                            </td>
                          ))}
                          <td className="border border-slate-400 px-2 py-1 text-right font-black text-[11px] text-slate-800 bg-slate-50">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-black text-emerald-700">
                                {tl > 0 ? Number(tl).toLocaleString("fr-DZ", { minimumFractionDigits: 2 }) : "—"}
                              </span>
                              {lignes.length > 1 && (
                                <button onClick={() => supprimerLigne(i)}
                                  className="print:hidden text-red-300 hover:text-red-500 text-[10px] font-black flex-shrink-0 transition-all">✕</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Lignes vides jusqu'à min 10 */}
                    {lignes.length < 10 && Array.from({ length: 10 - lignes.length }).map((_, idx) => {
                      const actualIndex = lignes.length + idx;
                      return (
                        <tr key={`extra-${actualIndex}`}>
                          <td className="border border-slate-300 py-1 text-center text-slate-300 text-[9px]">{actualIndex + 1}</td>
                          <td className="border border-slate-300 p-0.5">
                            <input className="w-full px-2 py-1 text-[10px] outline-none bg-transparent" placeholder="..." />
                          </td>
                          <td className="border border-slate-300 p-0.5">
                            <input className="w-full px-1 py-1 text-[9px] outline-none bg-transparent text-center" />
                          </td>
                          {colonnes.map(c => (
                            <td key={`extra-col-${c.id}`} className="border border-slate-300 p-0.5">
                              <input className="w-full px-1 py-1 text-[10px] outline-none bg-transparent" />
                            </td>
                          ))}
                          <td className="border border-slate-300 bg-slate-50/30" />
                        </tr>
                      );
                    })}

                    {/* Ligne totaux */}
                    <tr className="bg-slate-200">
                      <td colSpan={3} className="border-2 border-slate-500 px-3 py-2 text-right font-black text-[11px] uppercase tracking-wider text-slate-700">
                        Total par prestation :
                      </td>
                      {colonnes.map(c => (
                        <td key={c.id} className="border-2 border-slate-500 px-2 py-2 text-right font-black text-[11px] text-emerald-800 bg-emerald-50">
                          {Number(totalColonne(c.id)).toLocaleString("fr-DZ", { minimumFractionDigits: 2 })}
                        </td>
                      ))}
                      <td className="border-2 border-slate-500 px-2 py-2 text-right font-black text-[12px] text-slate-900 bg-slate-300">
                        {Number(totalGeneral).toLocaleString("fr-DZ", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ARRÊTÉ */}
              <div className="mt-5 border-2 border-slate-400 rounded p-4 bg-slate-50/50">
                <p className="text-[11px] font-black uppercase text-slate-700 mb-2 tracking-wide">
                  Arrêté le présent état à la somme de :
                </p>
                <p className="text-[13px] font-black text-emerald-900 leading-snug capitalize" style={{ fontFamily: "'Times New Roman', serif" }}>
                  {totalGeneral > 0
                    ? nombreLettres(totalGeneral)
                    : <span className="text-slate-300 font-normal italic text-[11px]">La somme apparaîtra ici en toutes lettres…</span>}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-300 flex justify-between text-[9px] text-slate-500 font-bold uppercase flex-wrap gap-2">
                  <span>{lignes.filter(l => totalLigne(l) > 0).length} bénéficiaire(s)</span>
                  <span>{colonnes.length} prestation(s) : {colonnes.map(c => c.label).join(" + ")}</span>
                  {formData.mode_paiement && <span>Paiement par : {formData.mode_paiement}</span>}
                  {formData.categorie_personnel && <span>Catégorie : {formData.categorie_personnel}</span>}
                  {formData.etablissement && <span>Établissement : {formData.etablissement}</span>}
                  <span>Total général : {fmt(totalGeneral)}</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="flex justify-between mt-8 gap-8">
                {["Le president de la structure de gestion", "Le comptable de la structure de gestion"].map(s => (
                  <div key={s} className="flex-1 text-center border-t-2 border-slate-400 pt-2">
                    <p className="text-[9px] font-black uppercase text-slate-500">{s}</p>
                    <div className="h-16"/>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center py-4 print:hidden">
              <button onClick={ajouterLigne}
                className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-200 transition-all">
                + Ajouter une ligne
              </button>
              <div className="flex gap-3">
                <button onClick={() => { setView("list"); resetForm(); }}
                  className="bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                  Annuler
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="bg-emerald-700 text-white px-10 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-800 shadow-lg disabled:opacity-50 transition-all active:scale-95">
                  {loading ? "Enregistrement..." : selectedEtat ? "Mettre à jour" : `Valider l'État #${formData.num_etat}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ VUE LISTE ══ */}
        {view === "list" && (
          <div className="animate-in fade-in duration-400 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-700">États de Paiement — {new Date().getFullYear()}</h2>
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-black">{etats.length} état(s)</span>
            </div>
            {etats.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center">
                <div className="text-5xl mb-4 opacity-20">📂</div>
                <p className="text-slate-400 font-medium">Aucun état créé.</p>
                <button onClick={() => setView("form")}
                  className="mt-4 bg-emerald-600 text-white px-8 py-3 rounded-full font-bold hover:bg-emerald-700 transition-all shadow-lg text-sm">
                  Créer le premier état
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-emerald-800 text-white text-xs">
                      <th className="px-5 py-3 text-left font-black">N° État</th>
                      <th className="px-5 py-3 text-left font-black">Gestion</th>
                      <th className="px-5 py-3 text-left font-black">Section</th>
                      <th className="px-5 py-3 text-left font-black">Mois</th>
                      <th className="px-5 py-3 text-left font-black">Mode</th>
                      <th className="px-5 py-3 text-left font-black">Catégorie</th>
                      <th className="px-5 py-3 text-left font-black">Date</th>
                      <th className="px-5 py-3 text-right font-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {etats.map((e, i) => (
                      <tr key={e.id} className={`hover:bg-emerald-50/30 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                        <td className="px-5 py-3 font-black text-emerald-800">#{e.num_etat || e.id}</td>
                        <td className="px-5 py-3 font-medium">{e.gestion}</td>
                        <td className="px-5 py-3 font-medium">{e.section}</td>
                        <td className="px-5 py-3">{e.mois}</td>
                        <td className="px-5 py-3">
                          {e.mode_paiement && <ModeBadge mode={e.mode_paiement} />}
                        </td>
                        <td className="px-5 py-3">
                          {e.categorie_personnel && (
                            <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-black">
                              {e.categorie_personnel}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-400 text-xs">{e.date_doc?.substring(0,10)}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => openEdit(e)} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all">✏️ Éditer</button>
                            <button onClick={() => deleteEtat(e.id)} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-100 transition-all">🗑 Supprimer</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @media print {
          header, .print\\:hidden { display: none !important; }
          body { background: white; }
          input, select { border: none !important; background: transparent !important; box-shadow: none !important; }
          input::placeholder { color: transparent; }
          th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
