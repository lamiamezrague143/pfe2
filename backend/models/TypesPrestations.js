const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const TypesPrestations = sequelize.define("TypesPrestations", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: "types_prestations", // 👈 IMPORTANT (nom exact de ta table)
  timestamps: false,        // si ta table n'a pas createdAt / updatedAt
});

module.exports = TypesPrestations;