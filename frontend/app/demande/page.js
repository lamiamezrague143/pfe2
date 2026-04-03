"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  Send, Clock, CheckCircle, XCircle, MessageSquare,
  FileText, Upload, X, Paperclip, Eye, User, RefreshCw
} from "lucide-react";

const API_BASE          = "http://localhost:5001/api";
const SOCKET_SERVER_URL = "http://localhost:5001";
const CURRENT_USER_ID   = 1; // ← Remplace par l'ID depuis ton Auth

// ─── BADGE STATUT ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    "En attente": "bg-amber-100 text-amber-700 border-amber-300",
    "Validée":    "bg-emerald-100 text-emerald-700 border-emerald-300",
    "Rejetée":    "bg-red-100 text-red-700 border-red-300",
  };
  const icons = {
    "En attente": <Clock size={12} />,
    "Validée":    <CheckCircle size={12} />,
    "Rejetée":    <XCircle size={12} />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {icons[status]} {status}
    </span>
  );
}

// ─── CHAMP FORMULAIRE ─────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-start gap-4 py-4 border-b border-gray-100 last:border-0">
      <label className="text-sm text-gray-600 pt-2.5 leading-tight">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div>{children}</div>
    </div>
  );
}

const inputCls  = "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition placeholder-gray-400 bg-white";
const selectCls = `${inputCls} cursor-pointer`;

// ─── ZONE UPLOAD ──────────────────────────────────────────────────────────────
function FileUploadZone({ files, onChange }) {
  const inputRef = useRef(null);
  const handleDrop = (e) => { e.preventDefault(); onChange([...files, ...Array.from(e.dataTransfer.files)]); };
  const handleAdd  = (e) => { onChange([...files, ...Array.from(e.target.files)]); e.target.value = ""; };
  const removeFile = (i) => onChange(files.filter((_, idx) => idx !== i));
  const getIcon    = (f) => f.type.startsWith("image/") ? "🖼️" : f.type === "application/pdf" ? "📄" : "📎";
  const fmtSize    = (b) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

  return (
    <div className="space-y-2">
      <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center cursor-pointer hover:border-green-500 hover:bg-green-50/30 transition-all group">
        <Upload size={22} className="mx-auto mb-2 text-gray-400 group-hover:text-green-600 transition-colors" />
        <p className="text-sm text-gray-500 group-hover:text-green-700 font-medium">
          Glissez vos fichiers ici ou <span className="text-green-700 font-bold underline">cliquez pour parcourir</span>
        </p>
        <p className="text-[11px] text-gray-400 mt-1">PDF, JPG, PNG</p>
        <input ref={inputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleAdd} className="hidden" />
      </div>
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-base shrink-0">{getIcon(file)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{file.name}</p>
                <p className="text-[10px] text-gray-400">{fmtSize(file.size)}</p>
              </div>
              <button type="button" onClick={() => removeFile(i)} className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                <X size={13} />
              </button>
            </div>
          ))}
          <p className="text-[11px] text-gray-400 text-right">{files.length} fichier{files.length > 1 ? "s" : ""} sélectionné{files.length > 1 ? "s" : ""}</p>
        </div>
      )}
    </div>
  );
}

