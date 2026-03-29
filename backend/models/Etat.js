
//pour gerer les entete 

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Etat = sequelize.define("Etat", {
  num_etat: { type: DataTypes.STRING, allowNull: false },
  gestion: { type: DataTypes.STRING, allowNull: false },
  section: { type: DataTypes.STRING, allowNull: true },
  num_mandat: { type: DataTypes.STRING, allowNull: true },
  date_doc: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  mois: { type: DataTypes.STRING, allowNull: false },
  mode_paiement: { type: DataTypes.STRING, defaultValue: "CCP" },
  categorie_personnel: { type: DataTypes.STRING, allowNull: true },
  etablissement: { type: DataTypes.STRING, allowNull: true },
  colonnes: { 
    type: DataTypes.JSON, 
    allowNull: false,
    comment: "Stocke la structure des colonnes dynamiques"
  }
}, {
  tableName: "etats"
});

module.exports = Etat;