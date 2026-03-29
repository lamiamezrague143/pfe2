// config/db.js
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  "databaselocal",    // nom de la base
  "root",             // utilisateur
  "Mezrague2026@",    // mot de passe
  {
    host: "localhost",
    dialect: "mysql",
    logging: false
  }
);

// Fonction pour tester la connexion
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connexion MySQL réussie !");
  } catch (err) {
    console.error("Erreur connexion MySQL :", err);
  }
};

module.exports = { sequelize, connectDB };