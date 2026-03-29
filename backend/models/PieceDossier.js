// models/PieceDossier.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PieceDossier = sequelize.define('PieceDossier', {
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dossierId: { // Vérifie que cette colonne existe si tu la gères manuellement
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = PieceDossier; // <--- VÉRIFIE CETTE LIGNE