// ─── MODAL PIÈCES ─────────────────────────────────────────────────────────────
function PiecesModal({ pieces, onClose }) {
  if (!pieces?.length) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-sm">Pièces jointes ({pieces.length})</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-400"><X size={14} /></button>
        </div>
        <div className="space-y-2">
          {pieces.map((p, i) => (
            <div key={i}>
              {p?.type?.includes("image")
                ? <img src={p.data} alt={p.nom} className="w-full rounded-lg object-cover max-h-48" />
                : <a href={p?.data || "#"} download={p?.nom || "document"} className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition">
                    <Paperclip size={13} /> {p?.nom || "Fichier sans nom"}
                  </a>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CHAT PANEL ───────────────────────────────────────────────────────────────
// ✅ FIX 1 : "export default" retiré ici — un seul export default par fichier
function ChatPanel({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  const currentUserId = user?.id; // ⚠️ important

  // 🔌 Connexion socket + historique
  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL, {
      withCredentials: true,
    });

    // 📩 Réception des messages
    socketRef.current.on("receive_message", (data) => {
      console.log("Message reçu:", data);

      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    });

    // 📜 Charger historique
    fetch(`${SOCKET_SERVER_URL}/api/messages`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Erreur historique:", err))
      .finally(() => setLoading(false));

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // 📜 Scroll automatique
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 📤 Envoyer message
  const sendMessage = () => {
    if (!input.trim() || !socketRef.current || !currentUserId) return;

    const messageData = {
      senderId: currentUserId,
      receiverId: 2, // ⚠️ à adapter
      content: input,
    };

    socketRef.current.emit("send_message", messageData);

    setMessages((prev) => [...prev, messageData]); // affichage immédiat

    setInput("");
  };

  // ⏰ format heure
  const formatTime = (ts) =>
    ts
      ? new Date(ts).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 bg-green-700 text-white flex items-center gap-3">
        <MessageSquare size={20} />
        <div>
          <h2 className="font-bold text-sm">Assistance COS UMMTO</h2>
          <p className="text-[10px] text-green-100 italic">Réponse en temps réel</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
          En ligne
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Message de bienvenue si vide */}
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]">
                  <p className="text-sm text-gray-700">Bonjour ! Comment pouvons-nous vous aider aujourd'hui ?</p>
                  <span className="text-[9px] text-gray-400 mt-1 block">Support</span>
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              // ✅ FIX : comparison correcte (les deux en Number)
              const isMine = Number(msg.senderId) === Number(currentUserId);
              return (
                <div key={msg.id || i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  {/* Avatar admin */}
                  {!isMine && (
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center mr-2 shrink-0 self-end">
                      <User size={13} className="text-green-700" />
                    </div>
                  )}
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    isMine
                      ? "bg-green-700 text-white rounded-tr-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                  }`}>
                    <p className="leading-relaxed">{msg.content}</p>
                    <span className={`text-[9px] mt-1 block ${isMine ? "text-green-200 text-right" : "text-gray-400"}`}>
                      {isMine ? "Vous" : "Support"} · {formatTime(msg.createdAt || msg.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Écrivez votre message..."
          className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-600"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-10 h-10 bg-green-700 text-white rounded-full flex items-center justify-center hover:bg-green-800 transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function DemandePage() {
  const [activeTab, setActiveTab]           = useState("form");
  const [demandes, setDemandes]             = useState([]);
  const [fetchLoading, setFetchLoading]     = useState(false);
  const [submitLoading, setSubmitLoading]   = useState(false);
  const [submitMsg, setSubmitMsg]           = useState({ text: "", type: "" });
  const [selectedPieces, setSelectedPieces] = useState(null);
  const [captchaSvg, setCaptchaSvg]         = useState("");
  const [userCaptcha, setUserCaptcha]       = useState("");
  const [prenom, setPrenom]                 = useState("");
  const [nom, setNom]                       = useState("");
  const [sexe, setSexe]                     = useState("");
  const [telephone, setTelephone]           = useState("");
  const [dateNaiss, setDateNaiss]           = useState("");
  const [fonction, setFonction]             = useState("");
  const [prestation, setPrestation]         = useState("");
  const [fichiers, setFichiers]             = useState([]);

  const refreshCaptcha = async () => {
    try {
      const res = await fetch(`${API_BASE}/captcha`);
      if (!res.ok) throw new Error();
      setCaptchaSvg(await res.text());
    } catch { console.error("Captcha indisponible"); }
  };

  useEffect(() => { refreshCaptcha(); }, []);

  const resetForm = () => {
    setPrenom(""); setNom(""); setSexe(""); setTelephone("");
    setDateNaiss(""); setFonction(""); setPrestation(""); setFichiers([]);
    setUserCaptcha(""); setSubmitMsg({ text: "", type: "" });
  };

  const fetchDemandes = async () => {
    setFetchLoading(true);
    try { const r = await axios.get(`${API_BASE}/demandes`); setDemandes(r.data); }
    catch (e) { console.error(e); }
    finally { setFetchLoading(false); }
  };

  useEffect(() => { if (activeTab === "list") fetchDemandes(); }, [activeTab]);

  const handleSubmit = async () => {
    if (!prenom.trim() || !nom.trim() || !prestation || fichiers.length === 0) {
      setSubmitMsg({ text: "⚠️ Remplis tous les champs obligatoires et ajoute au moins un fichier.", type: "error" });
      return;
    }
    setSubmitLoading(true);
    const fd = new FormData();
    fd.append("nom_beneficiaire", `${prenom} ${nom}`);
    fd.append("type_prestation", prestation);
    fd.append("fonction", fonction || "Personnel");
    fd.append("sexe", sexe);
    fd.append("telephone", telephone);
    fd.append("date_naissance", dateNaiss);
    fd.append("captcha", userCaptcha);
    fichiers.forEach((f) => fd.append("pieces", f));
    try {
      await axios.post(`${API_BASE}/demandes/ajouter`, fd);
      setSubmitMsg({ text: "✅ Dossier envoyé avec succès !", type: "success" });
      resetForm(); refreshCaptcha();
    } catch (err) {
      setSubmitMsg({ text: err.response?.data?.message || "Erreur serveur.", type: "error" });
      refreshCaptcha();
    } finally { setSubmitLoading(false); }
  };

  const nbEnAttente = demandes.filter((d) => d.statut === "En attente").length;
  const nbValidees  = demandes.filter((d) => d.statut === "Validée").length;
  const nbRejetees  = demandes.filter((d) => d.statut === "Rejetée").length;

  const tabs = [
    { key: "form",   label: "Formulaire" },
    { key: "list",   label: "Mes Demandes", badge: nbEnAttente },
    { key: "chat",   label: "Messagerie" },
    { key: "profil", label: "Profil" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center shadow-sm">
              <FileText size={16} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-black text-gray-800 tracking-tight">Prise en Charge</p>
              <p className="text-[10px] text-gray-400 font-medium -mt-0.5">COS UMMTO</p>
            </div>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            {tabs.map(({ key, label, badge }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                  activeTab === key ? "bg-green-700 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                }`}>
                {label}
                {badge > 0 && <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeTab === key ? "bg-white/30 text-white" : "bg-red-500 text-white"}`}>{badge}</span>}
              </button>
            ))}
          </nav>
          <button onClick={() => setActiveTab("profil")}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border-2 ${
              activeTab === "profil" ? "bg-green-700 border-green-700 text-white" : "bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200"
            }`}>
            <User size={16} />
          </button>
        </div>
      </header>

      <div className="pt-14" />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Mobile nav */}
        <div className="flex sm:hidden gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map(({ key, label, badge }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all -mb-px whitespace-nowrap ${
                activeTab === key ? "border-green-700 text-green-700" : "border-transparent text-gray-500"
              }`}>
              {label}
              {badge > 0 && <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{badge}</span>}
            </button>
          ))}
        </div>

        {/* ── FORMULAIRE ── */}
        {activeTab === "form" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 pt-8 pb-4 border-b border-gray-100">
              <h1 className="text-xl font-bold text-gray-800">Formulaire de Demande de Prise en Charge</h1>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">Un responsable examinera votre dossier dans les meilleurs délais.</p>
            </div>
            <div className="px-8 py-2">
              <Field label="Nom du Bénéficiaire" required>
                <div className="flex gap-2">
                  <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" className={inputCls} />
                  <input type="text" value={nom}    onChange={(e) => setNom(e.target.value)}    placeholder="Nom"    className={inputCls} />
                </div>
              </Field>
              <Field label="Sexe">
                <select value={sexe} onChange={(e) => setSexe(e.target.value)} className={selectCls}>
                  <option value="">*Sélectionner*</option>
                  <option>Masculin</option><option>Féminin</option>
                </select>
              </Field>
              <Field label="Téléphone" required>
                <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="### ### ####" className={inputCls} />
              </Field>
              <Field label="Date de Naissance" required>
                <input type="date" value={dateNaiss} onChange={(e) => setDateNaiss(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Fonction">
                <select value={fonction} onChange={(e) => setFonction(e.target.value)} className={selectCls}>
                  <option value="">*Sélectionner*</option>
                  <option>ATS</option><option>ENSEIGNANT</option><option>RETRAITE</option>
                </select>
              </Field>
              <Field label="Type de Prestation" required>
                <select value={prestation} onChange={(e) => setPrestation(e.target.value)} className={selectCls}>
                  <option value="">*Sélectionner*</option>
                  <option>Intervention Chirurgicale</option>
                  <option>Analyses Médicales</option>
                  <option>Radiologie</option>
                  <option>Soins Dentaire</option>
                  <option>Soins Ophtalmologiques</option>
                  <option>Circoncision</option>
                </select>
              </Field>
              <Field label="Documents Justificatifs" required>
                <FileUploadZone files={fichiers} onChange={setFichiers} />
                <p className="text-[11px] text-gray-400 mt-2">Ordonnance, résultats d'analyses, devis, etc.</p>
              </Field>
            </div>

            {/* Captcha */}
            <div className="mx-8 mb-4 p-4 border border-gray-100 bg-gray-50/50 rounded-xl">
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-3">Vérification de sécurité</label>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="bg-white p-2 rounded border shadow-sm cursor-pointer select-none"
                  dangerouslySetInnerHTML={{ __html: captchaSvg }} onClick={refreshCaptcha} title="Cliquer pour changer" />
                <div className="flex-1 w-full space-y-1">
                  <input type="text" placeholder="Entrez le code ci-contre" className={inputCls}
                    value={userCaptcha} onChange={(e) => setUserCaptcha(e.target.value)} />
                  <p className="text-[10px] text-gray-400">Cliquez sur l'image pour en générer un nouveau.</p>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
              {submitMsg.text && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-medium border ${
                  submitMsg.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                }`}>{submitMsg.text}</div>
              )}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={resetForm} className="px-6 py-2.5 text-sm font-semibold text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition">Réinitialiser</button>
                <button type="button" onClick={handleSubmit} disabled={submitLoading}
                  className="flex items-center gap-2 px-7 py-2.5 text-sm font-bold bg-green-700 text-white rounded hover:bg-green-800 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm">
                  {submitLoading
                    ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Envoi...</>
                    : <><Send size={15} /> Soumettre le Dossier</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── LISTE DES DEMANDES ── */}
        {activeTab === "list" && (
          <div>
            {demandes.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "En attente", val: nbEnAttente, cls: "text-amber-600 border-amber-200" },
                  { label: "Validées",   val: nbValidees,  cls: "text-emerald-600 border-emerald-200" },
                  { label: "Refusées",   val: nbRejetees,  cls: "text-red-600 border-red-200" },
                ].map(({ label, val, cls }) => (
                  <div key={label} className={`bg-white rounded-lg p-4 text-center shadow-sm border ${cls}`}>
                    <p className={`text-2xl font-black ${cls.split(" ")[0]}`}>{val}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800">Suivi de mes dossiers</h2>
              <button onClick={fetchDemandes} className="flex items-center gap-1 text-xs text-green-700 font-bold hover:underline">
                <RefreshCw size={12} /> Actualiser
              </button>
            </div>
            {fetchLoading ? (
              <div className="text-center py-20 text-gray-400">
                <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-3" />
                Chargement...
              </div>
            ) : demandes.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-16 text-gray-400">
                <FileText size={36} className="mx-auto mb-3 text-gray-200" />
                <p className="font-medium text-sm">Aucune demande soumise pour le moment.</p>
                <button onClick={() => setActiveTab("form")} className="mt-3 text-green-700 text-sm font-bold underline">Soumettre un dossier →</button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {["#","Bénéficiaire / Type","Décision","Pièces","État","Motif"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-black text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {demandes.map((d) => {
                        const pieces    = d.piecesJointes || [];
                        const isValidee = d.statut === "Validée";
                        const isRejetee = d.statut === "Rejetée";
                        return (
                          <tr key={d.id} className={`hover:bg-gray-50 transition ${isValidee ? "border-l-4 border-l-emerald-400" : isRejetee ? "border-l-4 border-l-red-400" : "border-l-4 border-l-amber-400"}`}>
                            <td className="px-4 py-3 text-[11px] text-gray-400 font-bold">#{d.id}</td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-800">{d.nom_beneficiaire}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{d.type_prestation}</p>
                              <p className="text-[10px] text-gray-300 mt-0.5">{new Date(d.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</p>
                            </td>
                            <td className="px-4 py-3 max-w-[180px]">
                              {(isValidee || isRejetee) ? (
                                <div className={`text-xs rounded-lg px-3 py-2 ${isValidee ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                                  <p className="font-bold mb-0.5">{isValidee ? "✅ Acceptée" : "❌ Refusée"}</p>
                                  <p className="text-[11px] leading-snug">{d.message_admin || (isValidee ? "Rapprochez-vous de la structure." : "Contactez la structure pour plus d'infos.")}</p>
                                </div>
                              ) : <span className="text-xs text-gray-400 italic">En cours d'examen…</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {pieces.length > 0
                                ? <button onClick={() => setSelectedPieces(pieces)} className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition">
                                    <Eye size={12} /> {pieces.length} fichier{pieces.length > 1 ? "s" : ""}
                                  </button>
                                : <span className="text-xs text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-3 text-center"><StatusBadge status={d.statut} /></td>
                            <td className="px-4 py-3 max-w-[160px]">
                              {isRejetee && (d.motif_refus || d.motifRefus)
                                ? <span className="text-xs text-red-700 font-medium">{d.motif_refus || d.motifRefus}</span>
                                : <span className="text-xs text-gray-300">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MESSAGERIE ── */}
        {/* ✅ FIX 2 : prop "user" passée à ChatPanel */}
        {activeTab === "chat" && <ChatPanel user={{ id: CURRENT_USER_ID }} />}

        {/* ── PROFIL ── */}
        {activeTab === "profil" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-700 to-green-600 px-8 py-8 flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-black text-lg">Mon Profil</h2>
                <p className="text-green-100 text-sm mt-0.5">Informations personnelles</p>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
              {[
                { label: "Dossiers soumis", val: demandes.length, color: "text-gray-700" },
                { label: "Validés",          val: nbValidees,      color: "text-emerald-600" },
                { label: "En attente",       val: nbEnAttente,     color: "text-amber-600" },
              ].map(({ label, val, color }) => (
                <div key={label} className="py-5 text-center">
                  <p className={`text-2xl font-black ${color}`}>{val}</p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className="px-8 py-6">
              <p className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4">Informations du compte</p>
              {[
                { label: "Nom complet",       value: "—" },
                { label: "Fonction",          value: "—" },
                { label: "Téléphone",         value: "—" },
                { label: "Date de naissance", value: "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedPieces && <PiecesModal pieces={selectedPieces} onClose={() => setSelectedPieces(null)} />}
    </div>
  );
}