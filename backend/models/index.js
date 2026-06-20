const { sequelize } = require("../config/db");

// ── Imports des modèles ───────────────────────────────────────
const User          = require("./User");
const Dossier       = require("./Dossier");
const PieceDossier  = require("./PieceDossier");
const Prestation    = require("./Prestation");
const StatutDossier = require("./StatutDossier");
const Prise         = require("./Prise");
const Clinique      = require("./Clinique");
const Setting       = require("./Setting");
const Fichier       = require("./Fichier");  // ← AJOUTER

// ── Associations ──────────────────────────────────────────────
// Dossier ↔ PieceDossier
Dossier.hasMany(PieceDossier,      { foreignKey: "dossierId",    as: "piecesJointes" });
PieceDossier.belongsTo(Dossier,    { foreignKey: "dossierId" });
// PieceDossier ↔ Prestation
PieceDossier.belongsTo(Prestation, { foreignKey: "prestationId" });
Prestation.hasMany(PieceDossier,   { foreignKey: "prestationId" });
// StatutDossier ↔ User
StatutDossier.belongsTo(User,      { foreignKey: "userId" });
User.hasMany(StatutDossier,        { foreignKey: "userId" });
// Prise ↔ User
User.hasMany(Prise,                { foreignKey: "userId", as: "historique" });
Prise.belongsTo(User,             { foreignKey: "userId" });

// Fichier ↔ Dossier                          ← AJOUTER
Dossier.hasMany(Fichier, { foreignKey: "entite_id", scope: { entite_type: "dossier" }, as: "fichiers", constraints: false });
Fichier.belongsTo(Dossier, { foreignKey: "entite_id", constraints: false });

// Fichier ↔ Prise                            ← AJOUTER
Prise.hasMany(Fichier, { foreignKey: "entite_id", scope: { entite_type: "prise_en_charge" }, as: "fichiers", constraints: false });
Fichier.belongsTo(Prise, { foreignKey: "entite_id", constraints: false });

// ── Export ────────────────────────────────────────────────────
module.exports = {
  sequelize,
  User,
  Dossier,
  PieceDossier,
  Prestation,
  StatutDossier,
  Prise,
  Clinique,
  Setting,
  Fichier,       // ← AJOUTER
};