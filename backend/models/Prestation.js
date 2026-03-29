// models/Prestation.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db"); // Vérifie bien ce chemin

const Prestation = sequelize.define('Prestation', {
  titre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pieces: {
    type: DataTypes.JSON, 
    allowNull: false,
    defaultValue: []
  }
}, {
  tableName: 'prestations',
  timestamps: true
});

module.exports = Prestation; // <--- Exportation directe