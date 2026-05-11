const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Dossier = sequelize.define('Dossier', {
  num_sequence: {
    type: DataTypes.STRING,
  },
  numero_dossier: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nom_beneficiaire: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type_prestation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fonction: {
    type: DataTypes.STRING,
    allowNull: true
  },
  faculte: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date_depot: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  statut: {
    type: DataTypes.ENUM('En attente', 'Validé', 'Rejeté'),
    defaultValue: 'En attente'
  },
  montant_avenant: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0
  },
  avis_commission: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'En attente'
  },
  // Champs spécifiques par type de prestation
  date_depart_retraite: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  nom_defunt: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nom_enfant: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date_mariage: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: 'dossiers',
  timestamps: true
});

module.exports = Dossier;