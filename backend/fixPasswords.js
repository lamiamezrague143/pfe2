const bcrypt = require("bcrypt");
const { sequelize } = require("./config/db");
const User = require("./models/User");

async function fixPasswords() {
  const users = await User.findAll();

  for (let user of users) {
    const hashed = await bcrypt.hash(user.password, 10);

    await user.update({ password: hashed });
  }

  console.log("✅ Tous les mots de passe sont hashés !");
  process.exit();
}

fixPasswords();