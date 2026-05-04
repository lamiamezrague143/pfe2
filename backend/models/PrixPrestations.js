const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const PrixPrestations = sequelize.define("PrixPrestations", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cliniqueId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "clinique_id"
  },
  prix: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: "prestations_clinique",
  timestamps: false,
});

module.exports = PrixPrestations;