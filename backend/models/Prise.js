const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Prise = sequelize.define("Prise", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  ref: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  // ✅ AJOUTE CETTE LIGNE ICI
  numeroSequentiel: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  dateForm: {
    type: DataTypes.STRING,
  },

  prestation: DataTypes.STRING,

  conventionStartDate: DataTypes.DATEONLY,
  conventionEndDate: DataTypes.DATEONLY,

  // 🔹 Fonctionnaire
  fNom: DataTypes.STRING,
  fPrenom: DataTypes.STRING,
  fDateLieu: DataTypes.STRING,
  fFonction: DataTypes.STRING,
  fVivant: DataTypes.STRING,

  // 🔹 Patient
  pNom: DataTypes.STRING,
  pPrenom: DataTypes.STRING,
  pDateLieu: DataTypes.STRING,

  pLien: {
    type: DataTypes.ENUM("epoux", "epouse", "enfant", "ascendant", "Lui-même"),
    allowNull: true,
  },

  // 🔹 Montants
  montantTotal: DataTypes.FLOAT,
  montantOS: DataTypes.FLOAT,
  montantPerso: DataTypes.FLOAT,

  // 🔹 NB
  nbDate: DataTypes.STRING,
  nbDelivre: DataTypes.STRING,

  // 🔹 Clinique
  sfEtablissement: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  statut: {
  type: DataTypes.ENUM('Active', 'Annulée'),
  defaultValue: 'Active'
},
annule: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
},
agentNom: {
  type: DataTypes.STRING,
  allowNull: false
}

}, {
  tableName: "prises_en_charge",
  timestamps: true,
});

module.exports = Prise;