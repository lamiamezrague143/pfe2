const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Prestation = sequelize.define('Prestation', {
  titre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pieces: {
    type: DataTypes.JSON, 
    allowNull: true
  }
});

module.exports = Prestation;