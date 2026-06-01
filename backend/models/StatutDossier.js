// models/StatutDossier.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const StatutDossier = sequelize.define("StatutDossier", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "Users", key: "id" },
    onDelete: "CASCADE",
  },

  dossierRef: {
    type: DataTypes.STRING,
    allowNull: true,
  },

typePret: {
  type: DataTypes.STRING,
  allowNull: false,
},
  statut: {
    type: DataTypes.ENUM("en_attente", "en_cours", "valide", "refuse"),
    allowNull: false,
    defaultValue: "en_attente",
  },

  motifRefus: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  dateDepot: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },

  updatedBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: "StatutDossiers",
  timestamps: true,
});
StatutDossier.associate = (models) => {
  StatutDossier.belongsTo(models.User, { foreignKey: "userId" });
};

module.exports = StatutDossier;
