const { sequelize } = require("../config/db");






// ✅ importer directement
const User = require("./User");
const Prise = require("./Prise");
const Clinique = require("./Clinique");
const Dossier = require("./Dossier");
const PieceDossier = require("./PieceDossier");
const Prestation = require("./Prestation");
const Setting = require('./Setting');

// Relations
User.hasMany(Prise, { foreignKey: "userId", as: "historique" });
Prise.belongsTo(User, { foreignKey: "userId" });

// Dans models/index.js
Dossier.hasMany(PieceDossier, { 
  foreignKey: 'dossierId', 
  as: 'piecesJointes' 
});

PieceDossier.belongsTo(Dossier, { 
  foreignKey: 'dossierId' 
});

// Export
module.exports = { 
  sequelize, 
  User, 
  Prise, 
  Clinique,
  Dossier, 
  PieceDossier,
  Prestation,
  Setting
};