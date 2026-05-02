const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Archive = sequelize.define('Archive', {
  nomDossier: {
    type: DataTypes.STRING,
    allowNull: false
  },

  fichiers: {
    type: DataTypes.JSON, // ✅ tableau de fichiers
    allowNull: false
  }
});

module.exports = Archive;