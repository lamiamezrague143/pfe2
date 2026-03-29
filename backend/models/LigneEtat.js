//pour gerer les beneficiare 

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Etat = require("./Etat");

const LigneEtat = sequelize.define("LigneEtat", {
  designation: { type: DataTypes.STRING, allowNull: false },
  numero_compte: { type: DataTypes.STRING, allowNull: true },
  montants: { 
    type: DataTypes.JSON, 
    allowNull: false,
    comment: "Stocke les valeurs numériques indexées par ID de colonne"
  },
  etatId: {
    type: DataTypes.INTEGER,
    references: {
      model: Etat,
      key: 'id'
    }
  }
}, {
  tableName: "lignes_etat"
});

// Définition de la relation
Etat.hasMany(LigneEtat, { as: "lignes", foreignKey: "etatId", onDelete: "CASCADE" });
LigneEtat.belongsTo(Etat, { foreignKey: "etatId" });

module.exports = LigneEtat;