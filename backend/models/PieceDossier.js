const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const PieceDossier = sequelize.define('PieceDossier', {
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  prestationId: { 
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Prestations', 
      key: 'id'
    }
  },
  dossierId: {  // ✅ AJOUTE ÇA
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Dossiers',
      key: 'id'
    }
  }
}, {
  tableName: 'pieces_dossiers'
});
module.exports = PieceDossier;