const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Fichier = sequelize.define('Fichier', {
  nom_original: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nom_stockage: {
    type: DataTypes.STRING,
    allowNull: true,        // ✅ optionnel maintenant (plus utilisé pour les images BDD)
  },
  chemin: {
    type: DataTypes.STRING,
    allowNull: true,        // ✅ optionnel : NULL si le fichier est stocké en base64
  },
  data: {
    type: DataTypes.TEXT('long'),  // ✅ NOUVEAU : contenu base64, pour stockage 100% BDD
    allowNull: true,
  },
  mime_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  taille: {
    type: DataTypes.INTEGER
  },
  entite_type: {
    type: DataTypes.ENUM('prise_en_charge', 'prestation', 'beneficiaire', 'dossier', 'message'), // ✅ ajouté 'message'
    allowNull: false
  },
  entite_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'fichiers',
  timestamps: true,
  underscored: true
});

module.exports = Fichier;