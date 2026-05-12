const bcrypt = require("bcrypt");
const { sequelize } = require("./config/db");
const User = require("./models/User");

async function fixPasswords() {
  const users = await User.findAll();
  for (let user of users) {
    // ✅ Ne hasher que les mots de passe en clair
    const isBcrypt = user.password.startsWith("$2b$") || user.password.startsWith("$2a$");
    if (!isBcrypt) {
      const hashed = await bcrypt.hash(user.password, 10);
      await user.update({ password: hashed });
      console.log(`✅ Hashé : ${user.email}`);
    } else {
      console.log(`⏭️ Déjà hashé : ${user.email}`);
    }
  }
  process.exit();
}

fixPasswords();