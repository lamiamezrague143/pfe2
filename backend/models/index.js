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
Prise.belongsTo(User,              { foreignKey: "userId" });

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
};