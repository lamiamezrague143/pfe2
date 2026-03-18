const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db");

  const User = require("./models/User");
sequelize.authenticate()
  .then(() => console.log("✅ Connexion MySQL réussie"))
  .catch(err => console.log("❌ Erreur connexion :", err));


sequelize.sync()
  .then(() => console.log("✅ Tables créées"))
  .catch(err => console.log(err));