const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Dossier = sequelize.define('Dossier', {
  num_sequence: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true 
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
  }
}, {
  tableName: 'dossiers',
  timestamps: true
});

module.exports = Dossier;