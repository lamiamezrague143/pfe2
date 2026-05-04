"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:5001/api/archives";

const STATUS_LABELS = {
  open: { label: "Ouvert", color: "#166534", bg: "rgba(21,128,61,0.1)" },
  pending: { label: "En attente", color: "#92400e", bg: "rgba(234,179,8,0.12)" },
  closed: { label: "Clôturé", color: "#6b7280", bg: "#f3f4f6" },
};

const DOC_ICON = (name = "") => {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "pdf") return "📕";
  if (["doc", "docx"].includes(ext)) return "📘";
  if (["jpg", "jpeg", "png", "gif"].includes(ext)) return "🖼️";
  return "📄";
};

const StatusBadge = ({ status }) => {
  const s = STATUS_LABELS[status] || STATUS_LABELS.open;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 500,
        color: s.color,
        background: s.bg,
      }}
    >
      {s.label}
    </span>
  );
};

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        background: "#166534",
        color: "white",
        padding: "10px 18px",
        borderRadius: 8,
        fontSize: 13,
        zIndex: 9999,
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        animation: "slideup .2s ease",
      }}
    >
      {message}
      <style>{`@keyframes slideup{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
};

// ─── Modal component ────────────────────────────────────────────────
const Modal = ({ title, onClose, footer, children }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
    }}
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div
      style={{
        background: "white",
        borderRadius: 16,
        width: 520,
        maxWidth: "95vw",
        overflow: "hidden",
        border: "0.5px solid #e5e7eb",
      }}
    >
      <div
        style={{
          background: "#166534",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3 style={{ color: "white", fontSize: 15, fontWeight: 500, margin: 0 }}>
          {title}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "none",
            color: "white",
            width: 28,
            height: 28,
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
      {footer && (
        <div
          style={{
            padding: "12px 20px",
            borderTop: "0.5px solid #e5e7eb",
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  </div>
);

// ─── Styled input helpers ────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "0.5px solid #d1d5db",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const Field = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <label style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{label}</label>
    {children}
  </div>
);

// ────────────────────────────────────────────────────────────────────
export default function ArchivePVPage() {
  const router = useRouter();

  // List state
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // New PV form
  const [nomDossier, setNomDossier] = useState("");
  const [datePV, setDatePV] = useState("");
  const [nbPages, setNbPages] = useState("");
  const [status, setStatus] = useState("open");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

  // Modals
  const [viewPV, setViewPV] = useState(null);
  const [editPV, setEditPV] = useState(null);
  const [editNom, setEditNom] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPages, setEditPages] = useState("");
  const [editStatus, setEditStatus] = useState("open");
  const [editDesc, setEditDesc] = useState("");

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg) => setToast(msg);

  // ── Load archives ────────────────────────────────────────────────
  const loadArchives = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterStatus) params.status = filterStatus;
      const res = await axios.get(API_URL, { params });
      setArchives(Array.isArray(res.data) ? res.data : res.data.archives || []);
    } catch (err) {
      console.error(err);
      showToast("❌ Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => loadArchives(), 300);
    return () => clearTimeout(delay);
  }, [searchTerm, filterStatus]);

  // ── Upload ───────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!nomDossier.trim()) {
      showToast("❌ Le nom du dossier est requis");
      return;
    }
    const formData = new FormData();
    formData.append("nomDossier", nomDossier);
    formData.append("date", datePV);
    formData.append("pages", nbPages);
    formData.append("status", status);
    formData.append("description", description);
    files.forEach((f) => formData.append("files", f));
    try {
      await axios.post(`${API_URL}/upload`, formData);
      resetForm();
      loadArchives();
      showToast("✅ PV enregistré avec succès");
    } catch (err) {
      console.error(err);
      showToast("❌ Erreur lors de l'enregistrement");
    }
  };

  const resetForm = () => {
    setNomDossier("");
    setDatePV("");
    setNbPages("");
    setStatus("open");
    setDescription("");
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Delete ───────────────────────────────────────────────────────
  const deleteArchive = async (id) => {
    if (!confirm("Supprimer ce PV définitivement ?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      loadArchives();
      showToast("🗑️ PV supprimé");
      setViewPV(null);
      setEditPV(null);
    } catch {
      showToast("❌ Erreur suppression");
    }
  };

  // ── Update ───────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!editNom.trim()) {
      showToast("❌ Le nom est requis");
      return;
    }
    try {
      await axios.put(`${API_URL}/${editPV.id}`, {
        nomDossier: editNom,
        date: editDate,
        pages: editPages,
        status: editStatus,
        description: editDesc,
      });
      setEditPV(null);
      loadArchives();
      showToast("✅ PV mis à jour");
    } catch {
      showToast("❌ Erreur modification");
    }
  };

  // ── Open edit modal ──────────────────────────────────────────────
  const openEdit = (arc) => {
    setEditPV(arc);
    setEditNom(arc.nomDossier || "");
    setEditDate(arc.date || "");
    setEditPages(arc.pages || "");
    setEditStatus(arc.status || "open");
    setEditDesc(arc.description || "");
  };

  // ── File handling ────────────────────────────────────────────────
  const addFiles = (newFiles) => setFiles((prev) => [...prev, ...newFiles]);
  const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  // ── Stats ────────────────────────────────────────────────────────
  const totalPages = archives.reduce((a, p) => a + (parseInt(p.pages) || 0), 0);
  const totalFichiers = archives.reduce(
    (a, p) => a + (Array.isArray(p.fichiers) ? p.fichiers.length : 0),
    0
  );

  // ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto", fontFamily: "inherit" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.push("/")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#f3f4f6", border: "0.5px solid #e5e7eb",
            color: "#374151", fontSize: 13, fontWeight: 500,
            padding: "7px 14px", borderRadius: 8, cursor: "pointer",
          }}
        >
          ← Retour
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#111827", margin: 0 }}>
          📁 Gestion des procès-verbaux
        </h1>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { num: archives.length, label: "PV total" },
          { num: totalPages, label: "Pages enregistrées" },
          { num: totalFichiers, label: "Fichiers archivés" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#f9fafb", borderRadius: 8, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#166534" }}>{s.num}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* FORM */}
      <div style={{ background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 14 }}>
          Nouveau procès-verbal
        </p>
        <form onSubmit={handleUpload}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Nom du dossier *">
              <input style={inputStyle} type="text" value={nomDossier} onChange={(e) => setNomDossier(e.target.value)} placeholder="ex: PV Conseil du 03/05/2025" />
            </Field>
            <Field label="Date du PV">
              <input style={inputStyle} type="date" value={datePV} onChange={(e) => setDatePV(e.target.value)} />
            </Field>
            <Field label="Nombre de pages">
              <input style={inputStyle} type="text" value={nbPages} onChange={(e) => setNbPages(e.target.value)} placeholder="ex: 12" />
            </Field>
            <Field label="Statut">
              <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="open">Ouvert</option>
                <option value="pending">En attente</option>
                <option value="closed">Clôturé</option>
              </select>
            </Field>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Description / Objet du PV">
                <textarea
                  style={{ ...inputStyle, minHeight: 70, resize: "vertical", lineHeight: 1.5 }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Résumé, ordre du jour, remarques..."
                />
              </Field>
            </div>

            {/* DROP ZONE */}
            <div
              style={{
                gridColumn: "1/-1",
                border: `1.5px dashed ${dragging ? "#16a34a" : "#d1d5db"}`,
                borderRadius: 8,
                padding: 18,
                textAlign: "center",
                cursor: "pointer",
                background: dragging ? "rgba(21,128,61,0.04)" : "#f9fafb",
                position: "relative",
                transition: "all .15s",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                accept=".pdf,.doc,.docx,.jpg,.png,.jpeg"
                onChange={(e) => addFiles(Array.from(e.target.files))}
              />
              <p style={{ fontSize: 13, color: "#6b7280" }}>
                Déposez vos fichiers ici ou{" "}
                <span style={{ color: "#16a34a", fontWeight: 500 }}>cliquez pour parcourir</span>
              </p>
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>PDF, Word, Images — plusieurs pages acceptées</p>

              {files.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
                  {files.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "rgba(21,128,61,0.08)", border: "0.5px solid rgba(21,128,61,0.2)",
                        color: "#166534", fontSize: 12, padding: "4px 10px", borderRadius: 20,
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{DOC_ICON(f.name)}</span>
                      <span>{f.name.length > 25 ? f.name.substring(0, 22) + "…" : f.name}</span>
                      <span
                        style={{ cursor: "pointer", fontWeight: 600, marginLeft: 2, color: "#16a34a" }}
                        onClick={() => removeFile(i)}
                      >×</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button
              type="button"
              onClick={resetForm}
              style={{ background: "transparent", border: "0.5px solid #d1d5db", color: "#6b7280", padding: "8px 18px", borderRadius: 8, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={{ background: "#166534", color: "white", border: "none", padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
            >
              Enregistrer le PV
            </button>
          </div>
        </form>
      </div>

      {/* SEARCH + FILTER */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 15, pointerEvents: "none" }}>⌕</span>
          <input
            style={{ ...inputStyle, paddingLeft: 34 }}
            type="text"
            placeholder="Rechercher un PV par nom, date, statut..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          style={{ ...inputStyle, width: "auto", paddingRight: 28 }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="open">Ouvert</option>
          <option value="pending">En attente</option>
          <option value="closed">Clôturé</option>
        </select>
      </div>

      {/* TABLE */}
      <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em" }}>Archives des PV</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
              {["Dossier PV", "Date", "Pages", "Fichiers", "Statut", ""].map((h) => (
                <th key={h} style={{ padding: "8px 12px", textAlign: h === "" ? "right" : "left", fontSize: 11, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".04em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "#9ca3af" }}>Chargement…</td></tr>
            ) : archives.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "#9ca3af" }}>Aucun PV trouvé</td></tr>
            ) : (
              archives.map((arc) => (
                <tr
                  key={arc.id}
                  style={{ borderBottom: "0.5px solid #f3f4f6", cursor: "pointer", transition: "background .1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  onClick={() => setViewPV(arc)}
                >
                  <td style={{ padding: "10px 12px", fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {arc.nomDossier}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#6b7280" }}>
                    {arc.date ? new Date(arc.date).toLocaleDateString("fr-FR") : arc.createdAt ? new Date(arc.createdAt).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#6b7280" }}>
                    {arc.pages ? `📄 ${arc.pages}` : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#6b7280" }}>
                    {Array.isArray(arc.fichiers) && arc.fichiers.length
                      ? `${arc.fichiers.length} fichier${arc.fichiers.length > 1 ? "s" : ""}`
                      : "—"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <StatusBadge status={arc.status || "open"} />
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      {/* Fichiers téléchargeables */}
                      {Array.isArray(arc.fichiers) && arc.fichiers.map((f, i) => (
                        <a
                          key={i}
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          title={f.nom}
                          style={{ fontSize: 16, textDecoration: "none" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {DOC_ICON(f.nom)}
                        </a>
                      ))}
                      <button
                        onClick={() => setViewPV(arc)}
                        style={iconBtnStyle}
                        title="Voir"
                      >👁</button>
                      <button
                        onClick={() => openEdit(arc)}
                        style={iconBtnStyle}
                        title="Modifier"
                      >✏️</button>
                      <button
                        onClick={() => deleteArchive(arc.id)}
                        style={{ ...iconBtnStyle, color: "#dc2626" }}
                        title="Supprimer"
                      >🗑</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── VIEW MODAL ─────────────────────────────────────────────── */}
      {viewPV && (
        <Modal
          title={viewPV.nomDossier}
          onClose={() => setViewPV(null)}
          footer={
            <>
              <button onClick={() => setViewPV(null)} style={outlineBtn}>Fermer</button>
              <button onClick={() => { setViewPV(null); openEdit(viewPV); }} style={primaryBtn}>Modifier</button>
            </>
          }
        >
          {[
            ["Date", viewPV.date ? new Date(viewPV.date).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—"],
            ["Pages", viewPV.pages || "—"],
            ["Statut", null],
            ["Créé le", viewPV.createdAt ? new Date(viewPV.createdAt).toLocaleDateString("fr-FR") : "—"],
          ].map(([lbl, val]) => (
            <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "0.5px solid #f3f4f6", fontSize: 13 }}>
              <span style={{ color: "#6b7280" }}>{lbl}</span>
              <span style={{ fontWeight: 500 }}>
                {lbl === "Statut" ? <StatusBadge status={viewPV.status || "open"} /> : val}
              </span>
            </div>
          ))}
          {viewPV.description && (
            <div style={{ padding: "9px 0", borderBottom: "0.5px solid #f3f4f6", fontSize: 13 }}>
              <p style={{ color: "#6b7280", marginBottom: 6 }}>Description</p>
              <p style={{ lineHeight: 1.6 }}>{viewPV.description}</p>
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>
              Fichiers joints ({Array.isArray(viewPV.fichiers) ? viewPV.fichiers.length : 0})
            </p>
            {Array.isArray(viewPV.fichiers) && viewPV.fichiers.length > 0
              ? viewPV.fichiers.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#f9fafb", borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                    <span>{DOC_ICON(f.nom)}</span>
                    <a href={f.url} target="_blank" rel="noreferrer" style={{ color: "#166534", textDecoration: "none", flex: 1 }}>{f.nom}</a>
                    <span style={{ color: "#9ca3af", fontSize: 11 }}>{f.size ? Math.round(f.size / 1024) + " ko" : ""}</span>
                  </div>
                ))
              : <p style={{ fontSize: 13, color: "#9ca3af" }}>Aucun fichier joint</p>
            }
          </div>
        </Modal>
      )}

      {/* ── EDIT MODAL ─────────────────────────────────────────────── */}
      {editPV && (
        <Modal
          title="Modifier le PV"
          onClose={() => setEditPV(null)}
          footer={
            <>
              <button onClick={() => deleteArchive(editPV.id)} style={dangerBtn}>Supprimer</button>
              <button onClick={() => setEditPV(null)} style={outlineBtn}>Annuler</button>
              <button onClick={handleUpdate} style={primaryBtn}>Enregistrer</button>
            </>
          }
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Nom du dossier *">
              <input style={inputStyle} type="text" value={editNom} onChange={(e) => setEditNom(e.target.value)} />
            </Field>
            <Field label="Date du PV">
              <input style={inputStyle} type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </Field>
            <Field label="Nombre de pages">
              <input style={inputStyle} type="text" value={editPages} onChange={(e) => setEditPages(e.target.value)} />
            </Field>
            <Field label="Statut">
              <select style={inputStyle} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="open">Ouvert</option>
                <option value="pending">En attente</option>
                <option value="closed">Clôturé</option>
              </select>
            </Field>
            <div style={{ gridColumn: "1/-1" }}>
              <Field label="Description">
                <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </Field>
            </div>
          </div>
        </Modal>
      )}

      {/* TOAST */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Button styles ──────────────────────────────────────────────────
const primaryBtn = {
  background: "#166534", color: "white", border: "none",
  padding: "8px 18px", borderRadius: 8, fontSize: 14, fontWeight: 500,
  cursor: "pointer", fontFamily: "inherit",
};
const outlineBtn = {
  background: "transparent", color: "#6b7280", border: "0.5px solid #d1d5db",
  padding: "8px 18px", borderRadius: 8, fontSize: 14,
  cursor: "pointer", fontFamily: "inherit",
};
const dangerBtn = {
  background: "#dc2626", color: "white", border: "none",
  padding: "8px 16px", borderRadius: 8, fontSize: 14,
  cursor: "pointer", fontFamily: "inherit",
};
const iconBtnStyle = {
  width: 30, height: 30, border: "0.5px solid #e5e7eb", borderRadius: 8,
  background: "transparent", cursor: "pointer", fontSize: 14,
  display: "flex", alignItems: "center", justifyContent: "center",
};