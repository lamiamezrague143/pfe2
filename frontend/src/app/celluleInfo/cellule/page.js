"use client";
import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  BellIcon,
  CalendarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import LogoutButton from "../../../components/LogoutButton";
import api from "../../../lib/api";
const API = "http://localhost:5001/api";

const fmt = (n) =>
  Number(n || 0).toLocaleString("fr-DZ", { minimumFractionDigits: 2 }) + " DA";

const MOIS_OPTIONS = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
];
const MODE_PAIEMENT_OPTIONS = ["CCP"];
const CATEGORIE_OPTIONS     = ["ATS", "ENS"];

// ── Nombre → lettres ─────────────────────────────────────────────────────────
const UNITES   = ["","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"];
const DIZAINES = ["","","vingt","trente","quarante","cinquante","soixante","soixante","quatre-vingt","quatre-vingt"];
function centLettres(n) {
  if (n === 0) return "";
  if (n < 20) return UNITES[n];
  if (n < 100) { const d=Math.floor(n/10),u=n%10; if(d===7||d===9)return DIZAINES[d]+(u>0?"-"+UNITES[10+u]:(d===8?"s":"")); return DIZAINES[d]+(d===8&&u===0?"s":"")+(u>0?(u===1&&d!==8?"-et-un":"-"+UNITES[u]):""); }
  const c=Math.floor(n/100),r=n%100; return(c===1?"cent":UNITES[c]+"-cent"+(r===0&&c>1?"s":""))+(r>0?"-"+centLettres(r):"");
}
function convertir(nb) {
  if(nb===0)return ""; if(nb<1000)return centLettres(nb);
  if(nb<1_000_000){const m=Math.floor(nb/1000),r=nb%1000;return(m===1?"mille":centLettres(m)+"-mille")+(r>0?"-"+convertir(r):"");}
  if(nb<1_000_000_000){const m=Math.floor(nb/1_000_000),r=nb%1_000_000;return centLettres(m)+"-million"+(m>1?"s":"")+(r>0?"-"+convertir(r):"");}
  return nb.toString();
}
function nombreLettres(n) {
  if(!n||n===0)return ""; const entier=Math.floor(Math.abs(n)),cents=Math.round((Math.abs(n)-entier)*100);
  let res=convertir(entier); res=res.charAt(0).toUpperCase()+res.slice(1);
  res+=entier>1?" dinars":" dinar"; if(cents>0)res+=" et "+convertir(cents)+(cents>1?" centimes":" centime"); return res;
}

const emptyLigne = (cols) => ({ designation:"", numero_compte:"", montants: Object.fromEntries(cols.map(c=>[c.id,""])) });

// ── Détection colonnes Excel ──────────────────────────────────────────────────
function detectExcelColumns(headers) {
  const lower = headers.map(h => String(h || "").toLowerCase().trim());
  const find  = (...keys) => {
    for (const k of keys) {
      const idx = lower.findIndex(h => h.includes(k));
      if (idx !== -1) return idx;
    }
    return -1;
  };
  return {
    nomIdx     : find("nom", "désignation", "designation", "beneficiaire", "bénéficiaire"),
    compteIdx  : find("compte", "n°compte", "ccp", "rib"),
    montantIdx : find("montant", "net", "salaire", "somme"),
  };
}

