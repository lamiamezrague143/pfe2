// models/PasswordResetOtp.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db'); // ✅ corrigé
const User = require('./User');

const PasswordResetOtp = sequelize.define('PasswordResetOtp', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  otp: {
    type: DataTypes.STRING(6),
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  used: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
  },
}, {
  tableName: 'password_reset_otps',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});
PasswordResetOtp.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(PasswordResetOtp, { foreignKey: 'user_id' });

module.exports = PasswordResetOtp;