const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  "databaselocal",   // nom de la base
  "root",         // utilisateur
  "Mezrague2026@",             // mot de passe (important)
  {
    host: "localhost",
    dialect: "mysql"
  }
);

module.exports = sequelize;