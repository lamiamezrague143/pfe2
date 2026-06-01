"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

// ─── HELPERS ─────────────────────────────
const fmt = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d)
    ? dateStr
    : d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
};

const fmtDateTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return isNaN(d)
    ? dateStr
    : d.toLocaleDateString("fr-FR") +
        " à " +
        d.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
};

// ✅ FIX: on reçoit la chaîne complète, on prend juste la 1ère lettre de chaque mot
const initials = (fullName = "", fallback = "") => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts[0]) return parts[0][0].toUpperCase();
  return fallback?.[0]?.toUpperCase() || "?";
};

// ─── COLORS ─────────────────────────────
const GREEN = "#10b981";
const GREEN_DARK = "#047857";

const ROLE_COLORS = {
  president:    { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
  secretariat:  { bg: "#eff6ff", color: "#1e3a8a", border: "#bfdbfe" },
  comptable:    { bg: "#faf5ff", color: "#6b21a8", border: "#ddd6fe" },
  ingenieur:    { bg: "#ecfeff", color: "#155e75", border: "#a5f3fc" },
  agent:        { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" },
  beneficiaire: { bg: "#fff1f2", color: "#9f1239", border: "#fecdd3" },
};

// ─── UI COMPONENTS ─────────────────────────────
const Badge = ({ children, bg, color, border }) => (
  <span
    style={{
      fontSize: 12,
      padding: "6px 12px",
      borderRadius: 999,
      fontWeight: 600,
      border: `1px solid ${border}`,
      background: bg,
      color,
      display: "inline-flex",
      gap: 6,
      alignItems: "center",
    }}
  >
    {children}
  </span>
);

const Card = ({ children }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 18,
      border: "1px solid #e5e7eb",
      boxShadow: "0 8px 25px rgba(0,0,0,0.05)",
      padding: 22,
    }}
  >
    {children}
  </div>
);

const Section = ({ title, icon, children }) => (
  <Card>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 16,
        fontWeight: 700,
        fontSize: 13,
        color: GREEN_DARK,
        textTransform: "uppercase",
        letterSpacing: 1,
      }}
    >
      <i className={`ti ti-${icon}`} />
      {title}
    </div>
    {children}
  </Card>
);

const Info = ({ label, value, icon }) => (
  <div
    style={{
      padding: 14,
      borderRadius: 14,
      background: "#f9fafb",
      border: "1px solid #eef2f7",
      transition: "transform 0.2s",
    }}
    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    <div style={{ fontSize: 12, color: "#6b7280", display: "flex", gap: 6 }}>
      <i className={`ti ti-${icon}`} />
      {label}
    </div>
    <div style={{ fontWeight: 600, marginTop: 6, color: "#111827" }}>
      {value || "—"}
    </div>
  </div>
);

// ─── AVATAR ─────────────────────────────
// ✅ FIX: width/height 100% sur le div initiales + gestion erreur image
const Avatar = ({ photo, nom, prenom }) => {
  const [imgError, setImgError] = useState(false);
  const showPhoto = photo && !imgError;

  return (
    <div
      style={{
        width: 85,
        height: 85,
        borderRadius: "50%",
        border: "4px solid #fff",
        background: showPhoto ? "#f3f4f6" : GREEN,
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {showPhoto ? (
        <img
          src={photo}
          alt="Profil"
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span
          style={{
            fontWeight: 700,
            fontSize: 26,
            color: "#fff",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {initials(`${nom || ""} ${prenom || ""}`)}
        </span>
      )}
    </div>
  );
};

// ─── PAGE ─────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");

        // ✅ FIX: redirect si pas de token
        if (!token) {
          router.replace("/login");
          return;
        }

        const res = await axios.get("http://localhost:5001/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data);
      } catch (err) {
        console.error("Erreur fetchUser:", err);

        // Token expiré ou invalide → redirection
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          router.replace("/login");
        } else {
          setError("Impossible de charger le profil.");
        }
      }
    };

    fetchUser();
  }, []);

  if (error)
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#ef4444" }}>
        {error}
      </div>
    );

  if (!user)
    return (
      <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
        Chargement...
      </div>
    );

  // ✅ FIX: photo URL correcte — on vérifie que ce n'est pas "default.jpg" ou vide
  const photo =
    user.photo && user.photo !== "default.jpg"
      ? `http://localhost:5001/uploads/${user.photo}`
      : null;

  const role = ROLE_COLORS[user.roleSystem] || ROLE_COLORS.agent;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#ecfdf5,#f9fafb)",
        padding: 30,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "auto" }}>

        {/* 🔙 BOUTON RETOUR */}
        <button
          onClick={() => router.back()}
          style={{
            marginBottom: 20,
            background: "#fff",
            border: "1px solid #e5e7eb",
            width: 42,
            height: 42,
            borderRadius: "50%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateX(-3px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateX(0)")}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 18 }} />
        </button>

        {/* HERO */}
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            marginBottom: 25,
          }}
        >
          <div
            style={{
              height: 80,
              background: `linear-gradient(135deg, ${GREEN}, ${GREEN_DARK})`,
            }}
          />

          <div style={{ padding: 20, display: "flex", gap: 20, alignItems: "center" }}>

            {/* ✅ Composant Avatar isolé avec gestion erreur */}
            <Avatar
              photo={photo}
              nom={user.nomComplet}
              prenom={user.prenomComplet}
            />

            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111827" }}>
                {user.nomComplet} {user.prenomComplet}
              </h2>
              <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: 14 }}>
                {user.positionAdministrative} • {user.departement}
              </p>

              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge {...role}>{user.roleSystem}</Badge>
                <Badge bg="#ecfdf5" color={GREEN_DARK} border="#a7f3d0">
                  {user.sexe}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* SECTIONS */}
        <div style={{ display: "grid", gap: 20 }}>
          <Section title="Informations personnelles" icon="user">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Info label="Nom"       value={user.nomComplet}    icon="id" />
              <Info label="Prénom"    value={user.prenomComplet} icon="id" />
              <Info label="Naissance" value={fmt(user.dateNaissance)} icon="calendar" />
              <Info label="Lieu"      value={user.lieuNaissance} icon="map-pin" />
            </div>
          </Section>

          <Section title="Contact" icon="phone">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Info label="Téléphone" value={user.numero} icon="phone" />
              <Info label="Email"     value={user.email}  icon="mail" />
            </div>
          </Section>

          <Section title="Administration" icon="briefcase">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Info label="Position"   value={user.positionAdministrative} icon="briefcase" />
              <Info label="Département" value={user.departement}           icon="building" />
              <Info label="Rôle"       value={user.roleSystem}             icon="shield" />
            </div>
          </Section>

          <Section title="Activité" icon="clock">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Info label="Dernière connexion" value={fmtDateTime(user.lastLogin)} icon="clock" />
              <Info label="Créé le"            value={fmt(user.createdAt)}         icon="calendar" />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}