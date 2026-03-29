const { sequelize } = require("../config/db");
const User = require("./User");
const Prise = require("./Prise");
const Clinique = require("./Clinique");
const Dossier = require("./Dossier");
const PieceDossier = require("./PieceDossier");

// 🔗 Relations existantes
User.hasMany(Prise, { foreignKey: "userId", as: "historique" });
Prise.belongsTo(User, { foreignKey: "userId" });

// ✅ RENOMMÉ : 'pieces' → 'piecesJointes' pour éviter le conflit
// avec le champ JSON 'pieces' du modèle Prestation
Dossier.hasMany(PieceDossier, { as: 'piecesJointes', foreignKey: 'dossierId' });
PieceDossier.belongsTo(Dossier, { foreignKey: 'dossierId' });

module.exports = { 
  sequelize, 
  User, 
  Prise, 
  Clinique,
  Dossier, 
  PieceDossier 
};