// ── Parser Excel → lignes ─────────────────────────────────────────────────────
function parseExcelFile(file, colonnes, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data  = new Uint8Array(e.target.result);
      const wb    = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw   = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (!raw || raw.length < 2) { callback(null, "Fichier vide ou illisible"); return; }
      const headerRow = raw[0].map(c => String(c || ""));
      const { nomIdx, compteIdx, montantIdx } = detectExcelColumns(headerRow);
      const lignes = [];
      for (let i = 1; i < raw.length; i++) {
        const row = raw[i];
        if (!row || row.every(c => c === "" || c === null || c === undefined)) continue;
        const designation    = nomIdx  >= 0 ? String(row[nomIdx]  || "").trim() : "";
        const numero_compte  = compteIdx >= 0 ? String(row[compteIdx] || "").trim() : "";
        const montantBrut    = montantIdx >= 0 ? row[montantIdx] : "";
        const montant        = parseFloat(String(montantBrut).replace(/\s/g,"").replace(",",".")) || 0;
        if (!designation && !numero_compte && !montant) continue;
        const montants = Object.fromEntries(colonnes.map(c => [c.id, ""]));
        if (colonnes.length > 0 && montant > 0) montants[colonnes[0].id] = montant.toString();
        lignes.push({ designation, numero_compte, montants });
      }
      callback(lignes, null);
    } catch (err) {
      callback(null, "Erreur lecture fichier : " + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

// ── Sidebar MenuItem ──────────────────────────────────────────────────────────
const MenuItem = ({ icon: Icon, label, href, active }) => (
  <Link href={href}
    className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
      active
        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
        : "text-slate-600 hover:bg-slate-100"
    }`}>
    <Icon className={`w-5 h-5 transition-all ${active ? "text-white" : "text-slate-400 group-hover:text-emerald-600"}`} />
    <span className="flex-1">{label}</span>
    {active && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
  </Link>
);

export default function App() {
  const pathname = usePathname();
  const [profile, setProfile] = useState(null);

  const [view, setView]     = useState("list");
  const [etats, setEtats]   = useState([]);
  const [selectedEtat, setSelectedEtat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]   = useState(null);
  const [importModal, setImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError]   = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  const [formData, setFormData] = useState({
    num_etat:"", gestion: new Date().getFullYear().toString(),
    section:"", num_mandat:"",
    date_doc: new Date().toISOString().split("T")[0], mois:"",
    mode_paiement:"CCP", categorie_personnel:"", etablissement:"",
  });
  const [colonnes, setColonnes] = useState([{ id:"base", label:"Net à Payer" }]);
  const [newColLabel, setNewColLabel] = useState("");
  const [lignes, setLignes] = useState([emptyLigne([{ id:"base" }])]);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setProfile(payload);
      }
    } catch (e) {}
  }, []);

  useEffect(() => { fetchEtats(); }, []);
  const fetchEtats = async () => {
    try {
      const r = await fetch(`${API}/etats`);
      if (r.ok) { const d=await r.json(); setEtats(d); setFormData(p=>({...p,num_etat:d.length+1})); }
    } catch(e) { console.error(e); }
  };

  // ── Colonnes ──────────────────────────────────────────────────────────────
  const ajouterColonne = () => {
    const label=newColLabel.trim(); if(!label)return;
    const id="col_"+Date.now(); const newCol={id,label};
    setColonnes(p=>[...p,newCol]);
    setLignes(p=>p.map(l=>({...l,montants:{...l.montants,[id]:""}})));
    setNewColLabel("");
  };
  const supprimerColonne = (colId) => {
    if(colonnes.length<=1)return;
    setColonnes(p=>p.filter(c=>c.id!==colId));
    setLignes(p=>p.map(l=>{const m={...l.montants};delete m[colId];return{...l,montants:m};}));
  };
  const ajouterLigne   = () => setLignes(p=>[...p,emptyLigne(colonnes)]);
  const supprimerLigne = (i) => setLignes(p=>p.filter((_,idx)=>idx!==i));
  const updateLigne    = (i,key,val) => setLignes(p=>{const c=[...p];c[i]={...c[i],[key]:val};return c;});
  const updateMontant  = (i,colId,val) => setLignes(p=>{const c=[...p];c[i]={...c[i],montants:{...c[i].montants,[colId]:val}};return c;});

  // ── Calculs ───────────────────────────────────────────────────────────────
  const totalLigne   = (l) => colonnes.reduce((s,c)=>s+(parseFloat(l.montants?.[c.id])||0),0);
  const totalColonne = (colId) => lignes.reduce((s,l)=>s+(parseFloat(l.montants?.[colId])||0),0);
  const totalGeneral = colonnes.reduce((s,c)=>s+totalColonne(c.id),0);

  // ── Import Excel ──────────────────────────────────────────────────────────
  const handleFileDrop = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xls","xlsx","csv"].includes(ext)) { setImportError("Format non supporté. Utilisez .xls, .xlsx ou .csv"); return; }
    setImportLoading(true); setImportError(""); setImportPreview(null);
    parseExcelFile(file, colonnes, (lignes, err) => {
      setImportLoading(false);
      if (err) { setImportError(err); return; }
      if (!lignes || lignes.length === 0) { setImportError("Aucune donnée trouvée dans le fichier."); return; }
      setImportPreview({ lignes, fileName: file.name });
    });
  };
  const handleFileChange = (e) => { if (e.target.files[0]) handleFileDrop(e.target.files[0]); };
  const confirmerImport = (mode) => {
    if (!importPreview) return;
    if (mode === "remplacer") setLignes(importPreview.lignes);
    else setLignes(p => [...p.filter(l=>l.designation||l.numero_compte||totalLigne(l)>0), ...importPreview.lignes]);
    setImportModal(false); setImportPreview(null); setImportError("");
    showToast(`✓ ${importPreview.lignes.length} bénéficiaire(s) importé(s)`);
  };

  // ── Enregistrer ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if(!formData.section||!formData.mois){showToast("Veuillez remplir Section et Mois","error");return;}
    setLoading(true);
    try {
      const method=selectedEtat?"PUT":"POST";
      const url=selectedEtat?`${API}/etats/${selectedEtat.id}`:`${API}/etats`;
      const r=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify({...formData,colonnes,lignes})});
      if(r.ok){showToast(selectedEtat?"Mis à jour ✓":"Enregistré ✓");fetchEtats();setView("list");resetForm();}
      else showToast("Erreur serveur","error");
    } catch{showToast("Erreur réseau","error");}
    finally{setLoading(false);}
  };

  const resetForm = () => {
    setSelectedEtat(null);
    setFormData({num_etat:"",gestion:new Date().getFullYear().toString(),section:"",num_mandat:"",date_doc:new Date().toISOString().split("T")[0],mois:"",mode_paiement:"CCP",categorie_personnel:"",etablissement:""});
    setColonnes([{id:"base",label:"Net à Payer"}]);
    setLignes([emptyLigne([{id:"base"}])]);
    setNewColLabel("");
  };

  const openEdit = async (e) => {
    setSelectedEtat(e);
    setFormData({num_etat:e.num_etat||e.id,gestion:e.gestion,section:e.section,num_mandat:e.num_mandat||"",date_doc:e.date_doc?.substring(0,10)||"",mois:e.mois,mode_paiement:e.mode_paiement||"CCP",categorie_personnel:e.categorie_personnel||"",etablissement:e.etablissement||""});
    const r=await fetch(`${API}/etats/${e.id}/lignes`);
    const ls=await r.json();
    const cols=e.colonnes||[{id:"base",label:"Net à Payer"}];
    setColonnes(cols); setLignes(ls.length?ls:[emptyLigne(cols)]); setView("form");
  };

  const deleteEtat = async (id) => {
    if(!confirm("Supprimer cet état ?"))return;
    await fetch(`${API}/etats/${id}`,{method:"DELETE"});
    showToast("Supprimé"); fetchEtats();
  };

  // ── Helpers UI ────────────────────────────────────────────────────────────
  const F = ({label,value,onChange,type="text",placeholder=""}) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">{label}</span>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white transition-all"/>
    </div>
  );
  const Sel = ({label,value,onChange,options}) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider">{label}</span>
      <select value={value} onChange={e=>onChange(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-emerald-500 bg-white">
        <option value="">--</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const OfficialHeader = () => (
    <div className="border-b-2 border-slate-800 pb-3 mb-5">
      <div className="text-center mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">République Algérienne Démocratique et Populaire</p>
        <p className="text-[9px] text-slate-600">Ministère de l'Enseignement Supérieur et de la Recherche Scientifique</p>
        <p className="text-[9px] font-bold text-slate-700">Université Mouloud Mammeri — Tizi-Ouzou</p>
        <p className="text-[9px] text-slate-600">Direction des Œuvres Sociales</p>
      </div>
      <div className="flex justify-between items-start gap-4 mt-3">
        <div className="flex gap-2 items-end flex-wrap">
          {[{l:"N° ÉTAT",v:formData.num_etat,big:true},{l:"GESTION",v:formData.gestion},{l:"SECTION",v:formData.section||"—",w:true},{l:"N° MANDAT",v:formData.num_mandat||"—"}].map(({l,v,big,w})=>(
            <div key={l} className={`border border-slate-400 px-2 py-1 text-center ${w?"min-w-[100px]":"min-w-[60px]"}`}>
              <div className="text-[7px] uppercase font-black text-slate-500">{l}</div>
              <div className={`font-black ${big?"text-lg text-emerald-800":"text-sm"}`}>{v}</div>
            </div>
          ))}
        </div>
        <div className="flex-1 text-center px-4">
          <h1 className="text-sm font-black uppercase tracking-wider text-slate-800 leading-snug">ÉTAT DE PAIEMENT<br/>DES PRESTATIONS ŒUVRES SOCIALES</h1>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-2">
            {[{l:"DATE",v:formData.date_doc?new Date(formData.date_doc).toLocaleDateString("fr-FR"):"—"},{l:"MOIS DE",v:formData.mois||"—"}].map(({l,v})=>(
              <div key={l} className="border border-slate-400 px-2 py-1 min-w-[100px] text-center">
                <div className="text-[7px] uppercase font-black text-slate-500">{l}</div>
                <div className="font-bold text-sm">{v}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="border border-slate-400 px-2 py-1 min-w-[100px] text-center">
              <div className="text-[7px] uppercase font-black text-slate-500">Mode Paiement</div>
              <div className="font-black text-[11px] text-blue-800 mt-0.5">{formData.mode_paiement||"—"}</div>
            </div>
            <div className="border border-slate-400 px-2 py-1 min-w-[100px] text-center">
              <div className="text-[7px] uppercase font-black text-slate-500">Catégorie</div>
              <div className="font-black text-[11px] text-slate-800 mt-0.5">{formData.categorie_personnel||"—"}</div>
            </div>
          </div>
          {formData.etablissement&&(
            <div className="border border-slate-400 px-2 py-1 w-full text-center">
              <div className="text-[7px] uppercase font-black text-slate-500">Établissement / Teneur des comptes</div>
              <div className="font-bold text-[11px] text-slate-800 mt-0.5">{formData.etablissement}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const displayRows = Math.max(lignes.length, 10);
  const emptyRowsCount = Math.max(0, displayRows - lignes.length);



  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      {/* ══ TOAST ══ */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl font-bold text-white shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200 ${toast.type==="error"?"bg-red-600":"bg-gradient-to-r from-emerald-600 to-teal-600"}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/>
          {toast.msg}
        </div>
      )}

      {/* ══ MODAL IMPORT EXCEL ══ */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-600 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-white font-black text-base uppercase tracking-wider">📥 Import Excel / CSV</h2>
                <p className="text-emerald-200 text-xs mt-0.5">Les colonnes Nom, N° Compte et Montant sont détectées automatiquement</p>
              </div>
              <button onClick={()=>{setImportModal(false);setImportPreview(null);setImportError("");}} className="text-white/70 hover:text-white text-2xl font-black transition-colors">✕</button>
            </div>
            <div className="p-6">
              {!importPreview && (
                <div
                  onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                  onDragLeave={()=>setDragOver(false)}
                  onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f)handleFileDrop(f);}}
                  onClick={()=>fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver?"border-emerald-500 bg-emerald-50":"border-slate-200 hover:border-emerald-400 hover:bg-slate-50"}`}
                >
                  <input ref={fileInputRef} type="file" accept=".xls,.xlsx,.csv" onChange={handleFileChange} className="hidden"/>
                  {importLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"/>
                      <p className="text-sm text-slate-500 font-medium">Analyse du fichier en cours…</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-5xl mb-3">📂</div>
                      <p className="font-black text-slate-700 text-sm">Glissez votre fichier ici ou cliquez pour choisir</p>
                      <p className="text-xs text-slate-400 mt-2">Formats acceptés : .xls · .xlsx · .csv</p>
                      <div className="mt-4 flex justify-center gap-3 text-[10px] text-slate-400 flex-wrap">
                        {["Nom Prénom","N° Compte","CLE","MONTANT"].map(c=>(
                          <span key={c} className="bg-slate-100 px-2 py-1 rounded font-mono">{c}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              {importError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium flex items-start gap-2 mt-4">
                  <span>⚠️</span><span>{importError}</span>
                </div>
              )}
              {importPreview && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex-1">
                      <p className="text-xs font-black text-emerald-800">✓ Fichier lu avec succès</p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">{importPreview.fileName} — <strong>{importPreview.lignes.length}</strong> bénéficiaires trouvés</p>
                    </div>
                    <button onClick={()=>{setImportPreview(null);setImportError("");}} className="text-slate-400 hover:text-slate-600 text-xs underline">Changer</button>
                  </div>
                  <div className="border border-slate-100 rounded-xl overflow-hidden mb-5">
                    <div className="bg-slate-50 px-3 py-2 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Aperçu — {Math.min(5,importPreview.lignes.length)} premières lignes sur {importPreview.lignes.length}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                            <th className="px-3 py-2 text-left font-black">N°</th>
                            <th className="px-3 py-2 text-left font-black">Désignation</th>
                            <th className="px-3 py-2 text-left font-black">N° Compte</th>
                            {colonnes.map(c=><th key={c.id} className="px-3 py-2 text-right font-black">{c.label}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.lignes.slice(0,5).map((l,i)=>(
                            <tr key={i} className={i%2===0?"bg-white":"bg-slate-50/50"}>
                              <td className="px-3 py-1.5 text-slate-400 font-bold">{i+1}</td>
                              <td className="px-3 py-1.5 font-medium text-slate-800">{l.designation||<span className="text-slate-300 italic">—</span>}</td>
                              <td className="px-3 py-1.5 font-mono text-slate-600">{l.numero_compte||<span className="text-slate-300 italic">—</span>}</td>
                              {colonnes.map(c=>(
                                <td key={c.id} className="px-3 py-1.5 text-right font-bold text-emerald-700">
                                  {parseFloat(l.montants?.[c.id]||0)>0?Number(l.montants[c.id]).toLocaleString("fr-DZ",{minimumFractionDigits:2}):<span className="text-slate-300">—</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {importPreview.lignes.length > 5 && (
                            <tr><td colSpan={3+colonnes.length} className="px-3 py-2 text-center text-[10px] text-slate-400">… et {importPreview.lignes.length-5} autre(s)</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {importPreview.lignes.every(l=>!parseFloat(l.montants?.[colonnes[0]?.id]||0)) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-medium mb-4 flex gap-2">
                      <span>⚠️</span><span>Colonne montant non trouvée. Les montants devront être saisis manuellement.</span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={()=>confirmerImport("remplacer")}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-black text-sm hover:opacity-90 transition-all shadow-lg active:scale-95">
                      🔄 Remplacer les lignes existantes
                    </button>
                    <button onClick={()=>confirmerImport("ajouter")}
                      className="flex-1 bg-slate-100 text-slate-700 border border-slate-200 py-3 rounded-xl font-black text-sm hover:bg-slate-200 transition-all active:scale-95">
                      ➕ Ajouter aux lignes existantes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* ══ MAIN ══ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── NAVBAR ── */}
        <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-3 flex items-center justify-between print:hidden">
          {/* Gauche */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">État de Paiement</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              <CalendarIcon className="w-3.5 h-3.5"/>
              <span>{new Date().toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</span>
            </div>
          </div>

          {/* Actions contextuelles + profil */}
          <div className="flex items-center gap-3">
            {view==="form" && (
              <>
                <button onClick={()=>setImportModal(true)}
                  className="bg-amber-400 text-amber-900 px-4 py-2 rounded-xl text-sm font-black hover:bg-amber-300 transition-all shadow-sm flex items-center gap-2">
                  📥 Importer Excel
                </button>
                <button onClick={()=>window.print()}
                  className="bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">
                  🖨 Imprimer
                </button>
              </>
            )}
            <button onClick={()=>{if(view!=="list"){setView("list");resetForm();}else setView("form");}}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2 rounded-xl font-bold hover:opacity-90 transition-all shadow-md text-sm">
              {view==="list"?"+ Créer État":"← Retour Liste"}
            </button>

            {/* Bell */}
            <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
              <BellIcon className="w-5 h-5 text-slate-500"/>
            </button>

            {/* Profile */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-700">{profile?.nom} {profile?.prenom}</p>
                <p className="text-[9px] text-slate-400">{profile?.email || "Cellule Info"}</p>
              </div>
              <Link href="/profile"
                className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md hover:scale-105 transition">
                <span className="text-white text-sm font-bold">
                  {profile ? `${profile.nom?.[0]||""}${profile.prenom?.[0]||""}` : "AU"}
                </span>
              </Link>
            </div>
          </div>
        </nav>

        {/* ── CONTENT ── */}
        <main className="flex-1 px-8 py-8 print:p-0">

          {/* ══ VUE FORMULAIRE ══ */}
          {view==="form" && (
            <div className="space-y-5">

              {/* En-tête page */}
              <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-100 print:hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-transparent"></div>
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] opacity-10"></div>
                <div className="relative z-10 p-6 flex items-center justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full uppercase tracking-widest mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      Nouveau document
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">État de Paiement <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">#{formData.num_etat}</span></h1>
                    <p className="text-slate-400 text-sm mt-1">Prestations Œuvres Sociales — Gestion {formData.gestion}</p>
                  </div>
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl px-6 py-3 text-center shadow-lg">
                    <p className="text-[9px] uppercase font-black text-emerald-300 tracking-wider">Total</p>
                    <p className="text-2xl font-black text-white mt-1">{Number(totalGeneral).toLocaleString("fr-DZ",{minimumFractionDigits:2})} DA</p>
                  </div>
                </div>
              </div>

              {/* Infos de l'état */}
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-6 print:hidden">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Informations de l'État</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <F label="N° État"   value={formData.num_etat}   onChange={v=>setFormData({...formData,num_etat:v})}/>
                  <F label="Gestion"   value={formData.gestion}    onChange={v=>setFormData({...formData,gestion:v})}/>
                  <F label="Section"   value={formData.section}    onChange={v=>setFormData({...formData,section:v})}    placeholder="Ex: EM/A"/>
                  <F label="N° Mandat" value={formData.num_mandat} onChange={v=>setFormData({...formData,num_mandat:v})}/>
                  <F label="Date" type="date" value={formData.date_doc} onChange={v=>setFormData({...formData,date_doc:v})}/>
                  <Sel label="Mois"    value={formData.mois}       onChange={v=>setFormData({...formData,mois:v})}       options={MOIS_OPTIONS}/>
                </div>
                <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-blue-700 uppercase tracking-wider">Mode de Paiement</span>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {MODE_PAIEMENT_OPTIONS.map(opt=>(
                        <button key={opt} type="button" onClick={()=>setFormData({...formData,mode_paiement:opt})}
                          className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${formData.mode_paiement===opt?"bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-md":"bg-white text-slate-600 border-slate-200 hover:border-blue-400"}`}>
                          📮 {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-purple-700 uppercase tracking-wider">Catégorie de Personnel</span>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {CATEGORIE_OPTIONS.map(opt=>(
                        <button key={opt} type="button" onClick={()=>setFormData({...formData,categorie_personnel:opt})}
                          className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${formData.categorie_personnel===opt?"bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-600 shadow-md":"bg-white text-slate-600 border-slate-200 hover:border-purple-400"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <F label="Établissement / Teneur des comptes" value={formData.etablissement} onChange={v=>setFormData({...formData,etablissement:v})} placeholder="Ex: CPA, BNA, Algérie Poste…"/>
                </div>
              </div>

              {/* Colonnes */}
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-100 p-6 print:hidden">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Colonnes de Montants</h3>
                  </div>
                  <button onClick={()=>setImportModal(true)}
                    className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl text-xs font-black hover:bg-amber-100 transition-all shrink-0">
                    📥 Importer un fichier Excel
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {colonnes.map(c=>(
                    <div key={c.id} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                      <span className="text-xs font-bold text-emerald-800">{c.label}</span>
                      {colonnes.length>1&&<button onClick={()=>supprimerColonne(c.id)} className="text-red-400 hover:text-red-600 text-xs font-black transition-all leading-none">✕</button>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 max-w-md">
                  <input value={newColLabel} onChange={e=>setNewColLabel(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ajouterColonne()}
                    placeholder="Ex: Mariage, Naissance, Scolarité…"
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/>
                  <button onClick={ajouterColonne} className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all whitespace-nowrap shadow-md">+ Ajouter</button>
                </div>
              </div>

              {/* ── DOCUMENT OFFICIEL ── */}
              <div className="bg-white shadow-xl shadow-slate-100 border border-slate-100 rounded-2xl p-6 print:shadow-none print:border-none print:rounded-none print:p-4" style={{fontFamily:"'Times New Roman', serif"}}>
                <OfficialHeader/>

                <div className="flex items-center justify-between mb-2 print:hidden">
                  <span className="text-xs text-slate-400 font-medium">
                    <span className="font-black text-emerald-600">{lignes.filter(l=>l.designation||l.numero_compte||totalLigne(l)>0).length}</span> bénéficiaire(s) ·
                    <span className="font-black text-slate-600 ml-1">{lignes.length}</span> ligne(s) — <span className="text-slate-300">illimité</span>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[10px]" style={{borderSpacing:0}}>
                    <thead>
                      <tr>
                        <th className="border-2 border-slate-500 px-1 py-2 text-center font-black bg-slate-100 w-8 text-[9px]">N°</th>
                        <th className="border-2 border-slate-500 px-2 py-2 text-center font-black bg-slate-100 min-w-[200px] text-[10px]">DÉSIGNATION DU BÉNÉFICIAIRE</th>
                        <th className="border-2 border-slate-500 px-2 py-2 text-center font-black bg-slate-100 w-32 text-[10px]">
                          N° COMPTE<br/><span className="text-[8px] font-normal normal-case text-slate-500">{formData.mode_paiement==="CCP"?"(CCP)":formData.mode_paiement?`(${formData.mode_paiement})`:""}</span>
                        </th>
                        {colonnes.map(c=>(
                          <th key={c.id} className="border-2 border-slate-500 px-2 py-2 text-center font-black bg-emerald-50 min-w-[110px] text-[10px] uppercase">{c.label}</th>
                        ))}
                        <th className="border-2 border-slate-500 px-2 py-2 text-center font-black bg-slate-200 w-32 text-[10px]">TOTAL LIGNE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lignes.map((l,i)=>{
                        const tl=totalLigne(l);
                        return (
                          <tr key={i} className={i%2===0?"bg-white":"bg-slate-50/40"}>
                            <td className="border border-slate-400 px-1 py-1 text-center font-bold text-slate-400 text-[9px]">{i+1}</td>
                            <td className="border border-slate-400 p-0.5">
                              <input value={l.designation} onChange={e=>updateLigne(i,"designation",e.target.value)}
                                className="w-full px-2 py-1 text-[10px] font-medium outline-none focus:bg-emerald-50 rounded transition-all" placeholder="Nom et Prénom"/>
                            </td>
                            <td className="border border-slate-400 p-0.5">
                              <input value={l.numero_compte} onChange={e=>updateLigne(i,"numero_compte",e.target.value)}
                                className="w-full px-1 py-1 text-[9px] font-mono outline-none focus:bg-emerald-50 rounded transition-all text-center"
                                placeholder={formData.mode_paiement==="CCP"?"N° CCP":"N° Compte"}/>
                            </td>
                            {colonnes.map(c=>(
                              <td key={c.id} className="border border-slate-400 p-0.5">
                                <input type="number" value={l.montants?.[c.id]||""} onChange={e=>updateMontant(i,c.id,e.target.value)}
                                  className="w-full px-1 py-1 text-[10px] font-bold text-right text-emerald-800 outline-none focus:bg-emerald-50 rounded transition-all" placeholder="0"/>
                              </td>
                            ))}
                            <td className="border border-slate-400 px-2 py-1 text-right font-black text-[11px] text-slate-800 bg-slate-50">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-black text-emerald-700">{tl>0?Number(tl).toLocaleString("fr-DZ",{minimumFractionDigits:2}):"—"}</span>
                                {lignes.length>1&&<button onClick={()=>supprimerLigne(i)} className="print:hidden text-red-300 hover:text-red-500 text-[10px] font-black flex-shrink-0 transition-all">✕</button>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {Array.from({length:emptyRowsCount}).map((_,idx)=>{
                        const n=lignes.length+idx;
                        return (
                          <tr key={`empty-${n}`}>
                            <td className="border border-slate-300 py-1 text-center text-slate-300 text-[9px]">{n+1}</td>
                            <td className="border border-slate-300 p-0.5"><input className="w-full px-2 py-1 text-[10px] outline-none bg-transparent" placeholder="…"/></td>
                            <td className="border border-slate-300 p-0.5"><input className="w-full px-1 py-1 text-[9px] outline-none bg-transparent text-center"/></td>
                            {colonnes.map(c=><td key={`e-${c.id}`} className="border border-slate-300 p-0.5"><input className="w-full px-1 py-1 text-[10px] outline-none bg-transparent"/></td>)}
                            <td className="border border-slate-300 bg-slate-50/30"/>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-200">
                        <td colSpan={3} className="border-2 border-slate-500 px-3 py-2 text-right font-black text-[11px] uppercase tracking-wider text-slate-700">Total par prestation :</td>
                        {colonnes.map(c=>(
                          <td key={c.id} className="border-2 border-slate-500 px-2 py-2 text-right font-black text-[11px] text-emerald-800 bg-emerald-50">
                            {Number(totalColonne(c.id)).toLocaleString("fr-DZ",{minimumFractionDigits:2})}
                          </td>
                        ))}
                        <td className="border-2 border-slate-500 px-2 py-2 text-right font-black text-[12px] text-slate-900 bg-slate-300">
                          {Number(totalGeneral).toLocaleString("fr-DZ",{minimumFractionDigits:2})}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 border-2 border-slate-400 rounded p-4 bg-slate-50/50">
                  <p className="text-[11px] font-black uppercase text-slate-700 mb-2 tracking-wide">Arrêté le présent état à la somme de :</p>
                  <p className="text-[13px] font-black text-emerald-900 leading-snug capitalize" style={{fontFamily:"'Times New Roman', serif"}}>
                    {totalGeneral>0?nombreLettres(totalGeneral):<span className="text-slate-300 font-normal italic text-[11px]">La somme apparaîtra ici en toutes lettres…</span>}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-300 flex justify-between text-[9px] text-slate-500 font-bold uppercase flex-wrap gap-2">
                    <span>{lignes.filter(l=>totalLigne(l)>0).length} bénéficiaire(s)</span>
                    <span>{colonnes.length} prestation(s) : {colonnes.map(c=>c.label).join(" + ")}</span>
                    {formData.mode_paiement&&<span>Paiement par : {formData.mode_paiement}</span>}
                    {formData.categorie_personnel&&<span>Catégorie : {formData.categorie_personnel}</span>}
                    <span>Total général : {fmt(totalGeneral)}</span>
                  </div>
                </div>

                <div className="flex justify-between mt-8 gap-8">
                  {["Le president de la structure de gestion","Le comptable de la structure de gestion"].map(s=>(
                    <div key={s} className="flex-1 text-center border-t-2 border-slate-400 pt-2">
                      <p className="text-[9px] font-black uppercase text-slate-500">{s}</p>
                      <div className="h-16"/>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center py-4 print:hidden">
                <button onClick={ajouterLigne} className="bg-white text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all shadow-sm">
                  + Ajouter une ligne
                </button>
                <div className="flex gap-3">
                  <button onClick={()=>{setView("list");resetForm();}} className="bg-white text-slate-600 border border-slate-200 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">Annuler</button>
                  <button onClick={handleSubmit} disabled={loading}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-10 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:opacity-90 shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all active:scale-95">
                    {loading?"Enregistrement...":selectedEtat?"Mettre à jour":`Valider l'État #${formData.num_etat}`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ VUE LISTE ══ */}
          {view==="list" && (
            <div className="space-y-6">
              {/* Header liste */}
              <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-transparent"></div>
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] opacity-10"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full uppercase tracking-widest mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      Dashboard
                    </div>
                    <h1 className="text-3xl font-black text-slate-800">États de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Paiement</span></h1>
                    <p className="text-slate-400 text-sm mt-1">Exercice {new Date().getFullYear()}</p>
                  </div>
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl px-6 py-3 text-center shadow-lg">
                    <p className="text-[9px] uppercase font-black text-emerald-300 tracking-wider">Total états</p>
                    <p className="text-4xl font-black text-white mt-1">{etats.length}</p>
                  </div>
                </div>
              </div>

              {/* Table */}
              {etats.length===0?(
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center shadow-sm">
                  <div className="text-5xl mb-4 opacity-20">📂</div>
                  <p className="text-slate-400 font-medium">Aucun état créé.</p>
                  <button onClick={()=>setView("form")} className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg text-sm">
                    Créer le premier état
                  </button>
                </div>
              ):(
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-800 to-slate-700 text-white text-[10px] uppercase tracking-wider">
                        {["N° État","Gestion","Section","Mois","Mode","Catégorie","Date","Actions"].map(h=>(
                          <th key={h} className="px-5 py-4 text-left font-black">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {etats.map((e,i)=>(
                        <tr key={e.id} className={`hover:bg-emerald-50/30 transition-colors ${i%2===0?"bg-white":"bg-slate-50/30"}`}>
                          <td className="px-5 py-3 font-black text-emerald-700">#{e.num_etat||e.id}</td>
                          <td className="px-5 py-3 font-medium text-slate-700">{e.gestion}</td>
                          <td className="px-5 py-3 font-medium text-slate-700">{e.section}</td>
                          <td className="px-5 py-3 text-slate-600">{e.mois}</td>
                          <td className="px-5 py-3">{e.mode_paiement&&<span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-[10px] font-black">📮 {e.mode_paiement}</span>}</td>
                          <td className="px-5 py-3">{e.categorie_personnel&&<span className="bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full text-[10px] font-black">{e.categorie_personnel}</span>}</td>
                          <td className="px-5 py-3 text-slate-400 text-xs">{e.date_doc?.substring(0,10)}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <button onClick={()=>openEdit(e)} className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all">✏️ Éditer</button>
                              <button onClick={()=>deleteEtat(e.id)} className="bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-100 transition-all">🗑 Supprimer</button>
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

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-100 py-4 bg-white print:hidden">
          <p className="text-slate-300 text-[10px] tracking-widest uppercase font-medium text-center">
            © 2026 SG/COS-UMMTO • Université Mouloud Mammeri Tizi-Ouzou
          </p>
        </footer>
      </div>

      <style>{`
        @media print {
          aside, nav, footer, .print\\:hidden { display: none !important; }
          body { background: white; }
          input, select { border: none !important; background: transparent !important; box-shadow: none !important; }
          input::placeholder { color: transparent; }
          th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}