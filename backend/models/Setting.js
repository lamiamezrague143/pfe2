// models/Setting.js
const { DataTypes } = require('sequelize');
// ✅ CORRECTION : Utilise l'import destructuré comme dans ton config/db
const { sequelize } = require('../config/db'); 

const Setting = sequelize.define('Setting', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  value: {
    type: DataTypes.STRING, 
    allowNull: false
  }
}, {
  tableName: 'settings',
  timestamps: true
});

module.exports = Setting;