// models/Setting.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Setting = sequelize.define('Setting', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '0'  // ✅ Ajouter une valeur par défaut
  }
}, {
  tableName: 'settings',
  timestamps: true,
  freezeTableName: true  // ✅ Évite les problèmes de nommage
});

module.exports = Setting;