const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Clinic = sequelize.define("Clinic", {
  nom: DataTypes.STRING,
  numeroSequence: DataTypes.STRING,
  type: DataTypes.STRING,
  adresse: DataTypes.STRING,
  telephone: DataTypes.STRING,
  email: DataTypes.STRING,
  services: DataTypes.TEXT // JSON stocké sous forme de texte
}, {
  tableName: "clinics",
  timestamps: true,
  createdAt: "dateAjout",
  updatedAt: false
});

module.exports = Clinic;