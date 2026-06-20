// config/db.js
require('dotenv').config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || "mysql",
    logging: false
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connexion MySQL réussie !");
  } catch (err) {
    console.error("Erreur connexion MySQL :", err);
  }
};

module.exports = { sequelize, connectDB };